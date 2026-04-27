// src/controllers/paymentController.js
import Payment from '../models/Payment.js';
import Reservation from '../models/Reservation.js';
import Garage from '../models/Garage.js';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';
import { initializeChapaPayment, verifyChapaTransaction, chapaBankTransfer } from '../services/chapaService.js';

/**
 * Calculate commission split and credit garage owner's wallet.
 * Returns { rate, commissionAmount, garageEarnings }
 */
export async function applyCommissionAndCreditWallet(payment, garage, reservation) {
    const defaultRate = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.10');
    const rate = typeof garage?.commissionRate === 'number' ? garage.commissionRate : defaultRate;
    const base = (typeof payment.totalAmount === 'number' && payment.totalAmount >= 0)
        ? payment.totalAmount : payment.amount || 0;

    const commissionAmount = parseFloat((base * rate).toFixed(2));
    const garageEarnings = parseFloat((base - commissionAmount).toFixed(2));

    payment.commissionRate = rate;
    payment.commissionAmount = commissionAmount;
    payment.garageEarnings = garageEarnings;

    // Credit garage owner's wallet automatically
    if (garageEarnings > 0 && garage?.owner) {
        await User.findByIdAndUpdate(
            garage.owner,
            {
                $inc: {
                    'wallet.balance': garageEarnings,
                    'wallet.totalEarned': garageEarnings,
                },
                $push: {
                    'wallet.transactions': {
                        type: 'credit',
                        amount: garageEarnings,
                        description: `Earnings from ${reservation?.serviceType || 'service'} at ${garage.name}`,
                        paymentRef: payment._id,
                        reservationRef: reservation?._id,
                        balanceAfter: null, // updated below if needed
                        createdAt: new Date(),
                    },
                },
            }
        );
        logger.info(`Wallet credited: ${garageEarnings} ETB → garage owner ${garage.owner}`);
    }

    return { rate, commissionAmount, garageEarnings };
}

/**
 * Initiate payment for a reservation (owner only)
 */
export const initiatePayment = async (req, res, next) => {
    try {
        const { reservationId, amount, paymentMethod } = req.body;

        const reservation = await Reservation.findById(reservationId).populate('garage');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to pay for this reservation' });
        }

        // Block if already fully paid
        if (reservation.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'This reservation is already fully paid' });
        }

        // Calculate correct remaining amount
        const depositPaid = reservation.depositPaid ? (reservation.depositAmount || 0) : 0;
        const remaining = reservation.totalPrice - depositPaid;

        // Validate amount — must match remaining balance (allow small rounding tolerance)
        if (amount !== undefined && Math.abs(amount - remaining) > 1) {
            return res.status(400).json({
                success: false,
                message: `Incorrect amount. Remaining balance is ${remaining} ETB (total ${reservation.totalPrice} ETB minus deposit ${depositPaid} ETB)`,
            });
        }

        const finalAmount = remaining;

        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const payment = await Payment.create({
            reservation: reservationId,
            user: req.user.id,
            amount: finalAmount,
            paymentMethod,
            status: 'pending',
            transactionId,
            description: depositPaid > 0 ? `Remaining balance (deposit of ${depositPaid} ETB already paid)` : 'Full payment',
            metadata: { isRemainingBalance: true, depositAlreadyPaid: depositPaid },
        });

        // Notify garage owner
        try {
            const garage = reservation.garage;
            if (garage && garage.owner) {
                await createNotification({
                    recipient: garage.owner,
                    title: 'Payment Initiated',
                    message: `A car owner has initiated a ${paymentMethod} payment of ${finalAmount} ETB for ${reservation.serviceType || 'service'}.`,
                    type: 'payment_received',
                    relatedModel: 'Payment',
                    relatedId: payment._id,
                    actionUrl: '/bookings',
                    priority: 'high',
                });
            }
        } catch (notifError) {
            logger.error('Failed to send payment initiation notification', { error: notifError.message });
        }

        logger.info(`Payment initiated: ${payment._id} for reservation ${reservationId} — amount: ${finalAmount} ETB`);

        return res.status(201).json({
            success: true,
            message: 'Payment initiated successfully',
            data: payment,
        });
    } catch (error) {
        logger.error('Payment initiation failed', { error: error.message });
        next(error);
    }
};

/**
 * Verify payment status (e.g. after gateway callback or manual check)
 */
