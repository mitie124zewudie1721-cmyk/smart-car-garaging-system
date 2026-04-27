// src/controllers/feedbackController.js
import Feedback from '../models/Feedback.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Create feedback for a completed reservation (car_owner only)
 */
export const createFeedback = async (req, res, next) => {
    try {
        const { reservationId, disputeId, rating, comment, feedbackType } = req.body;

        // Handle reservation feedback
        if (reservationId) {
            const reservation = await mongoose.model('Reservation').findById(reservationId);
            if (!reservation) {
                return res.status(404).json({
                    success: false,
                    message: 'Reservation not found',
                });
            }

            // Only the owner of the reservation can give feedback
            if (reservation.user.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to give feedback for this reservation',
                });
            }

            if (reservation.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback can only be given for completed reservations',
                });
            }

            // Prevent duplicate feedback
            const existing = await Feedback.findOne({ reservation: reservationId });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback already submitted for this reservation',
                });
            }

            const feedback = await Feedback.create({
                reservation: reservationId,
                user: req.user.id,
                garage: reservation.garage,
                rating,
                comment,
                feedbackType: 'service',
            });

            logger.info(`Feedback submitted: ${feedback._id} for reservation ${reservationId}`);

            return res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: feedback,
            });
        }

        // Handle dispute feedback
        if (disputeId) {
            const Dispute = mongoose.model('Dispute');
            const dispute = await Dispute.findById(disputeId);

            if (!dispute) {
                return res.status(404).json({
                    success: false,
                    message: 'Dispute not found',
                });
            }

            // Check authorization - both car owner and garage owner can give feedback
            const Garage = mongoose.model('Garage');
            const garage = await Garage.findById(dispute.garage);

            const isCarOwner = dispute.user.toString() === req.user.id;
            const isGarageOwner = garage && garage.owner.toString() === req.user.id;

            if (!isCarOwner && !isGarageOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to give feedback for this dispute',
                });
            }

            // Only allow feedback on resolved or closed disputes
            if (dispute.status !== 'resolved' && dispute.status !== 'closed') {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback can only be given for resolved or closed disputes',
                });
            }

            // Prevent duplicate feedback from same user
            const existing = await Feedback.findOne({
                dispute: disputeId,
                user: req.user.id
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already submitted feedback for this dispute',
                });
            }

            const feedback = await Feedback.create({
                dispute: disputeId,
                user: req.user.id,
                garage: dispute.garage,
                rating,
                comment,
                feedbackType: 'dispute_resolution',
            });

            logger.info(`Dispute feedback submitted: ${feedback._id} for dispute ${disputeId} by user ${req.user.id}`);

            return res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: feedback,
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Either reservationId or disputeId is required',
        });

    } catch (error) {
        logger.error('Feedback creation failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all feedback submitted by the current user
 */
export const getMyFeedbacks = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user.id })
            .populate('reservation garage', 'name startTime endTime')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks,
        });
    } catch (error) {
        logger.error('Get my feedbacks failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all feedback for a specific garage (public or garage owner)
 */
export const getGarageFeedbacks = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { page = 1, limit = 10, minRating } = req.query;

        const query = { garage: garageId };
        if (minRating) query.rating = { $gte: Number(minRating) };

        const feedbacks = await Feedback.find(query)
            .populate('user', 'name profilePicture')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Feedback.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: {
                feedbacks,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        logger.error('Get garage feedbacks failed', { error: error.message });
        next(error);
    }
};

/**
 * Get details of a specific feedback (owner, garage owner, or admin)
 */
export const getFeedbackById = async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('user garage reservation');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
            });
        }

        // Authorization: feedback owner, garage owner, or admin
        const isOwner = feedback.user.toString() === req.user.id;
        const isGarageOwner = feedback.garage?.owner?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this feedback',
            });
        }

        return res.status(200).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        logger.error('Get feedback by ID failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all feedbacks for a specific dispute (both car owner and garage owner)
 */
export const getDisputeFeedbacks = async (req, res, next) => {
    try {
        const { disputeId } = req.params;

        // Get the dispute to verify access
        const Dispute = mongoose.model('Dispute');
        const dispute = await Dispute.findById(disputeId).populate('garage');

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found',
            });
        }

        // Check authorization - must be involved in the dispute
        const Garage = mongoose.model('Garage');
        const garage = await Garage.findById(dispute.garage);

        const isCarOwner = dispute.user.toString() === req.user.id;
        const isGarageOwner = garage && garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isCarOwner && !isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view feedbacks for this dispute',
            });
        }

        // Get all feedbacks for this dispute
        const feedbacks = await Feedback.find({ dispute: disputeId })
            .populate('user', 'name role')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: feedbacks,
        });
    } catch (error) {
        logger.error('Get dispute feedbacks failed', { error: error.message });
        next(error);
    }
};

export default {
    createFeedback,
    getMyFeedbacks,
    getGarageFeedbacks,
    getFeedbackById,
    getDisputeFeedbacks,
};