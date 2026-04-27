// src/controllers/disputeController.js
import mongoose from 'mongoose';
import Dispute from '../models/Dispute.js';
import Reservation from '../models/Reservation.js';
import Garage from '../models/Garage.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';

/**
 * Create a new dispute/complaint (car owner only)
 */
export const createDispute = async (req, res, next) => {
    try {
        const { reservationId, type, reason, description, evidenceUrls } = req.body;

        // Validate reservation exists and belongs to user
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        if (reservation.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create dispute for this reservation',
            });
        }

        // Check if dispute already exists for this reservation
        const existingDispute = await Dispute.findOne({
            reservation: reservationId,
            status: { $nin: ['resolved', 'rejected', 'closed'] }
        });

        if (existingDispute) {
            return res.status(400).json({
                success: false,
                message: 'An active dispute already exists for this reservation',
            });
        }

        // Create dispute
        const dispute = await Dispute.create({
            reservation: reservationId,
            user: req.user.id,
            garage: reservation.garage,
            type,
            reason,
            description,
            evidenceUrls: evidenceUrls || [],
        });

        // Get garage details for notification
        const garage = await Garage.findById(reservation.garage);

        // Create notification for garage owner
        try {
            await createNotification({
                recipient: garage.owner,
                title: 'New Dispute Filed',
                message: `A customer filed a dispute: ${reason}`,
                type: 'dispute_created',
                relatedModel: 'Dispute',
                relatedId: dispute._id,
                actionUrl: '/garage-disputes',
                priority: 'urgent',
            });
            // Notify car owner that dispute was submitted
            await createNotification({
                recipient: req.user.id,
                title: 'Dispute Submitted',
                message: `Your dispute has been submitted and is under review.`,
                type: 'dispute_created',
                relatedModel: 'Dispute',
                relatedId: dispute._id,
                actionUrl: '/disputes',
                priority: 'normal',
            });
            logger.info(`Notification sent to garage owner ${garage.owner}`);
        } catch (notifError) {
            logger.error('Failed to create dispute notification', { error: notifError.message });
        }

        logger.info(`Dispute created: ${dispute._id} by user ${req.user.id} for reservation ${reservationId}`);

        return res.status(201).json({
            success: true,
            message: 'Dispute submitted successfully. Our team will review it shortly.',
            data: dispute,
        });
    } catch (error) {
        logger.error('Create dispute failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get all disputes for current user
 */
export const getMyDisputes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user.id };
        if (status) query.status = status;

        const disputes = await Dispute.find(query)
            .populate('reservation', 'startTime endTime serviceType totalPrice status')
            .populate('garage', 'name address')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Dispute.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: disputes,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get my disputes failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get disputes for garage owner's garages
 */
export const getGarageDisputes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        // Get all garages owned by this user
        const garages = await Garage.find({ owner: req.user.id }).select('_id');
        const garageIds = garages.map(g => g._id);

        if (garageIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
            });
        }

        const query = { garage: { $in: garageIds } };
        if (status) query.status = status;

        const disputes = await Dispute.find(query)
            .populate('reservation', 'startTime endTime serviceType totalPrice status')
            .populate('user', 'name phone email')
            .populate('garage', 'name address')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Dispute.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: disputes,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get garage disputes failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get dispute by ID
 */
