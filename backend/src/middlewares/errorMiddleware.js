// src/middlewares/errorMiddleware.js
import logger from '../utils/logger.js';
import { ZodError } from 'zod';

/**
 * Global error handler middleware
 * MUST be the LAST middleware in app.use()
 * Catches all errors from routes/controllers and formats consistent JSON response
 *
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // ────────────────────────────────────────────────
    // Handle common error types with better messages
    // ────────────────────────────────────────────────
    if (err instanceof ZodError) {
        // Zod validation error (from validate middleware)
        statusCode = 400;
        const errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
        }));
        message = 'Validation failed - check your input';
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    if (err.name === 'ValidationError') {
        // Mongoose schema validation
        statusCode = 400;
        const errors = Object.values(err.errors).map((e) => e.message);
        message = errors.length > 0 ? errors.join('; ') : 'Validation failed';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ID format: ${err.value}`;
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token signature';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate entry - value already exists';
    } else if (err.name === 'MongoNotConnectedError' || err.name === 'MongoNetworkError') {
        statusCode = 503;
        message = 'Database connection issue - try again later';
    } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON in request body';
    }

    // ────────────────────────────────────────────────
    // Prepare log data
    // ────────────────────────────────────────────────
    const logData = {
        statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userId: req.user?._id || req.user?.id || 'anonymous',
        requestId: req.requestId || 'none', // if you have request-id middleware
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.code,
        stack: err.stack,
        body: req.body ? JSON.stringify(req.body, null, 2).slice(0, 1000) : null, // truncate large bodies
        params: req.params,
        query: req.query,
    };

    // Log at appropriate level
    if (statusCode >= 500) {
        logger.error(`${message} [${statusCode}]`, logData);
    } else if (statusCode >= 400) {
        logger.warn(`${message} [${statusCode}]`, logData);
    } else {
        logger.info(`Handled error: ${message} [${statusCode}]`, logData);
    }

    // ────────────────────────────────────────────────
    // Prepare response (hide details in production)
    // ────────────────────────────────────────────────
    const response = {
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again later.'
            : message,
    };

    // Development-only details
    if (process.env.NODE_ENV !== 'production') {
        response.error = err.message;
        response.stack = err.stack?.split('\n').slice(0, 10).join('\n'); // limit stack trace
        response.details = err.details || null;
    }

    // Send response
    res.status(statusCode).json(response);
};

export default errorHandler;