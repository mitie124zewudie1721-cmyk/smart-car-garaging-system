// src/controllers/reservationController.js
import Reservation from '../models/Reservation.js';
import Garage from '../models/Garage.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';

// Deposit rate: 30% of total price (configurable via env)
const DEPOSIT_RATE = parseFloat(process.env.DEPOSIT_RATE || '0.30');

/**
 * Create a new reservation (car_owner only)
 */
export const createReservation = async (req, res, next) => {
    try {
        const { garageId, vehicleId, startTime, endTime, serviceType, serviceDescription, notes } = req.body;

        // Validate required fields
        if (!garageId || !vehicleId || !startTime || !endTime || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: garageId, vehicleId, startTime, endTime, serviceType',
            });
        }

        // Fetch garage to calculate price
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found',
            });
        }

        // Price = fixed service price (not time-based)
        // Find the matching service in the garage's services list
        const matchedService = garage.services?.find(
            s => s.name?.toLowerCase() === serviceType?.toLowerCase()
        );
        const totalPrice = matchedService?.price ?? garage.pricePerHour ?? 0;

        // Check for overlapping reservations — count active bookings vs available slots
        const overlappingCount = await Reservation.countDocuments({
            garage: garageId,
            status: { $nin: ['cancelled', 'completed', 'no_show'] },
            $or: [
                {
                    startTime: { $lt: new Date(endTime) },
                    endTime: { $gt: new Date(startTime) },
                },
            ],
        });

        // Get garage capacity
        const garageCapacity = garage.capacity || garage.totalSlots || 1;

        if (overlappingCount >= garageCapacity) {
            return res.status(400).json({
                success: false,
                message: overlappingCount === 1 && garageCapacity === 1
                    ? 'This time slot is already reserved for this garage'
                    : `This garage is fully booked for the selected time (${overlappingCount}/${garageCapacity} slots taken)`,
            });
        }

        // Calculate deposit using garage's depositPercent (default 30%)
        const depositRate = (garage.depositPercent ?? 30) / 100;
        const depositAmount = Math.ceil(totalPrice * depositRate);

        // Create reservation with service information
        const reservationData = {
            user: req.user.id,
            garage: garageId,
            vehicle: vehicleId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            totalPrice,
            depositAmount,
            serviceType: serviceType.trim(),
            serviceDescription: serviceDescription?.trim() || undefined,
            notes: notes?.trim() || undefined,
        };

        const reservation = await Reservation.create(reservationData);

        // Create notification for garage owner
        try {
            await createNotification({
                recipient: garage.owner,
                title: 'New Booking Request',
                message: `You have a new booking request for ${serviceType} service`,
                type: 'reservation_confirmed',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/bookings',
                priority: 'high',
            });
            // Also notify car owner that booking was submitted — with deposit info
            await createNotification({
                recipient: req.user.id,
                title: 'Booking Submitted — Deposit Required',
                message: `Your booking for ${serviceType} at ${garage.name} is pending. Please pay the deposit of ${depositAmount} ETB to confirm your slot.`,
                type: 'reservation_confirmed',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/my-reservations',
                priority: 'high',
            });
            logger.info(`Notification sent to garage owner ${garage.owner}`);
        } catch (notifError) {
            logger.error('Failed to create booking notification', { error: notifError.message });
        }

        logger.info(`New reservation created: ${reservation._id} by user ${req.user.id} for service: ${serviceType}`);

        return res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: reservation,
        });
    } catch (error) {
        logger.error('Reservation creation failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get all reservations made by the current user (paginated)
 */
export const getMyReservations = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            garageId,
        } = req.query;

        const query = { user: req.user.id };

        if (status) query.status = status;
        if (garageId) query.garage = garageId;
        if (startDate) query.startTime = { $gte: new Date(startDate) };
        if (endDate) query.endTime = { $lte: new Date(endDate) };

        const reservations = await Reservation.find(query)
            .populate('garage', 'name address location bankAccounts depositPercent')
            .populate('vehicle', 'make model plateNumber type color image')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Reservation.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: reservations,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get my reservations failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get details of a specific reservation (owner or admin)
 */
export const getReservationById = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('garage', 'name address location bankAccounts')
            .populate('vehicle', 'make model plateNumber type color image')
            .populate('user', 'name email');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Authorization: owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this reservation',
            });
        }

        return res.status(200).json({
            success: true,
            data: reservation,
        });
    } catch (error) {
        logger.error('Get reservation by ID failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Cancel a reservation (car owner can cancel their own, with rules)
 */
export const cancelReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('garage');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Check authorization - car owner can cancel their own, garage owner through reject endpoint
        const isOwner = reservation.user.toString() === req.user.id;
        const isGarageOwner = req.user.role === 'garage_owner' &&
            reservation.garage.owner.toString() === req.user.id;

        if (!isOwner && !isGarageOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this reservation',
            });
        }

        // Cannot cancel completed reservations
        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed reservation. Please contact support if you have concerns.',
            });
        }

        // Already cancelled
        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This reservation is already cancelled',
            });
        }

        // Check if service is currently active
        if (reservation.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an active service. Please wait for completion or contact the garage.',
            });
        }

        // Cancellation policy: Check time until appointment
        const now = new Date();
        const startTime = new Date(reservation.startTime);
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let cancellationNote = '';
        if (isOwner) {
            if (hoursUntilStart < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel within 2 hours of appointment start time. Please contact the garage directly.',
                });
            } else if (hoursUntilStart < 24) {
                cancellationNote = 'Late cancellation (less than 24 hours notice)';
            }
        }

        // Update status
        const prevStatus = reservation.status;
        reservation.status = 'cancelled';
        if (cancellationNote) {
            reservation.notes = reservation.notes
                ? `${reservation.notes}\n\n${cancellationNote}`
                : cancellationNote;
        }
        await reservation.save();

        // Restore slot if booking was confirmed (slot was decremented on accept)
        if (prevStatus === 'confirmed') {
            await Garage.findByIdAndUpdate(reservation.garage._id, {
                $inc: { availableSlots: 1 },
            });
            const g = await Garage.findById(reservation.garage._id).select('capacity availableSlots');
            if (g && g.availableSlots > g.capacity) {
                await Garage.findByIdAndUpdate(reservation.garage._id, { $set: { availableSlots: g.capacity } });
            }
        }

        // Create notification for garage owner (if car owner cancelled)
        if (isOwner) {
            try {
                await createNotification({
                    recipient: reservation.garage.owner,
                    title: 'Booking Cancelled',
                    message: `A customer cancelled their booking for ${reservation.serviceType}`,
                    type: 'reservation_cancelled',
                    relatedModel: 'Reservation',
                    relatedId: reservation._id,
                    actionUrl: '/bookings',
                    priority: 'normal',
                });
                // Notify car owner too
                await createNotification({
                    recipient: reservation.user,
                    title: 'Booking Cancelled',
                    message: `Your booking for ${reservation.serviceType} has been cancelled.`,
                    type: 'reservation_cancelled',
                    relatedModel: 'Reservation',
                    relatedId: reservation._id,
                    actionUrl: '/my-reservations',
                    priority: 'normal',
                });
                logger.info(`Notification sent to garage owner ${reservation.garage.owner}`);
            } catch (notifError) {
                logger.error('Failed to create cancellation notification', { error: notifError.message });
            }
        }

        logger.info(`Reservation cancelled: ${reservation._id} by user ${req.user.id} (${req.user.role})`);

        return res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: reservation,
        });
    } catch (error) {
        logger.error('Cancel reservation failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get all reservations for garages owned by the current garage owner
 */
export const getGarageReservations = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
        } = req.query;

        // First, get all garages owned by this user
        const garages = await Garage.find({ owner: req.user.id, deletedAt: null }).select('_id').maxTimeMS(8000);
        const garageIds = garages.map(g => g._id);

        if (garageIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: 0,
                    pages: 0,
                },
            });
        }

        // Build query for reservations belonging to these garages
        const query = { garage: { $in: garageIds } };

        if (status) query.status = status;
        if (startDate) query.startTime = { $gte: new Date(startDate) };
        if (endDate) query.endTime = { $lte: new Date(endDate) };

        const reservations = await Reservation.find(query)
            .populate('garage', 'name address location')
            .populate('vehicle', 'make model plateNumber type color image')
            .populate('user', 'name phone email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Reservation.countDocuments(query);

        logger.info(`Garage owner ${req.user.id} fetched ${reservations.length} reservations for ${garageIds.length} garages`);

        return res.status(200).json({
            success: true,
            data: reservations,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get garage reservations failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Accept a reservation (garage owner only)
 */
export const acceptReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'garage',
            select: 'name owner arrivalLimitMinutes'
        }).populate({
            path: 'user',
            select: 'name email phone'
        }).populate({
            path: 'vehicle',
            select: 'make model plateNumber'
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Check if garage belongs to current user
        if (!reservation.garage || reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to accept this reservation',
            });
        }

        // Can only accept pending reservations
        if (reservation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot accept a ${reservation.status} reservation`,
            });
        }

        // Require deposit to be paid before garage owner can accept
        if (!reservation.depositPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept this booking — the car owner has not paid the deposit yet.',
            });
        }

        reservation.status = 'confirmed';
        // Set arrival deadline based on garage's arrivalLimitMinutes
        const arrivalLimit = reservation.garage.arrivalLimitMinutes ?? 15;
        reservation.arrivalDeadline = new Date(
            new Date(reservation.startTime).getTime() + arrivalLimit * 60 * 1000
        );
        await reservation.save();

        // ── Decrement available slots ──
        await Garage.findByIdAndUpdate(reservation.garage._id, {
            $inc: { availableSlots: -1 },
        });
        // Ensure it doesn't go below 0
        await Garage.updateOne(
            { _id: reservation.garage._id, availableSlots: { $lt: 0 } },
            { $set: { availableSlots: 0 } }
        );

        // ── ESCROW RELEASE: deposit paid → release to garage wallet ──
        if (reservation.depositPaid && reservation.depositAmount > 0) {
            try {
                const Payment = (await import('../models/Payment.js')).default;
                const depositPayment = await Payment.findOne({
                    reservation: reservation._id,
                    'metadata.isDeposit': true,
                    escrowStatus: 'held',
                    status: 'success',
                });
                if (depositPayment) {
                    // Apply commission and credit garage wallet
                    const { applyCommissionAndCreditWallet } = await import('../controllers/paymentController.js');
                    await applyCommissionAndCreditWallet(depositPayment, reservation.garage, reservation);
                    depositPayment.escrowStatus = 'released';
                    depositPayment.escrowReleasedAt = new Date();
                    await depositPayment.save();
                    logger.info(`Escrow released: deposit ${depositPayment.amount} ETB for reservation ${reservation._id}`);
                }
            } catch (escrowErr) {
                logger.error('Escrow release failed (non-critical):', escrowErr.message);
            }
        }

        // Create notification for car owner
        try {
            await createNotification({
                recipient: reservation.user,
                title: 'Booking Confirmed',
                message: `Your booking at ${reservation.garage.name} has been confirmed. Your deposit of ${reservation.depositAmount} ETB will be applied to the final payment.`,
                type: 'reservation_accepted',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/my-reservations',
                priority: 'high',
            });
            logger.info(`Notification sent to car owner ${reservation.user}`);
        } catch (notifError) {
            logger.error('Failed to create confirmation notification', { error: notifError.message });
        }

        logger.info(`Reservation ${reservation._id} accepted by garage owner ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Reservation accepted successfully',
            data: reservation,
        });
    } catch (error) {
        logger.error('Accept reservation failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Reject a reservation (garage owner only)
 */
export const rejectReservation = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'garage',
            select: 'name owner'
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Check if garage belongs to current user
        if (!reservation.garage || reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reject this reservation',
            });
        }

        // Can only reject pending reservations
        if (reservation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject a ${reservation.status} reservation`,
            });
        }

        reservation.status = 'cancelled';
        if (reason) {
            reservation.notes = reservation.notes
                ? `${reservation.notes}\n\nRejection reason: ${reason}`
                : `Rejection reason: ${reason}`;
        }
        await reservation.save();

        // ── ESCROW REFUND: deposit paid → mark for refund ──
        if (reservation.depositPaid && reservation.depositAmount > 0) {
            try {
                const Payment = (await import('../models/Payment.js')).default;
                const depositPayment = await Payment.findOne({
                    reservation: reservation._id,
                    'metadata.isDeposit': true,
                    status: 'success',
                    // Find held deposits OR deposits without escrow status (older payments)
                    $or: [
                        { escrowStatus: 'held' },
                        { escrowStatus: null },
                        { escrowStatus: { $exists: false } },
                    ],
                });
                if (depositPayment) {
                    depositPayment.escrowStatus = 'refund_pending';
                    depositPayment.escrowRefundReason = reason || 'Booking rejected by garage owner';
                    await depositPayment.save();
                    logger.info(`Escrow refund pending: deposit ${depositPayment.amount} ETB for reservation ${reservation._id}`);
                }
            } catch (escrowErr) {
                logger.error('Escrow refund mark failed (non-critical):', escrowErr.message);
            }
        }

        // Create notification for car owner
        try {
            const message = reason
                ? `Your booking at ${reservation.garage.name} was rejected. Reason: ${reason}`
                : `Your booking at ${reservation.garage.name} was rejected`;

            await createNotification({
                recipient: reservation.user,
                title: 'Booking Rejected',
                message,
                type: 'reservation_rejected',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/my-reservations',
                priority: 'high',
            });
            logger.info(`Notification sent to car owner ${reservation.user}`);
        } catch (notifError) {
            logger.error('Failed to create rejection notification', { error: notifError.message });
        }

        logger.info(`Reservation ${reservation._id} rejected by garage owner ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Reservation rejected successfully',
            data: reservation,
        });
    } catch (error) {
        logger.error('Reject reservation failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Update reservation status (garage owner only)
 */
export const updateReservationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'garage',
            select: 'name owner'
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Check if garage belongs to current user
        if (!reservation.garage || reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this reservation',
            });
        }

        // Validate status transitions
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['active', 'cancelled'],
            active: ['completed', 'cancelled'],
            completed: [],
            cancelled: [],
        };

        if (!validTransitions[reservation.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${reservation.status} to ${status}`,
            });
        }

        const previousStatus = reservation.status;
        reservation.status = status;
        await reservation.save();

        // ── Slot management ──
        // Slot was decremented when booking was accepted (pending→confirmed).
        // Restore it when a confirmed/active booking is cancelled or completed.
        if (['cancelled', 'completed'].includes(status) &&
            ['confirmed', 'active'].includes(previousStatus)) {
            await Garage.findByIdAndUpdate(reservation.garage._id, {
                $inc: { availableSlots: 1 },
            });
            // Cap at capacity
            const g = await Garage.findById(reservation.garage._id).select('capacity availableSlots');
            if (g && g.availableSlots > g.capacity) {
                await Garage.findByIdAndUpdate(reservation.garage._id, { $set: { availableSlots: g.capacity } });
            }
        }

        // Send notification to car owner based on new status
        try {
            let notifTitle = '';
            let notifMessage = '';
            let notifType = 'reservation_confirmed';
            let notifPriority = 'normal';

            if (status === 'active') {
                notifTitle = 'Service Started';
                notifMessage = `Your ${reservation.serviceType} service has started at ${reservation.garage.name}.`;
                notifType = 'service_started';
                notifPriority = 'normal';
            } else if (status === 'completed') {
                notifTitle = 'Service Completed';
                notifMessage = `Your ${reservation.serviceType} service at ${reservation.garage.name} is complete. Please leave a review!`;
                notifType = 'service_completed';
                notifPriority = 'high';
            } else if (status === 'cancelled') {
                notifTitle = 'Booking Cancelled';
                notifMessage = `Your booking for ${reservation.serviceType} at ${reservation.garage.name} has been cancelled.`;
                notifType = 'reservation_cancelled';
                notifPriority = 'high';
            }

            if (notifTitle) {
                await createNotification({
                    recipient: reservation.user,
                    title: notifTitle,
                    message: notifMessage,
                    type: notifType,
                    relatedModel: 'Reservation',
                    relatedId: reservation._id,
                    actionUrl: '/my-reservations',
                    priority: notifPriority,
                });
            }
        } catch (notifError) {
            logger.error('Failed to create status update notification', { error: notifError.message });
        }

        logger.info(`Reservation ${reservation._id} status updated to ${status} by garage owner ${req.user.id}`);

        // Slot is freed immediately on completion (handled above in slot management block).
        // Archive happens after 1 day via the scheduler — NOT immediately here.

        // Populate again for response
        await reservation.populate('vehicle user');

        return res.status(200).json({
            success: true,
            message: 'Reservation status updated successfully',
            data: reservation,
        });
    } catch (error) {
        logger.error('Update reservation status failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Pay deposit for a pending reservation (car_owner only)
 * Creates a deposit Payment record and marks reservation.depositPaid = true
 */
export const payDeposit = async (req, res, next) => {
    try {
        const { paymentMethod } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate('garage');

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Cannot pay deposit for a ${reservation.status} reservation` });
        }

        if (reservation.depositPaid) {
            return res.status(400).json({ success: false, message: 'Deposit already paid' });
        }

        // Recalculate deposit using current garage depositPercent in case it changed
        const currentDepositRate = (reservation.garage.depositPercent ?? 30) / 100;
        const recalculatedDeposit = Math.ceil(reservation.totalPrice * currentDepositRate);
        if (recalculatedDeposit !== reservation.depositAmount) {
            reservation.depositAmount = recalculatedDeposit;
            logger.info(`Deposit recalculated for reservation ${reservation._id}: ${recalculatedDeposit} ETB (${reservation.garage.depositPercent ?? 30}%)`);
        }

        if (!reservation.depositAmount || reservation.depositAmount <= 0) {
            return res.status(400).json({ success: false, message: 'No deposit required for this reservation' });
        }

        const transactionId = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create deposit payment record
        const depositPayment = await Payment.create({
            reservation: reservation._id,
            user: req.user.id,
            garage: reservation.garage._id,
            amount: reservation.depositAmount,
            paymentMethod: paymentMethod || 'cash',
            status: 'success',
            isVerified: false,
            transactionId,
            description: `Deposit for reservation ${reservation._id}`,
            metadata: { isDeposit: true },
        });

        // Mark deposit as paid on reservation
        reservation.depositPaid = true;
        reservation.depositPaidAt = new Date();
        await reservation.save();

        // Notify garage owner
        try {
            await createNotification({
                recipient: reservation.garage.owner,
                title: 'Deposit Paid — Review Booking',
                message: `${req.user.name || 'A customer'} paid the deposit of ${reservation.depositAmount} ETB for ${reservation.serviceType}. You can now accept or reject the booking.`,
                type: 'payment_received',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/bookings',
                priority: 'high',
            });
        } catch (notifError) {
            logger.error('Failed to send deposit notification', { error: notifError.message });
        }

        logger.info(`Deposit paid for reservation ${reservation._id} by user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Deposit paid successfully. The garage owner will now review your booking.',
            data: { reservation, depositPayment },
        });
    } catch (error) {
        logger.error('Pay deposit failed', { error: error.message });
        next(error);
    }
};

/**
 * Mark a reservation as no-show (garage owner only)
 * Car owner did not arrive — garage owner keeps the deposit
 */
export const markNoShow = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'garage',
            select: 'name owner',
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (!reservation.garage || reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (reservation.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `Can only mark confirmed reservations as no-show (current: ${reservation.status})`,
            });
        }

        // Booking time must have passed (or be within 30 min of start)
        const now = new Date();
        const startTime = new Date(reservation.startTime);
        const minutesUntilStart = (startTime - now) / 60000;
        if (minutesUntilStart > 30) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark as no-show more than 30 minutes before the scheduled start time.',
            });
        }

        reservation.status = 'no_show';
        await reservation.save();

        // Mark deposit payment as garage earnings (garage keeps deposit)
        await Payment.updateMany(
            { reservation: reservation._id, 'metadata.isDeposit': true },
            {
                $set: {
                    isVerified: true,
                    verifiedAt: new Date(),
                    'metadata.keptAsNoShowPenalty': true,
                },
            }
        );

        // Notify car owner
        try {
            await createNotification({
                recipient: reservation.user,
                title: 'Booking Marked as No-Show',
                message: `You did not arrive for your ${reservation.serviceType} appointment at ${reservation.garage.name}. Your deposit of ${reservation.depositAmount} ETB has been forfeited.`,
                type: 'reservation_cancelled',
                relatedModel: 'Reservation',
                relatedId: reservation._id,
                actionUrl: '/my-reservations',
                priority: 'high',
            });
        } catch (notifError) {
            logger.error('Failed to send no-show notification', { error: notifError.message });
        }

        logger.info(`Reservation ${reservation._id} marked as no-show by garage owner ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Reservation marked as no-show. Deposit has been retained.',
            data: reservation,
        });
    } catch (error) {
        logger.error('Mark no-show failed', { error: error.message });
        next(error);
    }
};

