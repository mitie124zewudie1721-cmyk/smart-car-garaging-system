// src/middlewares/rateLimitMiddleware.js
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Rate limiting middleware collection
 * Protects against brute-force, DDoS, and API abuse using express-rate-limit
 * All limiters respect X-Forwarded-For header (proxies/load balancers)
 */

/**
 * Get client IP (handles proxies, Cloudflare, IPv6)
 * @param {Request} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIp = (req) => {
    return (
        req.headers['cf-connecting-ip'] ||           // Cloudflare
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Proxy/load balancer
        req.headers['x-real-ip'] ||                  // Nginx reverse proxy
        req.socket.remoteAddress ||                  // Direct connection
        req.connection.remoteAddress ||
        'unknown'
    );
};

/**
 * General API rate limiter
 * Suitable for most protected routes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                 // 300 requests per IP per window
    standardHeaders: true,    // Return rate limit info in headers (X-RateLimit-*)
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    keyGenerator: getClientIp,
    skip: (req) => {
        // Skip in development or localhost
        return (
            process.env.NODE_ENV === 'development' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.ip === '::ffff:127.0.0.1'
        );
    },
    handler: (req, res, next, options) => {
        logger.warn('API rate limit exceeded', {
            ip: getClientIp(req),
            url: req.originalUrl,
            method: req.method,
            limit: options.max,
            windowMs: options.windowMs / 1000 / 60 + ' minutes',
            requestId: req.requestId || 'none',
        });
        res.status(options.statusCode || 429).json(options.message);
    },
});

/**
 * Strict limiter for authentication endpoints
 * (login, register, refresh token, forgot password, etc.)
 * Protects against brute-force credential stuffing
 */
export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,                  // only 10 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login/register attempts. Please try again after 10 minutes.',
    },
    keyGenerator: getClientIp,
    skip: (req) => {
        return (
            process.env.NODE_ENV === 'development' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.ip === '::ffff:127.0.0.1'
        );
    },
    handler: (req, res, next, options) => {
        logger.warn('Authentication rate limit exceeded', {
            ip: getClientIp(req),
            url: req.originalUrl,
            method: req.method,
            attempts: options.max,
            windowMs: options.windowMs / 1000 / 60 + ' minutes',
            requestId: req.requestId || 'none',
        });
        res.status(options.statusCode || 429).json(options.message);
    },
});

/**
 * Very strict limiter for high-risk / sensitive actions
 * (e.g. password reset, delete account, admin delete user, etc.)
 */
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,                   // only 5 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts. This action is temporarily restricted. Try again in 1 hour.',
    },
    keyGenerator: getClientIp,
    skip: (req) => {
        return (
            process.env.NODE_ENV === 'development' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.ip === '::ffff:127.0.0.1'
        );
    },
    handler: (req, res, next, options) => {
        logger.error('Strict rate limit exceeded – potential abuse', {
            ip: getClientIp(req),
            url: req.originalUrl,
            method: req.method,
            limit: options.max,
            windowMs: options.windowMs / 1000 / 60 + ' minutes',
            requestId: req.requestId || 'none',
        });
        res.status(options.statusCode || 429).json(options.message);
    },
});

// Export as default object (consistent with your other middleware files)
export default {
    apiLimiter,
    authLimiter,
    strictLimiter,
};