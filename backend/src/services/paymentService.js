// src/services/paymentService.js
// UPDATED: Fixed garage field extraction
import Payment from '../models/Payment.js';
import Reservation from '../models/Reservation.js';
import Garage from '../models/Garage.js';
import User from '../models/User.js';
import axios from 'axios';
import logger from '../utils/logger.js';

class PaymentService {
    constructor() {
        this.chapaBaseUrl = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
        this.chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        this.serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
        this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    }

    /**
     * Calculate payment breakdown
     */
    calculatePaymentBreakdown(baseAmount) {
        const serviceFeePercent = parseFloat(process.env.SERVICE_FEE_PERCENT || '2.5');
        const taxPercent = parseFloat(process.env.TAX_PERCENT || '15');

        const serviceFee = (baseAmount * serviceFeePercent) / 100;
        const tax = (baseAmount * taxPercent) / 100;
        const totalAmount = baseAmount + serviceFee + tax;

        return {
            amount: baseAmount,
            serviceFee: Math.round(serviceFee * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
        };
    }

    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `TXN-${timestamp}-${random}`;
    }

    /**
     * Initiate payment for a reservation
     */
    async initiatePayment({ reservationId, paymentMethod, userId }) {
        try {
            // Fetch reservation with related data
            const reservation = await Reservation.findById(reservationId)
                .populate('garage')
                .populate('user')
                .populate('vehicle');

            if (!reservation) {
                throw new Error('Reservation not found');
            }

            // Debug logging
            logger.info('🔍 Reservation data:', {
                reservationId,
                hasGarage: !!reservation.garage,
                garageType: typeof reservation.garage,
                garageId: reservation.garage?._id,
                garageRaw: reservation.garage,
            });

            // Verify user owns this reservation
            if (reservation.user._id.toString() !== userId) {
                throw new Error('Not authorized to pay for this reservation');
            }

            // Check if payment already exists
            const existingPayment = await Payment.findOne({
                reservation: reservationId,
                status: { $in: ['pending', 'processing', 'success'] }
            });

            if (existingPayment) {
                if (existingPayment.status === 'success') {
                    throw new Error('Payment already completed for this reservation');
                }
                // Return existing pending payment
                return existingPayment;
            }

            // Calculate payment breakdown
            const breakdown = this.calculatePaymentBreakdown(reservation.totalPrice);

            // Get user information
            const user = await User.findById(userId);

            // Create payment record
            const transactionId = this.generateTransactionId();

            // Handle garage field - could be ObjectId or populated object
            const garageId = reservation.garage._id || reservation.garage;
            const garageName = reservation.garage.name || 'Garage';

            logger.info('🔍 Payment data preparation:', {
                garageId,
                garageIdType: typeof garageId,
                garageName,
                breakdown,
            });

            const paymentData = {
                reservation: reservationId,
                user: userId,
                garage: garageId,
                ...breakdown,
                currency: 'ETB',
                transactionId,
                paymentMethod,
                paymentProvider: this.getPaymentProvider(paymentMethod),
                status: 'pending',
                customerInfo: {
                    firstName: user.firstName || user.name?.split(' ')[0] || 'Customer',
                    lastName: user.lastName || user.name?.split(' ')[1] || '',
                    email: user.email,
                    phone: user.phone || '',
                },
                description: `Payment for ${reservation.serviceType} at ${garageName}`,
                metadata: {
                    reservationId: reservationId,
                    garageId: garageId,
                    vehicleId: reservation.vehicle._id || reservation.vehicle,
                    serviceType: reservation.serviceType,
                },
            };

            logger.info('🔍 Final payment data:', paymentData);

            console.log('🟢 About to create payment with data:', JSON.stringify({
                garage: paymentData.garage,
                garageType: typeof paymentData.garage,
                garageString: String(paymentData.garage),
            }, null, 2));

            const payment = await Payment.create(paymentData);

            // Process based on payment method
            let result = { payment };

            if (paymentMethod === 'telebirr') {
                result = await this.initiateTelebirrPayment(payment, user);
            } else if (paymentMethod === 'cash') {
                // Cash payment - mark as pending, will be verified manually
                payment.status = 'pending';
                payment.description = 'Cash payment - awaiting confirmation at garage';
                await payment.save();
            } else if (paymentMethod === 'cbe_birr') {
                // CBE Birr - mark as pending, will be verified manually
                payment.status = 'pending';
                payment.description = 'CBE Birr payment - awaiting confirmation';
                await payment.save();
            } else if (paymentMethod === 'bank_transfer_cbe' || paymentMethod === 'bank_transfer_abyssinia') {
                // Bank transfer - mark as pending, will be verified manually
                const bankName = paymentMethod === 'bank_transfer_cbe'
                    ? 'Commercial Bank of Ethiopia'
                    : 'Bank of Abyssinia';
                payment.status = 'pending';
                payment.description = `Bank transfer via ${bankName} - awaiting confirmation`;
                await payment.save();
            }

            logger.info(`Payment initiated: ${payment._id} for reservation ${reservationId} via ${paymentMethod}`);

            return result;
        } catch (error) {
            logger.error('Payment initiation failed', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Get payment provider from payment method
     */
    getPaymentProvider(paymentMethod) {
        const providerMap = {
            'cash': 'manual',
            'telebirr': 'telebirr',
            'cbe_birr': 'manual',
            'bank_transfer_cbe': 'manual',
            'bank_transfer_abyssinia': 'manual',
        };
        return providerMap[paymentMethod] || 'manual';
    }

    /**
     * Initiate Chapa payment
     */
    async initiateChapaPayment(payment, user) {
        try {
            if (!this.chapaSecretKey) {
                throw new Error('Chapa secret key not configured');
            }

            const chapaPayload = {
                amount: payment.totalAmount.toString(),
                currency: payment.currency,
                email: user.email,
                first_name: payment.customerInfo.firstName,
                last_name: payment.customerInfo.lastName,
                phone_number: payment.customerInfo.phone || '',
                tx_ref: payment.transactionId,
                callback_url: `${this.serverUrl}/api/payments/webhook/chapa`,
                return_url: `${this.clientUrl}/payment/success?tx_ref=${payment.transactionId}`,
                customization: {
                    title: 'Smart Garage Booking',
                    description: payment.description,
                },
            };

            const response = await axios.post(
                `${this.chapaBaseUrl}/transaction/initialize`,
                chapaPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.chapaSecretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.status === 'success') {
                payment.status = 'processing';
                payment.externalTransactionId = response.data.data.tx_ref;
                payment.gatewayResponse = {
                    checkoutUrl: response.data.data.checkout_url,
                    reference: response.data.data.tx_ref,
                    status: response.data.status,
                    message: response.data.message,
                    rawResponse: response.data,
                };
                await payment.save();

                logger.info(`Chapa payment initialized: ${payment.transactionId}`);

                return {
                    payment,
                    checkoutUrl: response.data.data.checkout_url,
                    reference: response.data.data.tx_ref,
                };
            } else {
                throw new Error(response.data.message || 'Chapa initialization failed');
            }
        } catch (error) {
            payment.status = 'failed';
            payment.failureReason = error.response?.data?.message || error.message;
            payment.failureCode = error.response?.data?.code || 'CHAPA_ERROR';
            await payment.save();

            logger.error('Chapa payment initiation failed', {
                error: error.message,
                response: error.response?.data,
            });

            throw new Error(`Chapa payment failed: ${error.message}`);
        }
    }

    /**
     * Initiate Telebirr payment (placeholder - implement based on Telebirr API)
     */
    async initiateTelebirrPayment(payment, user) {
        try {
            // Telebirr integration would go here
            // For now, return a placeholder
            payment.status = 'processing';
            payment.description = 'Telebirr payment - awaiting implementation';
            await payment.save();

            logger.info(`Telebirr payment initiated: ${payment.transactionId}`);

            return {
                payment,
                message: 'Telebirr payment integration coming soon',
            };
        } catch (error) {
            payment.status = 'failed';
            payment.failureReason = error.message;
            await payment.save();

            logger.error('Telebirr payment initiation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Verify payment with Chapa
     */
    async verifyChapaPayment(txRef) {
        try {
            if (!this.chapaSecretKey) {
                throw new Error('Chapa secret key not configured');
            }

            const response = await axios.get(
                `${this.chapaBaseUrl}/transaction/verify/${txRef}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.chapaSecretKey}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Chapa verification failed', {
                error: error.message,
                response: error.response?.data,
            });
            throw error;
        }
    }

    /**
     * Handle Chapa webhook
     */
    async handleChapaWebhook(webhookData) {
        try {
            const { tx_ref, status, charge, currency } = webhookData;

            const payment = await Payment.findOne({ transactionId: tx_ref });

            if (!payment) {
                logger.error(`Payment not found for webhook: ${tx_ref}`);
                return { success: false, message: 'Payment not found' };
            }

            // Verify with Chapa API
            const verification = await this.verifyChapaPayment(tx_ref);

            if (verification.status === 'success' && verification.data.status === 'success') {
                payment.status = 'success';
                payment.paymentDate = new Date();
                payment.isVerified = true;
                payment.verifiedAt = new Date();
                payment.gatewayResponse.rawResponse = verification.data;

                // compute commission/earnings when payment becomes successful via webhook
                try {
                    const defaultRate = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0');
                    let garageRate = 0;
                    if (payment.reservation && payment.reservation.garage) {
                        garageRate = payment.reservation.garage.commissionRate || 0;
                    } else {
                        const garageObj = await Garage.findById(payment.reservation);
                        garageRate = garageObj?.commissionRate || 0;
                    }
                    const rate = typeof garageRate === 'number' ? garageRate : defaultRate;
                    payment.commissionRate = rate;
                    const baseTotal = (typeof payment.totalAmount === 'number' && payment.totalAmount >= 0)
                        ? payment.totalAmount
                        : payment.amount || 0;
                    payment.commissionAmount = parseFloat((baseTotal * rate).toFixed(2));
                    payment.garageEarnings = parseFloat((baseTotal - payment.commissionAmount).toFixed(2));
                } catch (e) {
                    logger.error('Failed to calculate commission during webhook verification', { error: e.message });
                }


                logger.info(`Payment verified successfully: ${payment.transactionId}`);

                return { success: true, payment };
            } else {
                payment.status = 'failed';
                payment.failureReason = verification.data?.message || 'Payment verification failed';
                await payment.save();

                logger.error(`Payment verification failed: ${payment.transactionId}`);

                return { success: false, message: 'Payment verification failed' };
            }
        } catch (error) {
            logger.error('Webhook processing failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Manually verify payment (for admin/garage owner)
     */
    async manuallyVerifyPayment(paymentId, verifiedBy, status = 'success') {
        try {
            const payment = await Payment.findById(paymentId);

            if (!payment) {
                throw new Error('Payment not found');
            }

            payment.status = status;
            payment.isVerified = true;
            payment.verifiedAt = new Date();
            payment.paymentDate = new Date();
            payment.metadata.verifiedBy = verifiedBy;
            payment.metadata.verificationMethod = 'manual';

            await payment.save();

            if (status === 'success') {
                await Reservation.findByIdAndUpdate(payment.reservation, {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                });
            }

            logger.info(`Payment manually verified: ${payment.transactionId} by ${verifiedBy}`);

            return payment;
        } catch (error) {
            logger.error('Manual verification failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Process refund
     */
    async processRefund(paymentId, refundAmount, reason, processedBy) {
        try {
            const payment = await Payment.findById(paymentId);

            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'success') {
                throw new Error('Can only refund successful payments');
            }

            if (refundAmount > payment.totalAmount) {
                throw new Error('Refund amount cannot exceed payment amount');
            }

            payment.status = 'refunded';
            payment.refund = {
                amount: refundAmount,
                reason,
                refundedAt: new Date(),
                refundTransactionId: this.generateTransactionId(),
            };
            payment.metadata.refundedBy = processedBy;

            await payment.save();

            // Update reservation
            await Reservation.findByIdAndUpdate(payment.reservation, {
                paymentStatus: 'refunded',
                status: 'cancelled',
            });

            logger.info(`Refund processed: ${payment.transactionId} - Amount: ${refundAmount}`);

            return payment;
        } catch (error) {
            logger.error('Refund processing failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            const payment = await Payment.findById(paymentId)
                .populate('user', 'name email phone')
                .populate('garage', 'name location phone')
                .populate({
                    path: 'reservation',
                    populate: { path: 'vehicle', select: 'make model plateNumber' }
                });

            if (!payment) {
                throw new Error('Payment not found');
            }

            return payment;
        } catch (error) {
            logger.error('Get payment details failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get user payments with filters
     */
    async getUserPayments(userId, filters = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate,
                paymentMethod,
            } = filters;

            const query = { user: userId };

            if (status) query.status = status;
            if (paymentMethod) query.paymentMethod = paymentMethod;
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const payments = await Payment.find(query)
                .populate('reservation', 'serviceType startTime endTime')
                .populate('garage', 'name location')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            const total = await Payment.countDocuments(query);

            return {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Get user payments failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get garage payments
     */
    async getGaragePayments(garageId, filters = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate,
            } = filters;

            const query = { garage: garageId };

            if (status) query.status = status;
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const payments = await Payment.find(query)
                .populate('user', 'name email phone')
                .populate('reservation', 'serviceType startTime endTime')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            const total = await Payment.countDocuments(query);

            // Calculate totals
            const totalRevenue = await Payment.aggregate([
                { $match: { garage: garageId, status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // also compute commission and earnings summaries
            const commissionSummary = await Payment.aggregate([
                { $match: { garage: garageId, status: 'success' } },
                {
                    $group: {
                        _id: null,
                        totalCommission: { $sum: '$commissionAmount' },
                        totalEarnings: { $sum: '$garageEarnings' },
                    },
                },
            ]);

            return {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
                summary: {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalCommission: commissionSummary[0]?.totalCommission || 0,
                    totalEarnings: commissionSummary[0]?.totalEarnings || 0,
                },
            };
        } catch (error) {
            logger.error('Get garage payments failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get payment statistics
     */
    async getPaymentStatistics(filters = {}) {
        try {
            const { startDate, endDate, garageId, userId } = filters;

            const matchQuery = {};
            if (startDate || endDate) {
                matchQuery.createdAt = {};
                if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
                if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
            }
            if (garageId) matchQuery.garage = garageId;
            if (userId) matchQuery.user = userId;

            const stats = await Payment.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
            ]);

            const methodStats = await Payment.aggregate([
                { $match: { ...matchQuery, status: 'success' } },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
            ]);

            return {
                byStatus: stats,
                byMethod: methodStats,
            };
        } catch (error) {
            logger.error('Get payment statistics failed', { error: error.message });
            throw error;
        }
    }
}

// Export the class instance methods directly
const paymentServiceInstance = new PaymentService();

/**
 * Initiate payment (exported function for controller)
 * Updated: 2026-03-07 21:36
 */
export async function initiatePayment({ reservationId, userId, paymentMethod }) {
    console.log('🟢 PaymentService.initiatePayment CALLED - TIMESTAMP: 21:36');
    console.log('📦 Params:', { reservationId, userId, paymentMethod });
    return paymentServiceInstance.initiatePayment({ reservationId, userId, paymentMethod });
}

/**
 * Verify payment status (for controller use)
 */
export async function verifyPayment({ paymentId, userId, userRole, status }) {
    try {
        const payment = await Payment.findById(paymentId).populate({
            path: 'reservation',
            populate: { path: 'garage' }
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Only owner or admin can verify
        if (payment.user.toString() !== userId && userRole !== 'admin') {
            throw new Error('Not authorized to verify this payment');
        }

        payment.status = status;
        if (status === 'success') {
            payment.paymentDate = new Date();
            payment.isVerified = true;
            payment.verifiedAt = new Date();
        }
        await payment.save();

        // Update reservation payment status
        if (status === 'success') {
            await Reservation.findByIdAndUpdate(payment.reservation._id, {
                paymentStatus: 'paid',
            });

            // Create notification for garage owner
            try {
                const { createNotification } = await import('./notificationService.js');
                const garage = await Garage.findById(payment.reservation.garage._id || payment.reservation.garage);
                if (garage) {
                    await createNotification({
                        recipient: garage.owner,
                        title: 'Payment Received',
                        message: `Payment of ${payment.amount} ETB received for ${payment.reservation.serviceType}`,
                        type: 'payment_received',
                        actionUrl: `/garage/bookings/${payment.reservation._id}`,
                    });
                    logger.info(`Payment notification sent to garage owner ${garage.owner}`);
                }
            } catch (notifError) {
                logger.error('Failed to create payment notification', { error: notifError.message });
            }
        }

        return payment;
    } catch (error) {
        logger.error('Payment verification failed', { error: error.message });
        throw error;
    }
}

export default paymentServiceInstance;

