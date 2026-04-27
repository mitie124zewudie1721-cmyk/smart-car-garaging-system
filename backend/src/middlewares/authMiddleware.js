// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import { config } from '../config/index.js';

/**
 * Protect routes - verifies JWT access token and attaches user to req.user
 * Returns 401 if token invalid, expired, missing, or user not found/deactivated
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!config.JWT_SECRET) {
                logger.error('JWT_SECRET is missing in config');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
            }

            const decoded = jwt.verify(token, config.JWT_SECRET);

            // Find user and exclude password
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                logger.warn(`User not found for token ID: ${decoded.id}`);
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized - user no longer exists',
                });
            }

            // Block soft-deleted (trashed) users
            if (user.deletedAt) {
                return res.status(401).json({ success: false, message: 'Account deleted. Contact admin to restore.' });
            }

            // Optional: check if user is active/banned
            if (!user.isActive) {
                logger.warn(`Inactive user attempted access: ${user._id}`);
                return res.status(403).json({
                    success: false,
                    message: 'Account is inactive - contact support',
                });
            }

            req.user = user;
            next();
        } catch (error) {
            let message = 'Not authorized - invalid token';
            let status = 401;

            switch (error.name) {
                case 'TokenExpiredError':
                    message = 'Not authorized - token expired';
                    break;
                case 'JsonWebTokenError':
                    message = 'Not authorized - invalid token signature';
                    break;
                case 'NotBeforeError':
                    message = 'Not authorized - token not yet valid';
                    break;
                default:
                    message = 'Not authorized - authentication failed';
            }

            logger.warn(`Token verification failed - ${error.name}`, {
                errorMessage: error.message,
                tokenPrefix: token ? token.substring(0, 10) + '...' : 'missing',
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
            });

            return res.status(status).json({ success: false, message });
        }
    } else {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - no token provided',
        });
    }
};

/**
 * Restrict access to specific roles
 * Does NOT leak allowed roles in production response
 *
 * @param {...string} allowedRoles - One or more allowed roles
 */
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            logger.warn('Role check failed - no user or role', {
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return res.status(403).json({
                success: false,
                message: 'Forbidden - insufficient permissions',
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            logger.warn('Unauthorized role access attempt', {
                userId: req.user._id,
                role: userRole,
                requiredRoles: allowedRoles,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });

            return res.status(403).json({
                success: false,
                message: 'Forbidden - insufficient permissions',
            });
        }

        next();
    };
};

/**
 * Check if user account is active
 * Use in protected routes for extra security
 */
export const checkActive = (req, res, next) => {
    if (!req.user || !req.user.isActive) {
        logger.warn(`Inactive account access attempt: ${req.user?._id || 'unknown'}`, {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });
        return res.status(403).json({
            success: false,
            message: 'Account is inactive - contact support',
        });
    }
    next();
};

export default {
    protect,
    restrictTo,
    checkActive,
};