export const getDisputeById = async (req, res, next) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('reservation')
            .populate('user', 'name phone email')
            .populate('garage', 'name address phone')
            .populate('resolvedBy', 'name');

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        // Authorization check
        const isOwner = dispute.user._id.toString() === req.user.id;
        const isGarageOwner = await Garage.findOne({ _id: dispute.garage._id, owner: req.user.id });
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this dispute',
            });
        }

        return res.status(200).json({
            success: true,
            data: dispute,
        });
    } catch (error) {
        logger.error('Get dispute by ID failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Update dispute status (admin or garage owner)
 */
export const updateDisputeStatus = async (req, res, next) => {
    try {
        const { status, resolutionNote } = req.body;

        const dispute = await Dispute.findById(req.params.id).populate('garage');
        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        // Authorization check
        const isGarageOwner = dispute.garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this dispute',
            });
        }

        // Update dispute
        dispute.status = status;
        if (resolutionNote) dispute.resolutionNote = resolutionNote;

        if (['resolved', 'rejected', 'closed'].includes(status)) {
            dispute.resolvedBy = req.user.id;
            dispute.resolvedAt = new Date();
        }

        await dispute.save();

        // Notify car owner about dispute status change
        try {
            const notifType = ['resolved', 'rejected', 'closed'].includes(status)
                ? 'dispute_resolved' : 'dispute_updated';
            await createNotification({
                recipient: dispute.user,
                title: 'Dispute Updated',
                message: resolutionNote
                    ? `Your dispute status changed to "${status}". Note: ${resolutionNote}`
                    : `Your dispute status has been updated to "${status}".`,
                type: notifType,
                relatedModel: 'Dispute',
                relatedId: dispute._id,
                actionUrl: '/disputes',
                priority: 'high',
            });
        } catch (notifError) {
            logger.error('Failed to send dispute update notification', { error: notifError.message });
        }

        logger.info(`Dispute ${dispute._id} status updated to ${status} by user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Dispute status updated successfully',
            data: dispute,
        });
    } catch (error) {
        logger.error('Update dispute status failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Get all disputes (admin only)
 */
export const getAllDisputes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, priority } = req.query;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;

        const disputes = await Dispute.find(query)
            .populate('reservation', 'startTime endTime serviceType totalPrice status')
            .populate('user', 'name phone email')
            .populate('garage', 'name address')
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Dispute.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: disputes,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get all disputes failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Admin intervention on dispute
 */
export const adminIntervention = async (req, res, next) => {
    try {
        const { interventionNote } = req.body;

        if (!interventionNote || !interventionNote.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Intervention note is required',
            });
        }

        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        // Add intervention note to resolution note
        const adminNote = `\n\n[ADMIN INTERVENTION by ${req.user.name}]\n${interventionNote.trim()}`;
        dispute.resolutionNote = dispute.resolutionNote
            ? dispute.resolutionNote + adminNote
            : adminNote;

        // Update status to under_review if still pending
        if (dispute.status === 'pending') {
            dispute.status = 'under_review';
        }

        await dispute.save();

        logger.info(`Admin intervention on dispute ${dispute._id} by ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Intervention recorded successfully',
            data: dispute,
        });
    } catch (error) {
        logger.error('Admin intervention failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Admin takes action on dispute (approve, reject, refund, warn, suspend, block)
 */
export const adminTakeAction = async (req, res, next) => {
    try {
        const { action, adminNote, refundAmount, targetUserId } = req.body;

        const validActions = ['approved', 'rejected', 'warning_issued', 'refund_issued', 'account_suspended', 'user_blocked'];

        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid action is required (approved, rejected, warning_issued, refund_issued, account_suspended, user_blocked)',
            });
        }

        if (!adminNote || !adminNote.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Admin note is required to explain the action',
            });
        }

        const dispute = await Dispute.findById(req.params.id)
            .populate('user garage reservation');

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        // Update dispute with admin action
        dispute.adminAction = action;
        dispute.adminNote = adminNote.trim();
        dispute.resolvedBy = req.user.id;
        dispute.resolvedAt = new Date();

        // Set status based on action
        if (action === 'approved') {
            dispute.status = 'resolved';
        } else if (action === 'rejected') {
            dispute.status = 'rejected';
        } else {
            dispute.status = 'resolved';
        }

        // Handle refund
        if (action === 'refund_issued' && refundAmount) {
            dispute.refundAmount = refundAmount;
        }

        // Add to action history
        dispute.actionHistory.push({
            action: action,
            performedBy: req.user.id,
            note: adminNote.trim(),
            timestamp: new Date(),
        });

        await dispute.save();

        // Handle user actions (warning, suspension, blocking)
        if (targetUserId) {
            const User = mongoose.model('User');
            const targetUser = await User.findById(targetUserId);

            if (targetUser) {
                if (action === 'warning_issued') {
                    // Add warning to user record (you may want to add a warnings field to User model)
                    logger.warn(`Warning issued to user ${targetUserId} for dispute ${dispute._id}`);
                } else if (action === 'account_suspended') {
                    targetUser.accountStatus = 'suspended';
                    targetUser.suspensionReason = `Dispute ${dispute._id}: ${adminNote}`;
                    await targetUser.save();
                    logger.warn(`Account suspended: ${targetUserId} for dispute ${dispute._id}`);
                } else if (action === 'user_blocked') {
                    targetUser.accountStatus = 'blocked';
                    targetUser.blockReason = `Dispute ${dispute._id}: ${adminNote}`;
                    await targetUser.save();
                    logger.warn(`User blocked: ${targetUserId} for dispute ${dispute._id}`);
                }
            }
        }

        // Create notifications for both parties
        try {
            // Notify car owner
            let carOwnerMessage = '';
            if (action === 'approved') {
                carOwnerMessage = `Your dispute has been resolved in your favor. ${adminNote}`;
            } else if (action === 'rejected') {
                carOwnerMessage = `Your dispute was rejected. ${adminNote}`;
            } else if (action === 'refund_issued') {
                carOwnerMessage = `Your dispute has been resolved. A refund of ${refundAmount} ETB has been issued.`;
            } else {
                carOwnerMessage = `Your dispute has been resolved. ${adminNote}`;
            }

            await createNotification({
                recipient: dispute.user._id || dispute.user,
                title: 'Dispute Resolved',
                message: carOwnerMessage,
                type: 'dispute_resolved',
                actionUrl: `/disputes/${dispute._id}`,
            });

            // Notify garage owner
            const Garage = mongoose.model('Garage');
            const garage = await Garage.findById(dispute.garage);
            if (garage) {
                let garageOwnerMessage = '';
                if (action === 'approved') {
                    garageOwnerMessage = `A dispute was resolved in the customer's favor. ${adminNote}`;
                } else if (action === 'rejected') {
                    garageOwnerMessage = `A dispute against your garage was rejected. ${adminNote}`;
                } else {
                    garageOwnerMessage = `A dispute has been resolved. ${adminNote}`;
                }

                await createNotification({
                    recipient: garage.owner,
                    title: 'Dispute Resolved',
                    message: garageOwnerMessage,
                    type: 'dispute_resolved',
                    actionUrl: `/garage/disputes/${dispute._id}`,
                });
            }

            logger.info(`Notifications sent for dispute resolution ${dispute._id}`);
        } catch (notifError) {
            logger.error('Failed to create dispute resolution notifications', { error: notifError.message });
        }

        logger.info(`Admin action '${action}' taken on dispute ${dispute._id} by ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: `Action '${action}' completed successfully`,
            data: dispute,
        });
    } catch (error) {
        logger.error('Admin action failed', { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Update dispute priority (admin only)
 */
export const updateDisputePriority = async (req, res, next) => {
    try {
        const { priority, adminNote } = req.body;
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        dispute.priority = priority;

        if (adminNote) {
            const note = `[Admin Note - ${new Date().toLocaleString()}]: ${adminNote}`;
            dispute.description = dispute.description
                ? `${dispute.description}\n\n${note}`
                : note;
        }

        await dispute.save();

        logger.info(`Dispute ${dispute._id} priority updated to ${priority} by admin ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Dispute priority updated successfully',
            data: dispute,
        });
    } catch (error) {
        logger.error('Update dispute priority failed', { error: error.message });
        next(error);
    }
};

export default {
    createDispute,
    getMyDisputes,
    getGarageDisputes,
    getDisputeById,
    updateDisputeStatus,
    getAllDisputes,
    adminIntervention,
    adminTakeAction,
    updateDisputePriority,
};