export const checkArrival = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'garage',
            select: 'name owner arrivalLimitMinutes depositPercent',
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Only garage owner can check arrival
        if (!reservation.garage || reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (reservation.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `Can only check arrival for confirmed reservations (current: ${reservation.status})`,
            });
        }

        const now = new Date();
        const startTime = new Date(reservation.startTime);
        const arrivalLimit = reservation.garage.arrivalLimitMinutes ?? 15;
        const deadline = new Date(startTime.getTime() + arrivalLimit * 60 * 1000);
        const isLate = now > deadline;

        reservation.arrivedAt = now;
        reservation.arrivedOnTime = !isLate;

        if (isLate) {
            // Late arrival: deposit is forfeited, customer still owes full price
            reservation.depositForfeited = true;
            reservation.depositForfeitedAt = now;
            reservation.status = 'active'; // service still proceeds

            // Notify car owner about late penalty
            try {
                await createNotification({
                    recipient: reservation.user,
                    title: 'Late Arrival — Deposit Forfeited',
                    message: `You arrived late for your ${reservation.serviceType} at ${reservation.garage.name}. Your deposit of ${reservation.depositAmount} ETB has been forfeited. You must pay the full service price of ${reservation.totalPrice} ETB.`,
                    type: 'payment_required',
                    relatedModel: 'Reservation',
                    relatedId: reservation._id,
                    actionUrl: '/my-reservations',
                    priority: 'high',
                });
            } catch (e) {
                logger.error('Late arrival notification failed', { error: e.message });
            }

            await reservation.save();

            return res.status(200).json({
                success: true,
                message: `Customer arrived LATE (${Math.round((now - startTime) / 60000)} min after start). Deposit forfeited. Full price applies.`,
                data: { reservation, isLate: true, depositForfeited: true },
            });
        }

        // On-time arrival — activate booking
        reservation.status = 'active';
        await reservation.save();

        return res.status(200).json({
            success: true,
            message: 'Customer arrived on time. Booking is now active.',
            data: { reservation, isLate: false, depositForfeited: false },
        });
    } catch (error) {
        logger.error('Check arrival failed', { error: error.message });
        next(error);
    }
};