export const verifyPayment = async (req, res, next) => {
    try {
        const { paymentId, status } = req.body;

        const payment = await Payment.findById(paymentId).populate({
            path: 'reservation',
            populate: { path: 'garage' }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        // Only owner or admin can verify
        if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to verify this payment',
            });
        }

        payment.status = status;
        if (status === 'success') {
            payment.paymentDate = new Date();

            // Auto-split commission and credit garage owner wallet
            const garageDoc = payment.reservation.garage;
            await applyCommissionAndCreditWallet(payment, garageDoc, payment.reservation);
        }
        await payment.save();

        // Only mark reservation as fully paid if this is NOT a deposit payment
        if (status === 'success') {
            const isDeposit = payment.metadata?.isDeposit === true;
            if (!isDeposit) {
                await Reservation.findByIdAndUpdate(payment.reservation._id, {
                    paymentStatus: 'paid',
                });
            }

            // Notify garage owner — payment confirmed
            try {
                const garageId = payment.reservation.garage?._id || payment.reservation.garage;
                const garage = await Garage.findById(garageId);
                if (garage) {
                    await createNotification({
                        recipient: garage.owner,
                        title: 'Payment Confirmed',
                        message: `Payment of ${payment.amount} ETB confirmed for ${payment.reservation.serviceType || 'service'}.`,
                        type: 'payment_received',
                        relatedModel: 'Payment',
                        relatedId: payment._id,
                        actionUrl: '/bookings',
                        priority: 'high',
                    });
                    logger.info(`Payment confirmed notification sent to garage owner ${garage.owner}`);
                }
            } catch (notifError) {
                logger.error('Failed to create payment notification', { error: notifError.message });
            }

            // Notify car owner — payment success
            try {
                await createNotification({
                    recipient: payment.user,
                    title: 'Payment Successful',
                    message: `Your payment of ${payment.amount} ETB was successful.`,
                    type: 'payment_received',
                    relatedModel: 'Payment',
                    relatedId: payment._id,
                    actionUrl: '/my-reservations',
                    priority: 'high',
                });
            } catch (notifError) {
                logger.error('Failed to create car owner payment notification', { error: notifError.message });
            }
        }

        logger.info(`Payment verified: ${payment._id} - new status: ${status}`);

        return res.status(200).json({
            success: true,
            message: 'Payment status updated',
            data: payment,
        });
    } catch (error) {
        logger.error('Payment verification failed', { error: error.message });
        next(error);
    }
};

/**
 * Get status of a specific payment (owner or admin)
 */
export const getPaymentStatus = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment',
            });
        }

        return res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        logger.error('Get payment status failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all payments made by the current user
 */
export const getMyPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ user: req.user.id })
            .populate('reservation')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        logger.error('Get my payments failed', { error: error.message });
        next(error);
    }
};

/**
 * Get payment for a specific reservation
 */
export const getPaymentByReservation = async (req, res, next) => {
    try {
        const { reservationId } = req.params;

        const payment = await Payment.findOne({ reservation: reservationId })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'No payment found for this reservation',
            });
        }

        const reservation = await Reservation.findById(reservationId).populate('garage');
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        const isOwner = payment.user._id.toString() === req.user.id;
        const isGarageOwner = reservation.garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment',
            });
        }

        // build response object with additional info
        const result = payment.toObject();
        result.reservation = reservation; // include reservation with populated garage

        // compute effective commission using stored or current garage rate
        const garageRate = reservation.garage?.commissionRate || 0;
        result.effectiveCommissionRate =
            typeof result.commissionRate === 'number' && result.commissionRate > 0
                ? result.commissionRate
                : garageRate;
        result.effectiveCommissionAmount = parseFloat(
            ((result.amount || 0) * result.effectiveCommissionRate).toFixed(2)
        );
        result.effectiveGarageEarnings = parseFloat(
            ((result.amount || 0) - result.effectiveCommissionAmount).toFixed(2)
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Get payment by reservation failed', { error: error.message });
        next(error);
    }
};

/**
 * Verify payment as garage owner
 */
