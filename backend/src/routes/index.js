// src/routes/index.js
import express from 'express';
const router = express.Router();

// Import all sub-routes (use .js extension for ESM)
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import garageRoutes from './garageRoutes.js';
import reservationRoutes from './reservationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import locationRoutes from './locationRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';

// Mount all sub-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/garages', garageRoutes);
router.use('/reservations', reservationRoutes);
router.use('/payments', paymentRoutes);
router.use('/locations', locationRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

// Optional: API-wide health-check (very useful for monitoring)
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Optional: global API prefix info or version endpoint
router.get('/', (req, res) => {
    res.json({
        api: 'Smart Garaging API',
        version: '1.0.0',
        endpoints: [
            '/auth/register',
            '/auth/login',
            '/users',
            '/garages',
            // ... add more if you want
        ],
    });
});

export default router;