/**
 * Garage owner proposes a price adjustment (extra work found)
 */
export const proposeAdjustedPrice = async (req, res, next) => {
    try {
        const { adjustedPrice, reason } = req.body;
        if (!adjustedPrice || adjustedPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Adjusted price must be greater than 0' });
        }
        const reservation = await Reservation.findById(req.params.id).populate('garage');
        if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
        if (reservation.garage.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (!['confirmed', 'active'].includes(reservation.status)) {
            return res.status(400).json({ success: false, message: 'Can only adjust price for confirmed or active reservations' });
        }
        if (adjustedPrice <= reservation.totalPrice) {
            return res.status(400).json({ success: false, message: 'Adjusted price must be higher than original price' });
        }
        reservation.adjustedPrice = adjustedPrice;
        reservation.adjustedPriceReason = reason || 'Additional work required';
        reservation.adjustedPriceStatus = 'pending';
        reservation.adjustedPriceAt = new Date();
        await reservation.save();

        // Notify car owner
        try {
            await createNotification({
                recipient: reservation.user,
                title: 'Price Adjustment Requested',
                message: `Your garage service price has been updated to ${adjustedPrice} ETB. Reason: ${reservation.adjustedPriceReason}. Please review and respond.`,
                type: 'payment',
                actionUrl: '/my-reservations',
                priority: 'high',
            });
        } catch { /* notification not critical */ }

        return res.status(200).json({ success: true, message: 'Price adjustment proposed', data: reservation });
    } catch (error) {
        logger.error('Propose adjusted price failed', { error: error.message });
        next(error);
    }
};

/**
 * Car owner accepts or rejects the adjusted price
 */
export const respondToAdjustedPrice = async (req, res, next) => {
    try {
        const { response } = req.body; // 'accepted' or 'rejected'
        if (!['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({ success: false, message: 'Response must be accepted or rejected' });
        }
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
        if (reservation.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (reservation.adjustedPriceStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'No pending price adjustment' });
        }
        reservation.adjustedPriceStatus = response;
        reservation.adjustedPriceRespondedAt = new Date();
        if (response === 'accepted') {
            reservation.totalPrice = reservation.adjustedPrice;
        }
        await reservation.save();

        // Notify garage owner of the response
        try {
            const garage = await Garage.findById(reservation.garage).select('owner name');
            if (garage) {
                await createNotification({
                    recipient: garage.owner,
                    title: response === 'accepted' ? '✅ Price Adjustment Accepted' : '❌ Price Adjustment Rejected',
                    message: response === 'accepted'
                        ? `Customer accepted the price adjustment of ${reservation.adjustedPrice} ETB.`
                        : `Customer rejected the price adjustment. Original price of ${reservation.totalPrice} ETB applies.`,
                    type: 'payment',
                    actionUrl: '/bookings',
                    priority: 'high',
                });
            }
        } catch { /* non-critical */ }

        return res.status(200).json({
            success: true,
            message: response === 'accepted' ? 'Price adjustment accepted. Please pay the updated amount.' : 'Price adjustment rejected.',
            data: reservation,
        });
    } catch (error) {
        logger.error('Respond to adjusted price failed', { error: error.message });
        next(error);
    }
};

export default {
    createReservation,
    getMyReservations,
    getReservationById,
    cancelReservation,
    getGarageReservations,
    acceptReservation,
    rejectReservation,
    updateReservationStatus,
    payDeposit,
    markNoShow,
    checkArrival,
    proposeAdjustedPrice,
    respondToAdjustedPrice,
};