export const garageVerifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate({
            path: 'reservation',
            populate: { path: 'garage user' }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        const isGarageOwner = payment.reservation.garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only garage owner can verify payments',
            });
        }

        payment.status = 'success';
        payment.paymentDate = new Date();
        payment.isVerified = true;
        payment.verifiedAt = new Date();
        if (!payment.metadata) payment.metadata = {};
        payment.metadata.verifiedBy = req.user.id;
        payment.metadata.verificationMethod = 'manual_garage_owner';

        // Auto-split commission and credit garage owner wallet
        await applyCommissionAndCreditWallet(payment, payment.reservation.garage, payment.reservation);

        await payment.save();

        // Only mark reservation as fully paid if this is NOT a deposit payment
        const isDepositPayment = payment.metadata?.isDeposit === true;
        if (!isDepositPayment) {
            await Reservation.findByIdAndUpdate(payment.reservation._id, {
                paymentStatus: 'paid',
            });
        }

        try {
            await createNotification({
                recipient: payment.reservation.user._id,
                title: isDepositPayment ? 'Deposit Confirmed' : 'Payment Confirmed',
                message: isDepositPayment
                    ? `Your deposit of ${payment.amount} ETB has been confirmed by ${payment.reservation.garage.name}. You can now pay the remaining balance.`
                    : `Your payment of ${payment.amount} ETB has been confirmed by ${payment.reservation.garage.name}`,
                type: 'payment_received',
                relatedModel: 'Payment',
                relatedId: payment._id,
                actionUrl: '/my-reservations',
                priority: 'high',
            });
        } catch (notifError) {
            logger.error('Failed to create payment confirmation notification', { error: notifError.message });
        }

        logger.info(`Payment verified by garage owner: ${payment._id}`);

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: payment,
        });
    } catch (error) {
        logger.error('Garage payment verification failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all payments for garages owned by the current garage owner
 */
export async function getGarageOwnerPayments(req, res, next) {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const garages = await Garage.find({ owner: req.user.id }).select('_id name');
        const garageIds = garages.map(g => g._id);

        const Reservation = (await import('../models/Reservation.js')).default;
        const reservationIds = await Reservation.find({ garage: { $in: garageIds } }).distinct('_id');

        // Include both: reservation payments for this garage AND registration fee payments by this user
        const baseQuery = {
            $or: [
                { reservation: { $in: reservationIds } },
                { user: req.user.id, 'metadata.type': 'registration_fee' },
            ],
        };
        if (status) baseQuery.status = status;

        const payments = await Payment.find(baseQuery)
            .populate('user', 'name username phone')
            .populate({ path: 'reservation', populate: { path: 'garage', select: 'name' } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Payment.countDocuments(baseQuery);

        return res.status(200).json({
            success: true,
            data: payments,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error('Get garage owner payments failed', { error: error.message });
        next(error);
    }
}

/**
 * Get all payments — admin only, with filters
 */
export async function getAllPayments(req, res, next) {
    try {
        const { page = 1, limit = 20, status, method, garageId, startDate, endDate } = req.query;
        const query = {};
        if (status) query.status = status;
        if (method) query.paymentMethod = method;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        // Only show payments that have a reservation (garage + service)
        query.reservation = { $exists: true, $ne: null };

        const payments = await Payment.find(query)
            .populate('user', 'name username phone email')
            .populate({ path: 'reservation', populate: { path: 'garage', select: 'name owner' } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Payment.countDocuments(query);
        const totalRevenue = await Payment.aggregate([
            { $match: { ...query, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commissionAmount' } } }
        ]);

        return res.status(200).json({
            success: true,
            data: payments,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
            summary: totalRevenue[0] || { total: 0, commission: 0 },
        });
    } catch (error) {
        logger.error('Get all payments failed', { error: error.message });
        next(error);
    }
}

/**
 * Get wallet balance and recent transactions for the logged-in garage owner
 */
export async function getMyWallet(req, res, next) {
    try {
        const user = await User.findById(req.user.id).select('wallet name role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const wallet = user.wallet || { balance: 0, totalEarned: 0, totalWithdrawn: 0, transactions: [] };
        const transactions = [...(wallet.transactions || [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        return res.json({
            success: true,
            data: {
                balance: wallet.balance || 0,
                totalEarned: wallet.totalEarned || 0,
                totalWithdrawn: wallet.totalWithdrawn || 0,
                transactions,
            },
        });
    } catch (error) {
        logger.error('Get wallet failed', { error: error.message });
        next(error);
    }
}

/**
 * Get earnings summary for the logged-in garage owner
 */
export async function getMyEarnings(req, res, next) {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);
        const targetYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Get all garages owned by this user
        const garages = await Garage.find({ owner: req.user.id }).select('_id name');
        const garageIds = garages.map(g => g._id);

        // Get reservations for these garages
        const Reservation = (await import('../models/Reservation.js')).default;
        const reservationIds = await Reservation.find({ garage: { $in: garageIds } }).distinct('_id');

        // Get payments for these reservations in the target month
        const payments = await Payment.find({
            reservation: { $in: reservationIds },
            status: 'success',
            createdAt: { $gte: startDate, $lte: endDate },
        }).populate({ path: 'reservation', populate: { path: 'garage', select: 'name _id' } });

        // Group by garage
        const garageMap = {};
        for (const p of payments) {
            const gId = p.reservation?.garage?._id?.toString() || 'unknown';
            const gName = p.reservation?.garage?.name || 'Unknown';
            if (!garageMap[gId]) {
                garageMap[gId] = { garageId: gId, garageName: gName, totalRevenue: 0, totalCommission: 0, totalEarnings: 0, paymentCount: 0, payoutSent: false, payments: [] };
            }
            garageMap[gId].totalRevenue += p.amount || 0;
            garageMap[gId].totalCommission += p.commissionAmount || 0;
            garageMap[gId].totalEarnings += p.garageEarnings || (p.amount - (p.commissionAmount || 0));
            garageMap[gId].paymentCount += 1;
            garageMap[gId].payments.push({
                amount: p.amount,
                commissionAmount: p.commissionAmount || 0,
                garageEarnings: p.garageEarnings || (p.amount - (p.commissionAmount || 0)),
                paymentMethod: p.paymentMethod,
                createdAt: p.createdAt,
            });
        }

        const garageList = Object.values(garageMap);
        const totals = garageList.reduce((acc, g) => ({
            revenue: acc.revenue + g.totalRevenue,
            commission: acc.commission + g.totalCommission,
            earnings: acc.earnings + g.totalEarnings,
            payoutSent: false,
        }), { revenue: 0, commission: 0, earnings: 0, payoutSent: false });

        return res.json({
            success: true,
            data: { month: targetMonth, year: targetYear, garages: garageList, totals },
        });
    } catch (error) {
        logger.error('Get earnings failed', { error: error.message });
        next(error);
    }
}

/**
 * Notify admin that commission has been paid (manual cash payment)
 */
export async function notifyAdminCommissionPaid(req, res, next) {
    try {
        const { month, year, commissionAmount, paymentMethod, transactionRef, garageId } = req.body;

        const garage = await Garage.findOne({ _id: garageId, owner: req.user.id });
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });

        const receiptPath = req.file ? `/uploads/commission-receipts/${req.file.filename}` : null;

        const { createNotification } = await import('./notificationController.js');
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            await createNotification({
                recipient: admin._id,
                title: '💳 Commission Payment Submitted',
                message: `${garage.name} submitted commission payment of ${commissionAmount} ETB for ${month}/${year} via ${paymentMethod}. Ref: ${transactionRef || 'N/A'}`,
                type: 'payment_received',
                actionUrl: '/admin/commission',
                priority: 'high',
            });
        }

        return res.json({ success: true, message: 'Admin notified of commission payment', data: { receiptPath } });
    } catch (error) {
        logger.error('Notify commission failed', { error: error.message });
        next(error);
    }
}

/**
 * CHAPA: Initialize payment — car owner pays through Chapa
 * Car owner → Chapa → Platform → splits 90/10
 */
export async function initiateChapaPayment(req, res, next) {
    try {
        const { reservationId, isDeposit = false } = req.body;

        const reservation = await Reservation.findById(reservationId)
            .populate('garage')
            .populate('user', 'name email phone');

        if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
        if (reservation.user._id.toString() !== req.user.id)
            return res.status(403).json({ success: false, message: 'Not authorized' });

        const depositPaid = reservation.depositPaid ? (reservation.depositAmount || 0) : 0;
        const amount = isDeposit
            ? (reservation.depositAmount || Math.ceil(reservation.totalPrice * 0.3))
            : (reservation.totalPrice - depositPaid);

        if (amount <= 0) return res.status(400).json({ success: false, message: 'Nothing to pay' });

        const txRef = `SGS-${reservationId.slice(-8)}-${Date.now()}`;
        const user = reservation.user;
        const nameParts = (user.name || 'User').split(' ');

        const result = await initializeChapaPayment({
            amount,
            email: user.email || `${req.user.id}@smartgaraging.com`,
            firstName: nameParts[0] || 'User',
            lastName: nameParts[1] || 'Customer',
            txRef,
            callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5002'}/api/payments/chapa/webhook`,
            returnUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-reservations?payment=success&txRef=${txRef}`,
            customization: {
                title: `${reservation.garage.name} - ${reservation.serviceType}`,
                description: isDeposit ? `Deposit payment (${reservation.depositAmount} ETB)` : `Service payment (${amount} ETB)`,
            },
        });

        if (!result.success) {
            const msg = typeof result.message === 'object'
                ? JSON.stringify(result.message)
                : (result.message || 'Payment initialization failed');
            return res.status(400).json({ success: false, message: msg });
        }

        // Create pending payment record
        await Payment.create({
            reservation: reservationId,
            user: req.user.id,
            amount,
            paymentMethod: 'telebirr',   // Chapa supports telebirr/card — use telebirr as method
            paymentProvider: 'chapa',    // actual provider
            status: 'pending',
            transactionId: txRef,
            metadata: { isDeposit, chapaInitiated: true },
        });

        return res.json({ success: true, data: { checkoutUrl: result.checkoutUrl, txRef, amount } });
    } catch (error) {
        logger.error('Chapa initiate failed', { error: error.message });
        next(error);
    }
}

/**
 * Manual payment verification — called by frontend after returning from Chapa
 * Handles localhost where Chapa webhook can't reach the server
 */
export async function verifyChapaPaymentManual(req, res, next) {
    try {
        const { txRef } = req.params;
        if (!txRef) return res.status(400).json({ success: false, message: 'txRef required' });

        const payment = await Payment.findOne({ transactionId: txRef })
            .populate({ path: 'reservation', populate: { path: 'garage' } });

        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        if (payment.status === 'success') {
            return res.json({ success: true, message: 'Already verified', alreadyDone: true });
        }

        const verification = await verifyChapaTransaction(txRef);
        if (!verification.success || verification.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment not confirmed by Chapa yet' });
        }

        const reservation = payment.reservation;
        const garage = reservation?.garage;
        const { garageEarnings } = await applyCommissionAndCreditWallet(payment, garage, reservation);

        payment.status = 'success';
        payment.isVerified = true;
        payment.verifiedAt = new Date();
        payment.chapaRef = verification.chapaRef;
        // Update to actual payment method used (mpesa, telebirr, card, etc.)
        if (verification.paymentMethod && verification.paymentMethod !== 'chapa') {
            const methodMap = {
                'mpesa': 'telebirr',        // M-PESA maps to telebirr enum
                'telebirr': 'telebirr',
                'cbe': 'cbe_birr',
                'cbebirr': 'cbe_birr',
                'card': 'telebirr',         // fallback
            };
            const normalized = verification.paymentMethod.toLowerCase().replace(/[^a-z]/g, '');
            payment.paymentMethod = methodMap[normalized] || 'telebirr';
            payment.paymentProvider = 'chapa';
            // Store original method name in metadata for display
            payment.metadata = { ...payment.metadata, actualMethod: verification.paymentMethod };
        }
        await payment.save();

        if (payment.metadata?.isDeposit) {
            await Reservation.findByIdAndUpdate(reservation._id, {
                depositPaid: true, depositPaidAt: new Date(), depositAmount: payment.amount,
            });
            // Set escrow: hold deposit until garage owner accepts (auto-refund after 24h if not accepted)
            payment.escrowStatus = 'held';
            payment.escrowAutoRefundAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await payment.save();
        } else {
            await Reservation.findByIdAndUpdate(reservation._id, { paymentStatus: 'paid' });
            // Try to archive if service is also completed
            try {
                const { archiveReservation } = await import('../services/archiveService.js');
                await archiveReservation(reservation._id);
            } catch (archErr) {
                logger.warn('Archive after verify failed (non-critical):', archErr.message);
            }
        }

        if (garage?.owner) {
            await createNotification({
                recipient: garage.owner,
                title: 'Payment Received via Chapa',
                message: `${payment.amount} ETB received. Your earnings: ${garageEarnings.toFixed(2)} ETB.`,
                type: 'payment_received', actionUrl: '/earnings', priority: 'high',
            });
        }

        logger.info(`Manual Chapa verify OK: ${txRef}`);
        return res.json({ success: true, message: 'Payment verified', amount: payment.amount });
    } catch (error) {
        logger.error('Manual Chapa verify failed', { error: error.message });
        next(error);
    }
}

/**
 * CHAPA: Webhook — called by Chapa after payment
 * Automatically splits: 90% to garage wallet, 10% platform
 */
export async function chapaWebhook(req, res) {
    try {
        // Chapa sends POST with body OR GET with query params
        const tx_ref = req.body?.tx_ref || req.query?.trx_ref || req.query?.tx_ref;
        const status = req.body?.status || req.query?.status;

        if (!tx_ref) return res.status(400).json({ success: false });

        // If GET callback redirect, just verify and redirect back
        const isGetCallback = req.method === 'GET';

        // Verify with Chapa API
        const verification = await verifyChapaTransaction(tx_ref);
        if (!verification.success || verification.status !== 'success') {
            logger.warn(`Chapa webhook: payment not successful for ${tx_ref}`);
            return res.json({ success: false });
        }

        const payment = await Payment.findOne({ transactionId: tx_ref })
            .populate({ path: 'reservation', populate: { path: 'garage' } });

        if (!payment) { logger.warn(`Payment not found for txRef: ${tx_ref}`); return res.json({ success: false }); }
        if (payment.status === 'success') return res.json({ success: true }); // already processed

        const reservation = payment.reservation;
        const garage = reservation?.garage;

        // Apply commission split
        const { rate, commissionAmount, garageEarnings } = await applyCommissionAndCreditWallet(payment, garage, reservation);

        payment.status = 'success';
        payment.isVerified = true;
        payment.verifiedAt = new Date();
        payment.chapaRef = verification.chapaRef;
        if (verification.paymentMethod && verification.paymentMethod !== 'chapa') {
            const methodMap = { 'mpesa': 'telebirr', 'telebirr': 'telebirr', 'cbe': 'cbe_birr', 'cbebirr': 'cbe_birr', 'card': 'telebirr' };
            const normalized = verification.paymentMethod.toLowerCase().replace(/[^a-z]/g, '');
            payment.paymentMethod = methodMap[normalized] || 'telebirr';
            payment.paymentProvider = 'chapa';
            payment.metadata = { ...payment.metadata, actualMethod: verification.paymentMethod };
        }
        await payment.save();

        // Update reservation deposit/payment status
        if (payment.metadata?.isDeposit) {
            await Reservation.findByIdAndUpdate(reservation._id, {
                depositPaid: true,
                depositPaidAt: new Date(),
                depositAmount: payment.amount,
            });
            // Escrow: hold deposit until garage owner accepts
            payment.escrowStatus = 'held';
            payment.escrowAutoRefundAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await payment.save();
        } else {
            await Reservation.findByIdAndUpdate(reservation._id, { paymentStatus: 'paid' });
            // Try to archive if service is also completed
            try {
                const { archiveReservation } = await import('../services/archiveService.js');
                await archiveReservation(reservation._id);
            } catch (archErr) {
                logger.warn('Archive after webhook failed (non-critical):', archErr.message);
            }
        }

        // Notify garage owner
        if (garage?.owner) {
            await createNotification({
                recipient: garage.owner,
                title: 'Payment Received via Chapa',
                message: `${payment.amount} ETB received. Your earnings: ${garageEarnings.toFixed(2)} ETB (after 10% commission).`,
                type: 'payment_received',
                actionUrl: '/earnings',
                priority: 'high',
            });
        }

        logger.info(`Chapa payment processed: ${tx_ref}, earnings: ${garageEarnings} ETB`);

        if (isGetCallback) {
            // Redirect browser back to frontend with success
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/my-reservations?payment=success&txRef=${tx_ref}`);
        }
        return res.json({ success: true });
    } catch (error) {
        logger.error('Chapa webhook error', { error: error.message });
        return res.status(500).json({ success: false });
    }
}

/**
 * WITHDRAWAL: Garage owner requests withdrawal
 */
export async function requestWithdrawal(req, res, next) {
    try {
        const { amount, bankName, bankCode, accountNumber, accountName, phoneNumber } = req.body;

        const user = await User.findById(req.user.id).select('wallet role');
        if (!user || user.role !== 'garage_owner')
            return res.status(403).json({ success: false, message: 'Only garage owners can withdraw' });

        const balance = user.wallet?.balance || 0;
        if (amount > balance)
            return res.status(400).json({ success: false, message: `Insufficient balance. Available: ${balance.toFixed(2)} ETB` });
        if (amount < 50)
            return res.status(400).json({ success: false, message: 'Minimum withdrawal is 50 ETB' });

        // Check no pending withdrawal exists
        const existing = await Withdrawal.findOne({ garageOwner: req.user.id, status: 'pending' });
        if (existing)
            return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request' });

        // Reserve the amount (deduct from wallet immediately, refund if rejected)
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'wallet.balance': -amount },
            $push: {
                'wallet.transactions': {
                    type: 'debit',
                    amount,
                    description: `Withdrawal request of ${amount} ETB (pending admin approval)`,
                    createdAt: new Date(),
                },
            },
        });

        const withdrawal = await Withdrawal.create({
            garageOwner: req.user.id,
            amount,
            bankDetails: { bankName, bankCode, accountNumber, accountName, phoneNumber },
        });

        // Notify admins
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            await createNotification({
                recipient: admin._id,
                title: '💸 Withdrawal Request',
                message: `Garage owner requested withdrawal of ${amount} ETB via ${bankName}.`,
                type: 'payment_received',
                actionUrl: '/admin/withdrawals',
                priority: 'high',
            });
        }

        return res.status(201).json({ success: true, message: 'Withdrawal request submitted. Admin will process within 24 hours.', data: withdrawal });
    } catch (error) {
        logger.error('Withdrawal request failed', { error: error.message });
        next(error);
    }
}

/**
 * WITHDRAWAL: Admin approves and processes withdrawal
 */
export async function processWithdrawal(req, res, next) {
    try {
        const { withdrawalId } = req.params;
        const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

        const withdrawal = await Withdrawal.findById(withdrawalId).populate('garageOwner', 'name email');
        if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        if (withdrawal.status !== 'pending')
            return res.status(400).json({ success: false, message: `Withdrawal is already ${withdrawal.status}` });

        if (action === 'reject') {
            withdrawal.status = 'rejected';
            withdrawal.rejectionReason = rejectionReason || 'Rejected by admin';
            withdrawal.reviewedBy = req.user.id;
            withdrawal.reviewedAt = new Date();
            await withdrawal.save();

            // Refund the reserved amount back to wallet
            await User.findByIdAndUpdate(withdrawal.garageOwner._id, {
                $inc: { 'wallet.balance': withdrawal.amount },
                $push: {
                    'wallet.transactions': {
                        type: 'credit',
                        amount: withdrawal.amount,
                        description: `Withdrawal rejected — ${rejectionReason || 'Admin rejected'}. Amount refunded.`,
                        createdAt: new Date(),
                    },
                },
            });

            await createNotification({
                recipient: withdrawal.garageOwner._id,
                title: 'Withdrawal Rejected',
                message: `Your withdrawal of ${withdrawal.amount} ETB was rejected. Reason: ${rejectionReason || 'N/A'}. Amount refunded to wallet.`,
                type: 'payment_failed',
                actionUrl: '/earnings',
                priority: 'high',
            });

            return res.json({ success: true, message: 'Withdrawal rejected and amount refunded', data: withdrawal });
        }

        // APPROVE — attempt Chapa transfer
        withdrawal.status = 'processing';
        withdrawal.reviewedBy = req.user.id;
        withdrawal.reviewedAt = new Date();
        await withdrawal.save();

        const { bankDetails } = withdrawal;
        const chapaRef = `WD-${withdrawalId.slice(-8)}-${Date.now()}`;

        const transfer = await chapaBankTransfer({
            accountName: bankDetails.accountName,
            accountNumber: bankDetails.accountNumber || bankDetails.phoneNumber,
            bankCode: bankDetails.bankCode,
            amount: withdrawal.amount,
            reference: chapaRef,
            reason: `Smart Garaging earnings withdrawal`,
        });

        if (transfer.success) {
            withdrawal.status = 'completed';
            withdrawal.chapaTransferId = transfer.transferId;
            withdrawal.chapaReference = chapaRef;
            withdrawal.completedAt = new Date();
            await withdrawal.save();
            await User.findByIdAndUpdate(withdrawal.garageOwner._id, { $inc: { 'wallet.totalWithdrawn': withdrawal.amount } });
            await createNotification({
                recipient: withdrawal.garageOwner._id,
                title: '✅ Withdrawal Completed',
                message: `${withdrawal.amount} ETB transferred to your ${bankDetails.bankName} account via Chapa.`,
                type: 'payment_received', actionUrl: '/withdrawal', priority: 'high',
            });
        } else {
            // Chapa transfer not available (test key / Transfer API not enabled)
            // Mark as approved — admin must manually send the money
            withdrawal.status = 'approved';
            withdrawal.chapaReference = chapaRef;
            withdrawal.notes = `Manual transfer required: Send ${withdrawal.amount} ETB to ${bankDetails.bankName} — ${bankDetails.accountName} — ${bankDetails.accountNumber || bankDetails.phoneNumber}`;
            await withdrawal.save();
            await User.findByIdAndUpdate(withdrawal.garageOwner._id, { $inc: { 'wallet.totalWithdrawn': withdrawal.amount } });
            await createNotification({
                recipient: withdrawal.garageOwner._id,
                title: '✅ Withdrawal Approved',
                message: `Your withdrawal of ${withdrawal.amount} ETB has been approved. Admin will manually transfer to your ${bankDetails.bankName} account within 24 hours.`,
                type: 'payment_received', actionUrl: '/withdrawal', priority: 'high',
            });
        }

        return res.json({
            success: true,
            message: transfer.success
                ? 'Withdrawal transferred via Chapa successfully'
                : `Withdrawal approved. Please manually send ${withdrawal.amount} ETB to ${bankDetails.bankName} — ${bankDetails.accountName} — ${bankDetails.accountNumber || bankDetails.phoneNumber}`,
            data: withdrawal,
            requiresManualTransfer: !transfer.success,
        });
    } catch (error) {
        logger.error('Process withdrawal failed', { error: error.message });
        next(error);
    }
}

/**
 * Get withdrawal requests (admin: all, garage owner: own)
 */
export async function getWithdrawals(req, res, next) {
    try {
        const query = req.user.role === 'admin' ? {} : { garageOwner: req.user.id };
        const withdrawals = await Withdrawal.find(query)
            .populate('garageOwner', 'name username phone')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        return res.json({ success: true, data: withdrawals });
    } catch (error) { next(error); }
}

/**
 * Admin marks an approved withdrawal as completed (after manual bank transfer)
 */
export async function markWithdrawalCompleted(req, res, next) {
    try {
        const withdrawal = await Withdrawal.findById(req.params.withdrawalId)
            .populate('garageOwner', 'name');
        if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        if (withdrawal.status !== 'approved') {
            return res.status(400).json({ success: false, message: `Cannot mark as completed — current status: ${withdrawal.status}` });
        }
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        withdrawal.reviewedBy = req.user.id;
        await withdrawal.save();

        await createNotification({
            recipient: withdrawal.garageOwner._id,
            title: '✅ Withdrawal Completed',
            message: `Your withdrawal of ${withdrawal.amount} ETB has been sent to your ${withdrawal.bankDetails?.bankName} account.`,
            type: 'payment_received',
            actionUrl: '/withdrawal',
            priority: 'high',
        });

        logger.info(`Withdrawal ${withdrawal._id} marked completed by admin ${req.user.id}`);
        return res.json({ success: true, message: 'Withdrawal marked as completed', data: withdrawal });
    } catch (error) {
        logger.error('Mark withdrawal completed failed', { error: error.message });
        next(error);
    }
}

/**
 * Admin: Get all pending/completed refunds
 */
export async function getAdminRefunds(req, res, next) {
    try {
        const refunds = await Payment.find({
            escrowStatus: { $in: ['refund_pending', 'refunded'] },
            status: { $in: ['success', 'refunded'] },
        })
            .populate('user', 'name email phone username')
            .populate({ path: 'reservation', populate: { path: 'garage', select: 'name' } })
            .sort({ updatedAt: -1 });
        res.json({ success: true, data: refunds });
    } catch (err) {
        logger.error('Get admin refunds failed', { error: err.message });
        next(err);
    }
}

/**
 * Admin: Mark a deposit as refunded
 */
export async function markRefunded(req, res, next) {
    try {
        const { chapaRefundRef, note } = req.body;
        if (!chapaRefundRef || !chapaRefundRef.trim()) {
            return res.status(400).json({ success: false, message: 'Chapa Reference is required' });
        }
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        if (payment.escrowStatus !== 'refund_pending') {
            return res.status(400).json({ success: false, message: 'Payment is not pending refund' });
        }

        // Validate that the entered reference matches the real Chapa reference on this payment
        if (payment.chapaRef && chapaRefundRef.trim() !== payment.chapaRef) {
            return res.status(400).json({
                success: false,
                message: `Incorrect Chapa Reference. The reference must exactly match the "CHAPA REFERENCE" shown on dashboard.chapa.co for this transaction.`,
            });
        }
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        if (payment.escrowStatus !== 'refund_pending') {
            return res.status(400).json({ success: false, message: 'Payment is not pending refund' });
        }
        payment.escrowStatus = 'refunded';
        payment.escrowRefundedAt = new Date();
        payment.status = 'refunded';
        if (chapaRefundRef) payment.metadata = { ...payment.metadata, chapaRefundRef };
        if (note) payment.metadata = { ...payment.metadata, refundNote: note };
        await payment.save();

        try {
            await createNotification({
                recipient: payment.user,
                title: '✅ Deposit Refunded',
                message: `Your deposit of ${payment.amount} ETB has been refunded. ${note || ''}`,
                type: 'payment',
                actionUrl: '/my-reservations',
                priority: 'high',
            });
        } catch { /* non-critical */ }

        logger.info(`Refund marked for payment ${payment._id} by admin ${req.user.id}`);
        res.json({ success: true, message: 'Refund marked as completed' });
    } catch (err) {
        logger.error('Mark refunded failed', { error: err.message });
        next(err);
    }
}

export default {
    initiatePayment,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
    getPaymentByReservation,
    garageVerifyPayment,
    getMyWallet,
    getMyEarnings,
    notifyAdminCommissionPaid,
    getAllPayments,
    getGarageOwnerPayments,
    initiateChapaPayment,
    verifyChapaPaymentManual,
    chapaWebhook,
    requestWithdrawal,
    processWithdrawal,
    getWithdrawals,
    markWithdrawalCompleted,
    getAdminRefunds,
    markRefunded,
    applyCommissionAndCreditWallet,
};
