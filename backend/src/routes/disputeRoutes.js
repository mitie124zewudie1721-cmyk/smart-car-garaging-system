// src/routes/disputeRoutes.js
import express from 'express';
import { z } from 'zod';
import disputeController from '../controllers/disputeController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const createDisputeSchema = z.object({
    body: z.object({
        reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
        type: z.enum(['complaint', 'cancellation_request', 'refund_request', 'quality_issue', 'other']),
        reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long'),
        description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
        evidenceUrls: z.array(z.string().url()).optional(),
    }),
});

const updateDisputeStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID'),
    }),
    body: z.object({
        status: z.enum(['pending', 'under_review', 'resolved', 'rejected', 'closed']),
        resolutionNote: z.string().max(1000, 'Resolution note too long').optional(),
    }),
});

const disputeIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID'),
    }),
});

// Car owner routes
router.post(
    '/',
    restrictTo('car_owner'),
    validate(createDisputeSchema),
    disputeController.createDispute
);

router.get(
    '/my',
    restrictTo('car_owner'),
    disputeController.getMyDisputes
);

// Garage owner routes
router.get(
    '/garage',
    restrictTo('garage_owner'),
    disputeController.getGarageDisputes
);

// Shared routes (car owner, garage owner, admin)
router.get(
    '/:id',
    validate(disputeIdParamSchema),
    disputeController.getDisputeById
);

// Garage owner and admin routes
router.patch(
    '/:id/status',
    restrictTo('garage_owner', 'admin'),
    validate(updateDisputeStatusSchema),
    disputeController.updateDisputeStatus
);

// Admin only routes
router.get(
    '/',
    restrictTo('admin'),
    disputeController.getAllDisputes
);

// Admin routes
router.get(
    '/admin/all',
    restrictTo('admin'),
    disputeController.getAllDisputes
);

router.patch(
    '/:id/admin-intervene',
    restrictTo('admin'),
    disputeController.adminIntervention
);

router.patch(
    '/:id/admin-action',
    restrictTo('admin'),
    disputeController.adminTakeAction
);

router.patch(
    '/:id/priority',
    restrictTo('admin'),
    disputeController.updateDisputePriority
);

export default router;
