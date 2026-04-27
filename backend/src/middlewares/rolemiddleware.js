// src/middlewares/roleMiddleware.js
import logger from '../utils/logger.js';

/**
 * Role-based access control middleware
 * Restricts access to routes based on user role(s)
 *
 * Usage:
 *   router.get('/admin', protect, restrictTo('admin'), adminController.dashboard);
 *   router.put('/garage/:id', protect, restrictTo('garage_owner', 'admin'), garageController.update);
 *
 * @param {...string} allowedRoles - One or more allowed roles
 * @returns {Function} Express middleware
 */
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // Safety check: protect middleware should have set req.user
        if (!req.user || !req.user.role) {
            logger.warn('Role check failed - no user or role', {
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return res.status(403).json({
                success: false,
                message: 'Forbidden - authentication required',
            });
        }

        const userRole = req.user.role;

        // Check if user's role is in allowed list
        if (!allowedRoles.includes(userRole)) {
            logger.warn('Unauthorized role access attempt', {
                userId: req.user.id,
                role: userRole,
                requiredRoles: allowedRoles,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });

            // Do NOT leak allowed roles in production message
            return res.status(403).json({
                success: false,
                message: 'Forbidden - insufficient permissions',
            });
        }

        // User is authorized → proceed
        next();
    };
};

/**
 * Strict version with more detailed logging (useful for security monitoring)
 * Same behavior as restrictTo but logs more info on failure
 */
export const restrictToStrict = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            logger.warn('Strict role check failed - no user or role', {
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return res.status(403).json({
                success: false,
                message: 'Forbidden - authentication required',
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            logger.warn('Strict unauthorized role access attempt', {
                userId: req.user.id,
                role: userRole,
                requiredRoles: allowedRoles,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                timestamp: new Date().toISOString(),
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
 * Quick helper middleware: only allow admins
 * Useful for admin-only routes
 */
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        logger.warn('Admin-only access attempt blocked', {
            userId: req.user?.id || 'unauthenticated',
            role: req.user?.role || 'none',
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        return res.status(403).json({
            success: false,
            message: 'Forbidden - admin access required',
        });
    }

    next();
};

// Export as named exports + default object
export { restrictTo, restrictToStrict, isAdmin };

export default {
    restrictTo,
    restrictToStrict,
    isAdmin,
};