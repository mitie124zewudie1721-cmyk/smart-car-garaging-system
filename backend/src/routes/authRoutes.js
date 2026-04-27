// src/routes/authRoutes.js
console.log('✅ authRoutes.js LOADED successfully');
import express from 'express';
import { z } from 'zod';
import {
    register,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const usernameSchema = z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]+$/, 'Must start with a letter. Letters, numbers and underscores only')
    .trim()
    .toLowerCase();

const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character (!@#$%...)')
    .trim();

const nameSchema = z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\u00C0-\u024F\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes')
    .trim();

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    name: nameSchema.optional(),
    username: usernameSchema,
    password: passwordSchema,
    phone: z.string().regex(/^\+251[79]\d{8}$/, 'Use format: +251912345678 (13 digits)').trim().optional().or(z.literal('')),
    email: z.string().email('Invalid email').trim().optional().or(z.literal('')),
    carType: z.string().trim().optional(),
    role: z.enum(['car_owner', 'garage_owner', 'admin']).optional().default('car_owner'),
});

// ────────────────────────────────────────────────
// Public routes (rate-limited to prevent abuse)
// ────────────────────────────────────────────────
router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    register
);

router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    login
);

// ────────────────────────────────────────────────
// Protected routes (require valid JWT)
// ────────────────────────────────────────────────
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Optional: add profile route (since frontend calls it and it was 404)
router.get('/profile', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

export default router;