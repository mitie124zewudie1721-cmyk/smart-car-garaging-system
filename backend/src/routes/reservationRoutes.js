// src/routes/reservationRoutes.js – FIXED & COMPLETE
console.log('✅ reservationRoutes.js LOADED successfully');

import express from 'express';
import { z } from 'zod';
import reservationController from '../controllers/reservationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const createReservationSchema = z.object({
    body: z.object({
        garageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid garage ID').optional(),
        vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID'),
        startTime: z.string().datetime({ offset: true }, 'Invalid start time (use ISO 8601 format)'),
        endTime: z.string().datetime({ offset: true }, 'Invalid end time (use ISO 8601 format)'),
        serviceType: z.string().min(1, 'Service type is required').max(200, 'Service type too long'),
        serviceDescription: z.string().max(1000, 'Service description too long').trim().optional(),
        notes: z.string().max(500, 'Notes too long').trim().optional(),
    }).refine(
        (data) => new Date(data.startTime) < new Date(data.endTime),
        {
            message: 'End time must be after start time',
            path: ['endTime'],
        }
    ),
});

const reservationIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
    }),
});

const myReservationsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(5).max(50).default(10).optional(),
        status: z.enum([
            'pending',
            'confirmed',
            'active',
            'completed',
            'cancelled',
            'no_show',
        ]).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        garageId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    }).refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
        },
        {
            message: 'startDate must be before or equal to endDate',
            path: ['endDate'],
        }
    ),
});

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Car owner routes ──
router.post(
    '/',
    restrictTo('car_owner'),
    validate(createReservationSchema),
    reservationController.createReservation
);

router.get(
    '/my',
    validate(myReservationsSchema),
    reservationController.getMyReservations
);

// ── Garage owner routes (MUST come before /:id to avoid route collision)
router.get(
    '/garage-bookings',
    restrictTo('garage_owner'),
    validate(myReservationsSchema),
    reservationController.getGarageReservations
);

router.patch(
    '/:id/accept',
    restrictTo('garage_owner'),
    validate(reservationIdParamSchema),
    reservationController.acceptReservation
);

router.patch(
    '/:id/reject',
    restrictTo('garage_owner'),
    validate(reservationIdParamSchema),
    reservationController.rejectReservation
);

router.patch(
    '/:id/no-show',
    restrictTo('garage_owner'),
    validate(reservationIdParamSchema),
    reservationController.markNoShow
);

router.patch(
    '/:id/check-arrival',
    restrictTo('garage_owner'),
    validate(reservationIdParamSchema),
    reservationController.checkArrival
);

router.patch(
    '/:id/status',
    restrictTo('garage_owner'),
    validate(z.object({
        params: z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
        }),
        body: z.object({
            status: z.enum(['confirmed', 'active', 'completed', 'cancelled']),
        }),
    })),
    reservationController.updateReservationStatus
);

// ── Dynamic routes (MUST come last)
router.patch(
    '/:id/pay-deposit',
    restrictTo('car_owner'),
    validate(reservationIdParamSchema),
    reservationController.payDeposit
);

router.get(
    '/:id',
    validate(reservationIdParamSchema),
    reservationController.getReservationById
);

router.delete(
    '/:id',
    validate(reservationIdParamSchema),
    reservationController.cancelReservation
);

// ── Price adjustment routes ──
// Garage owner proposes a price increase
router.patch('/:id/adjust-price', restrictTo('garage_owner'), reservationController.proposeAdjustedPrice);
// Car owner accepts or rejects the adjusted price
router.patch('/:id/respond-price', restrictTo('car_owner'), reservationController.respondToAdjustedPrice);

export default router;

// ── Archive routes (admin) ──
router.get('/admin/archived', restrictTo('admin'), async (req, res, next) => {
    try {
        const ArchivedReservation = (await import('../models/ArchivedReservation.js')).default;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const [data, total] = await Promise.all([
            ArchivedReservation.find()
                .populate('user', 'name email')
                .populate('garage', 'name')
                .sort({ archivedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            ArchivedReservation.countDocuments(),
        ]);
        res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

router.post('/admin/archive-sweep', restrictTo('admin'), async (req, res, next) => {
    try {
        const { archiveAllCompleted } = await import('../services/archiveService.js');
        const result = await archiveAllCompleted();
        res.json({ success: true, message: `Archived ${result.archived} reservation(s)`, ...result });
    } catch (err) { next(err); }
});
