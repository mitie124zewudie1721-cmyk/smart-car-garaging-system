// src/routes/feedbackRoutes.js
import express from 'express';
import { z } from 'zod';

import feedbackController from '../controllers/feedbackController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const createFeedbackSchema = {
    body: z.object({
        reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID').optional(),
        disputeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID').optional(),
        rating: z.number()
            .int('Rating must be an integer')
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5'),
        comment: z.string()
            .max(500, 'Comment too long (max 500 characters)')
            .trim()
            .optional(),
        feedbackType: z.enum(['service', 'dispute_resolution']).optional(),
    }).refine(data => data.reservationId || data.disputeId, {
        message: 'Either reservationId or disputeId must be provided',
    }),
};

const feedbackIdParamSchema = {
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid feedback ID'),
    }),
};

const garageFeedbackSchema = {
    params: z.object({
        garageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid garage ID'),
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(5).max(50).default(10).optional(),
        minRating: z.coerce.number().min(1).max(5).optional(),
        sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest').optional(),
    }).optional(),
};

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// ── Public route — no auth needed ──
router.get('/public/recent', async (req, res) => {
    try {
        const Feedback = (await import('../models/Feedback.js')).default;
        const reviews = await Feedback.find({ rating: { $gte: 4 }, comment: { $exists: true, $ne: '' } })
            .populate('user', 'name profilePicture')
            .populate('garage', 'name')
            .sort({ createdAt: -1 })
            .limit(6);
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, data: [] });
    }
});

// All routes require authentication
router.use(protect);

// ── Car owner and garage owner routes ──
router.post(
    '/',
    validate(createFeedbackSchema),
    feedbackController.createFeedback
);

router.get(
    '/my',
    feedbackController.getMyFeedbacks
);

// ── Public / garage owner routes ──
router.get(
    '/garage/:garageId',
    validate(garageFeedbackSchema),
    feedbackController.getGarageFeedbacks
);

router.get(
    '/:id',
    validate(feedbackIdParamSchema),
    feedbackController.getFeedbackById
);

// Get all feedbacks for a specific dispute
router.get(
    '/dispute/:disputeId',
    feedbackController.getDisputeFeedbacks
);

// ── Admin-only routes (optional) ──
// router.delete('/:id', restrictTo('admin'), feedbackController.deleteFeedback);

export default router;