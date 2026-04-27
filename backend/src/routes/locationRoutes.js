// src/routes/locationRoutes.js
import express from 'express';
import { z } from 'zod';

import locationController from '../controllers/locationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const nearbyGaragesSchema = {
    query: z.object({
        lat: z.coerce.number().min(-90).max(90, 'Invalid latitude'),
        lng: z.coerce.number().min(-180).max(180, 'Invalid longitude'),
        radius: z.coerce.number().min(1).max(50).default(10),
        vehicleType: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
    }),
};

const updateLocationSchema = {
    params: z.object({
        reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
    }),
    body: z.object({
        lat: z.number().min(-90).max(90, 'Invalid latitude'),
        lng: z.number().min(-180).max(180, 'Invalid longitude'),
        accuracy: z.number().positive().optional(),
    }),
};

const trackingHistorySchema = {
    params: z.object({
        reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID'),
    }),
    query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    }).optional(),
};

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// All location routes require authentication
router.use(protect);

// Find nearby garages (public-ish, but protected for safety)
router.get(
    '/nearby',
    validate(nearbyGaragesSchema),
    locationController.findNearbyGarages
);

// Update current location during active reservation
router.put(
    '/reservation/:reservationId',
    validate(updateLocationSchema),
    locationController.updateReservationLocation
);

// Get location tracking history for a reservation
router.get(
    '/reservation/:reservationId',
    validate(trackingHistorySchema),
    locationController.getReservationTracking
);

export default router;