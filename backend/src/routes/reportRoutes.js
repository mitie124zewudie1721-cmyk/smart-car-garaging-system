// src/routes/reportRoutes.js
import express from 'express';
import { z } from 'zod';

import reportController from '../controllers/reportController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const receiptSchema = {
    params: z.object({
        reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
    }),
};

const garageReportSchema = {
    params: z.object({
        garageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid garage ID'),
    }),
    query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        type: z.enum(['daily', 'weekly', 'monthly']).default('monthly').optional(),
    }).refine(data => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    }, { message: 'startDate must be before or equal to endDate' }),
};

const analyticsSchema = {
    query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        groupBy: z.enum(['day', 'week', 'month']).default('month').optional(),
    }).optional(),
};

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// All report routes require authentication
router.use(protect);

// Generate receipt for a specific reservation (user or admin)
router.get(
    '/receipt/:reservationId',
    validate(receiptSchema),
    reportController.generateReceipt
);

// Generate report for a garage (garage owner or admin)
router.get(
    '/garage/:garageId',
    restrictTo('garage_owner', 'admin'),
    validate(garageReportSchema),
    reportController.generateGarageReport
);

// Get system-wide analytics (admin only)
router.get(
    '/analytics',
    restrictTo('admin'),
    validate(analyticsSchema),
    reportController.getSystemAnalytics
);

export default router;