// src/routes/garageRoutes.js – FIXED & IMPROVED
console.log('✅ garageRoutes.js LOADED successfully');

import express from 'express';
import { z } from 'zod';
import garageController from '../controllers/garageController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { uploadLicense, handleUploadError } from '../middlewares/uploadMiddleware.js';
import Garage from '../models/Garage.js';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const createGarageSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long').trim(),
        location: z.object({
            type: z.literal('Point').optional().default('Point'),
            coordinates: z.tuple([
                z.number().min(-180).max(180), // longitude
                z.number().min(-90).max(90),   // latitude
            ], { invalid_type_error: 'Coordinates must be [lng, lat]' }),
            address: z.string().max(200, 'Address too long').trim().optional(),
        }).required({ message: 'Location is required' }),
        amenities: z.array(z.string().min(1).max(50)).optional(),
        capacity: z.number().int('Capacity must be integer').min(1, 'Capacity ≥ 1'),
        pricePerHour: z.number().min(0, 'Price cannot be negative'),
        operatingHours: z.object({
            start: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time (HH:mm)').optional(),
            end: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time (HH:mm)').optional(),
        }).optional(),
        description: z.string().max(1000, 'Description too long').trim().optional(),
        images: z.array(z.string().url('Invalid image URL')).max(10, 'Max 10 images').optional(),
        commissionRate: z.number().min(0, 'Commission rate cannot be negative').optional(),
        commissionRate: z.number().min(0, 'Commission rate cannot be negative').optional(),
    }),
});

const updateGarageSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid garage ID'),
    }),
    body: createGarageSchema.shape.body.partial().refine(
        (data) => Object.keys(data).length > 0,
        { message: 'At least one field must be provided for update' }
    ),
});

const searchGarageSchema = z.object({
    body: z.object({
        lat: z.number().min(-90).max(90, 'Invalid latitude'),
        lng: z.number().min(-180).max(180, 'Invalid longitude'),
        radius: z.number().min(1).max(50).default(10),
        vehicleType: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)').optional(),
        time: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time (HH:mm)').optional(),
        amenities: z.union([z.string(), z.array(z.string())])
            .transform(val => Array.isArray(val) ? val : [val])
            .optional(),
    }).refine(
        (data) => data.lat && data.lng,
        { message: 'Latitude and longitude are required', path: ['lat', 'lng'] }
    ),
});

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// Public route – search nearby garages (POST is safer for complex filters)
router.post(
    '/search',
    validate(searchGarageSchema),
    garageController.searchGarages
);

// Public stats – no auth required
router.get('/public-stats', async (req, res) => {
    try {
        const [garages, drivers, reservations] = await Promise.all([
            Garage.countDocuments({ verificationStatus: 'approved', deletedAt: null }),
            User.countDocuments({ deletedAt: null, role: { $ne: 'admin' } }),
            Reservation.countDocuments(),
        ]);
        res.json({ success: true, data: { garages, drivers, reservations } });
    } catch {
        res.json({ success: true, data: { garages: 0, drivers: 0, reservations: 0 } });
    }
});

// All following routes require authentication
router.use(protect);

// ── Specific routes MUST come before parameterized routes ──

// Admin route to get all garages (must be before /:id)
router.get(
    '/',
    restrictTo('admin'),
    garageController.getAllGarages
);

// Garage owner routes
router.post(
    '/',
    restrictTo('garage_owner'),
    uploadLicense,
    handleUploadError,
    garageController.registerGarage
);

router.get(
    '/my',
    restrictTo('garage_owner'),
    garageController.getMyGarages
);

router.get(
    '/my/analytics',
    restrictTo('garage_owner'),
    garageController.getMyGarageAnalytics
);

// ── Parameterized routes come LAST ──
router.get(
    '/:id',
    restrictTo('garage_owner', 'admin', 'car_owner'),
    garageController.getGarageById
);

router.put(
    '/:id',
    restrictTo('garage_owner'),
    uploadLicense,
    handleUploadError,
    garageController.updateGarage
);

router.delete(
    '/:id',
    restrictTo('garage_owner'),
    garageController.deleteGarage
);

export default router;