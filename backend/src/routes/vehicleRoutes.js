// src/routes/vehicleRoutes.js
import express from 'express';
import { z } from 'zod';
import Vehicle from '../models/Vehicle.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ── Public image endpoint (BEFORE protect middleware) ──
// img tags can't send auth headers, so this must be unauthenticated
router.get('/:id/image', async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle || !vehicle.image?.data) {
            return res.status(404).json({ success: false, message: 'Vehicle image not found' });
        }

        const buffer = Buffer.from(vehicle.image.data, 'base64');
        res.set({
            'Content-Type': vehicle.image.mimeType,
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=31536000',
            'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        res.send(buffer);
    } catch (error) {
        console.error('Get vehicle image failed:', error);
        next(error);
    }
});

// All routes below require authentication
router.use(protect);

// Get all vehicles for the current user — MUST be before /:id routes
router.get('/my', async (req, res, next) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles,
        });
    } catch (error) {
        console.error('Get my vehicles failed:', error);
        next(error);
    }
});

// Get vehicle image (public-ish route — still needs auth since router.use(protect) is above)
// NOTE: moved above protect middleware — see top of file

// ──────────────────────────────────────────────
// Vehicle image upload (multipart/form-data)
// ──────────────────────────────────────────────

const vehicleImageStorage = multer.memoryStorage();

const vehicleImageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'image/avif', 'image/gif', 'image/bmp', 'image/tiff',
    ];
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.webp',
        '.avif', '.gif', '.bmp', '.tiff', '.tif',
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, WEBP, AVIF, GIF, and BMP images are accepted'), false);
    }
};

const uploadVehicleImage = multer({
    storage: vehicleImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,
    },
    fileFilter: vehicleImageFileFilter,
}).single('image');

// Upload/replace a vehicle image
router.post('/:id/image', (req, res, next) => {
    uploadVehicleImage(req, res, (err) => {
        if (!err) return next();

        // Multer-specific errors
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'Image size must not exceed 5MB' });
            }
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }

        // Other errors (e.g. fileFilter)
        return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
    });
}, async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });

        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded (field name must be "image")' });
        }

        // Convert buffer to base64
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        vehicle.image = {
            url: `/api/vehicles/${vehicle._id}/image`,
            data: base64,
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date(),
        };

        await vehicle.save();

        return res.status(200).json({
            success: true,
            message: 'Vehicle image uploaded successfully',
            data: vehicle,
        });
    } catch (error) {
        console.error('Upload vehicle image failed:', error);
        next(error);
    }
});

// Create a new vehicle
const createVehicleSchema = {
    body: z.object({
        plateNumber: z.string().min(3, 'Plate number is required').toUpperCase(),
        make: z.string().min(2, 'Make is required'),
        model: z.string().min(1, 'Model is required'),
        year: z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
        type: z.string().min(1, 'Vehicle type is required'),
        sizeCategory: z.enum(['small', 'medium', 'large', 'extra_large']),
        color: z.string().optional(),
    }),
};

// Update an existing vehicle (all fields optional for partial updates)
const updateVehicleSchema = {
    body: z.object({
        plateNumber: z.string().min(3).toUpperCase().optional(),
        make: z.string().min(2).optional(),
        model: z.string().min(1).optional(),
        year: z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
        type: z.string().min(1).optional(),
        sizeCategory: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
        color: z.string().optional(),
    }),
};

router.post('/', validate(createVehicleSchema), async (req, res, next) => {
    try {
        const vehicleData = {
            ...req.body,
            owner: req.user.id,
        };

        const vehicle = await Vehicle.create(vehicleData);

        return res.status(201).json({
            success: true,
            message: 'Vehicle added successfully',
            data: vehicle,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this plate number already exists',
            });
        }
        console.error('Create vehicle failed:', error);
        next(error);
    }
});

router.put('/:id', validate(updateVehicleSchema), async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found',
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            vehicle[key] = req.body[key];
        });

        await vehicle.save();

        return res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this plate number already exists',
            });
        }
        console.error('Update vehicle failed:', error);
        next(error);
    }
});

// Delete a vehicle
router.delete('/:id', async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found',
            });
        }

        await vehicle.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Vehicle deleted successfully',
        });
    } catch (error) {
        console.error('Delete vehicle failed:', error);
        next(error);
    }
});

export default router;
