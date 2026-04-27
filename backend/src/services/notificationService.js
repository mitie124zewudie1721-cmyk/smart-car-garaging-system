// src/services/notificationService.js
import { createNotification } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

/**
 * Notification templates and helper functions
 */

export const notifyReservationConfirmed = async (reservation, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'reservation_confirmed',
            title: 'Reservation Confirmed',
            message: `Your service appointment at ${reservation.garage?.name || 'garage'} has been confirmed for ${new Date(reservation.startTime).toLocaleDateString()}.`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/my-reservations',
            priority: 'normal',
        });
    } catch (error) {
        logger.error('Failed to send reservation confirmed notification', { error: error.message });
    }
};

export const notifyReservationAccepted = async (reservation, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'reservation_accepted',
            title: 'Reservation Accepted',
            message: `Your service request has been accepted by ${reservation.garage?.name || 'the garage'}.`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/my-reservations',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send reservation accepted notification', { error: error.message });
    }
};

export const notifyReservationRejected = async (reservation, userId, reason) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'reservation_rejected',
            title: 'Reservation Rejected',
            message: `Your service request was rejected. ${reason || 'Please contact the garage for more information.'}`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/my-reservations',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send reservation rejected notification', { error: error.message });
    }
};

export const notifyServiceStarted = async (reservation, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'service_started',
            title: 'Service Started',
            message: `Your vehicle service has started at ${reservation.garage?.name || 'the garage'}.`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/my-reservations',
            priority: 'normal',
        });
    } catch (error) {
        logger.error('Failed to send service started notification', { error: error.message });
    }
};

export const notifyServiceCompleted = async (reservation, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'service_completed',
            title: 'Service Completed',
            message: `Your vehicle service has been completed. Please leave feedback about your experience.`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/my-reservations',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send service completed notification', { error: error.message });
    }
};

export const notifyNewReservation = async (reservation, garageOwnerId) => {
    try {
        await createNotification({
            recipient: garageOwnerId,
            type: 'reservation_confirmed',
            title: 'New Reservation',
            message: `New service request for ${reservation.serviceType} on ${new Date(reservation.startTime).toLocaleDateString()}.`,
            relatedModel: 'Reservation',
            relatedId: reservation._id,
            actionUrl: '/bookings',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send new reservation notification', { error: error.message });
    }
};

export const notifyDisputeCreated = async (dispute, garageOwnerId) => {
    try {
        await createNotification({
            recipient: garageOwnerId,
            type: 'dispute_created',
            title: 'New Dispute Filed',
            message: `A customer has filed a dispute: ${dispute.reason}`,
            relatedModel: 'Dispute',
            relatedId: dispute._id,
            actionUrl: '/garage-disputes',
            priority: 'urgent',
        });
    } catch (error) {
        logger.error('Failed to send dispute created notification', { error: error.message });
    }
};

export const notifyDisputeUpdated = async (dispute, userId, message) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'dispute_updated',
            title: 'Dispute Updated',
            message: message || `Your dispute has been updated to ${dispute.status}.`,
            relatedModel: 'Dispute',
            relatedId: dispute._id,
            actionUrl: dispute.user.toString() === userId.toString() ? '/disputes' : '/garage-disputes',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send dispute updated notification', { error: error.message });
    }
};

export const notifyDisputeResolved = async (dispute, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            message: `Your dispute has been resolved. ${dispute.resolutionNote || 'Please check the details.'}`,
            relatedModel: 'Dispute',
            relatedId: dispute._id,
            actionUrl: dispute.user.toString() === userId.toString() ? '/disputes' : '/garage-disputes',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send dispute resolved notification', { error: error.message });
    }
};

export const notifyFeedbackReceived = async (feedback, garageOwnerId) => {
    try {
        await createNotification({
            recipient: garageOwnerId,
            type: 'feedback_received',
            title: 'New Feedback Received',
            message: `You received a ${feedback.rating}-star rating from a customer.`,
            relatedModel: 'Feedback',
            relatedId: feedback._id,
            actionUrl: '/analytics',
            priority: 'normal',
        });
    } catch (error) {
        logger.error('Failed to send feedback received notification', { error: error.message });
    }
};

export const notifyGarageApproved = async (garage, userId) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'garage_approved',
            title: 'Garage Approved',
            message: `Congratulations! Your garage "${garage.name}" has been approved and is now visible to customers.`,
            relatedModel: 'Garage',
            relatedId: garage._id,
            actionUrl: '/my-garages',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send garage approved notification', { error: error.message });
    }
};

export const notifyGarageRejected = async (garage, userId, reason) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'garage_rejected',
            title: 'Garage Rejected',
            message: `Your garage "${garage.name}" was not approved. ${reason || 'Please contact support for more information.'}`,
            relatedModel: 'Garage',
            relatedId: garage._id,
            actionUrl: '/my-garages',
            priority: 'high',
        });
    } catch (error) {
        logger.error('Failed to send garage rejected notification', { error: error.message });
    }
};

export const notifyAdminAction = async (userId, title, message, actionUrl) => {
    try {
        await createNotification({
            recipient: userId,
            type: 'admin_action',
            title,
            message,
            actionUrl,
            priority: 'urgent',
        });
    } catch (error) {
        logger.error('Failed to send admin action notification', { error: error.message });
    }
};

export default {
    notifyReservationConfirmed,
    notifyReservationAccepted,
    notifyReservationRejected,
    notifyServiceStarted,
    notifyServiceCompleted,
    notifyNewReservation,
    notifyDisputeCreated,
    notifyDisputeUpdated,
    notifyDisputeResolved,
    notifyFeedbackReceived,
    notifyGarageApproved,
    notifyGarageRejected,
    notifyAdminAction,
};
