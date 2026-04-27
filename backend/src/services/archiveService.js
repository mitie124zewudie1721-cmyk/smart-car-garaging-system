// src/services/archiveService.js
// Archives completed reservations after a 1-day grace period.
// Slot is freed IMMEDIATELY on service completion (in reservationController).
// Archive only moves the record to history and deletes from active reservations.

import Reservation from '../models/Reservation.js';
import ArchivedReservation from '../models/ArchivedReservation.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';

const ARCHIVE_DELAY_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Archive a single completed reservation.
 * Does NOT restore the slot — slot is freed immediately on completion.
 * Just copies data to archive and deletes from active reservations.
 */
export async function archiveReservation(reservationId) {
    const session = await Reservation.startSession();
    session.startTransaction();

    try {
        const reservation = await Reservation.findById(reservationId)
            .populate('garage', 'name capacity')
            .session(session);

        if (!reservation) {
            await session.abortTransaction();
            return { success: false, error: 'Reservation not found' };
        }

        if (reservation.status !== 'completed') {
            await session.abortTransaction();
            return { success: false, error: 'Reservation not completed yet' };
        }

        // Check not already archived
        const existing = await ArchivedReservation.findOne({ originalId: reservation._id });
        if (existing) {
            await session.abortTransaction();
            return { success: true, archivedId: existing._id, alreadyDone: true };
        }

        const payment = await Payment.findOne({
            reservation: reservation._id,
            status: 'success',
        }).sort({ createdAt: -1 });

        const garageId = reservation.garage?._id || reservation.garage;

        const archiveData = {
            originalId: reservation._id,
            user: reservation.user,
            garage: garageId || null,
            vehicle: reservation.vehicle,
            serviceType: reservation.serviceType,
            serviceDescription: reservation.serviceDescription,
            notes: reservation.notes,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            totalPrice: reservation.totalPrice,
            depositAmount: reservation.depositAmount || 0,
            depositPaid: reservation.depositPaid || false,
            paymentStatus: reservation.paymentStatus,
            paymentMethod: payment?.paymentMethod,
            commissionRate: payment?.commissionRate,
            commissionAmount: payment?.commissionAmount,
            garageEarnings: payment?.garageEarnings,
            paymentId: payment?._id,
            chapaRef: payment?.chapaRef,
            reservationCreatedAt: reservation.createdAt,
            serviceCompletedAt: reservation.updatedAt,
            paymentConfirmedAt: payment?.verifiedAt || payment?.updatedAt,
            archivedAt: new Date(),
            slotRestored: true, // slot was already freed on completion
        };

        const [archived] = await ArchivedReservation.create([archiveData], { session });

        // Delete from active reservations
        await Reservation.findByIdAndDelete(reservation._id, { session });

        await session.commitTransaction();
        logger.info(`Reservation ${reservationId} archived (slot was already freed on completion)`);
        return { success: true, archivedId: archived._id };

    } catch (error) {
        await session.abortTransaction();
        logger.error('Archive reservation failed', { reservationId, error: error.message });
        return { success: false, error: error.message };
    } finally {
        session.endSession();
    }
}

/**
 * Scan and archive completed reservations that are older than 1 day.
 * Called by scheduler every hour.
 */
export async function archiveAllCompleted() {
    const cutoff = new Date(Date.now() - ARCHIVE_DELAY_MS);

    // Find completed reservations updated (completed) more than 1 day ago
    const ready = await Reservation.find({
        status: 'completed',
        updatedAt: { $lt: cutoff },
    }).select('_id');

    let archived = 0;
    let failed = 0;

    for (const r of ready) {
        const result = await archiveReservation(r._id);
        if (result.success && !result.alreadyDone) archived++;
        else if (!result.success) {
            failed++;
            logger.warn(`Failed to archive ${r._id}: ${result.error}`);
        }
    }

    if (archived > 0 || failed > 0) {
        logger.info(`Archive sweep: ${archived} archived, ${failed} failed out of ${ready.length} candidates`);
    }
    return { archived, failed, total: ready.length };
}
