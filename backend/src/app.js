// src/app.js – Express app configuration (middleware + routes)
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import mongoose from 'mongoose';
import path from 'path';
import { apiLimiter, authLimiter, strictLimiter } from './middlewares/rateLimitMiddleware.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import garageRoutes from './routes/garageRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
console.log('🔄 Payment routes imported in app.js');
import feedbackRoutes from './routes/feedbackRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import seedVehicles from './routes/seedVehicles.js';
import seedAdmin from './routes/seedAdmin.js';
import seedAnalytics from './routes/seedAnalytics.js';
import seedFeedback from './routes/seedFeedback.js';
import resetPassword from './routes/resetPassword.js';
import adminRoutes from './routes/adminRoutes.js';

// Create Express app
const app = express();

// ── 1. Trust proxy (for rate limiting behind nginx/load balancer) ──
app.set('trust proxy', 1);

// ── 2. Compression ──
app.use(compression());

// ── 3. Helmet — HTTP security headers ──
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP in dev — enable in production with proper nonces
    hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ── 4. CORS ──
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://10.140.183.11:5173',
        'http://10.140.186.147:5173',
        'http://10.140.162.65:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
}));

// ── 5. Body parsing with size limits ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 6. NoSQL injection prevention ──
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        logger.warn(`NoSQL injection attempt blocked`, { ip: req.ip, key, url: req.originalUrl });
    },
}));

// ── 7. XSS prevention ──
app.use(xss());

// ── 8. Global API rate limiting ──
app.use('/api/', apiLimiter);

// ── 9. Request ID for tracing ──
app.use((req, _res, next) => {
    req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    next();
});

// ── 10. Security logging ──
app.use((req, _res, next) => {
    const suspicious = [
        /(\.\.|\/etc\/|\/proc\/)/i,           // path traversal
        /(union.*select|drop.*table|insert.*into)/i, // SQL injection
        /(<script|javascript:|on\w+=)/i,       // XSS
        /(\$where|\$regex|\$gt|\$lt)/i,        // NoSQL injection
    ];
    const url = req.originalUrl + JSON.stringify(req.body || {});
    if (suspicious.some(p => p.test(url))) {
        logger.warn('Suspicious request detected', {
            ip: req.ip, url: req.originalUrl, method: req.method,
            body: JSON.stringify(req.body).slice(0, 200),
        });
    }
    next();
});

// Serve uploaded files (vehicle images, etc.)
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

// Also serve from backend/uploads (for commission receipts etc.)
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(process.cwd(), 'backend/uploads')));

// Vehicle image endpoint CORP fix
app.use('/api/vehicles', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dev', seedRoutes); // Development only - remove in production
app.use('/api/dev', seedVehicles); // Development only
app.use('/api/dev', seedAdmin); // Development only
app.use('/api/dev', seedAnalytics); // Development only
app.use('/api/dev', seedFeedback); // Development only
app.use('/api/dev', resetPassword); // Development only

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend is running',
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl}`,
    });
});

// ── 404 handler ──
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler — never leak stack traces in production ──
app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    logger.error('Global error', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        requestId: req.requestId,
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: isProd ? undefined : Object.values(err.errors).map(e => e.message),
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({ success: false, message: `${field} already exists` });
    }

    res.status(status).json({
        success: false,
        message: isProd ? 'Server error – please try again later.' : err.message,
        ...(isProd ? {} : { stack: err.stack }),
    });
});

export default app;