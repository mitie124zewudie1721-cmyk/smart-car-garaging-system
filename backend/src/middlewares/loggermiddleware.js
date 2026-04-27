// src/middlewares/loggerMiddleware.js
import logger from '../utils/logger.js';

/**
 * Request logger middleware
 * Logs every incoming request with method, URL, status code, duration, IP, user-agent, user ID (if authenticated), and more.
 * Logs after response is sent ('finish' event) or on error.
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Get real client IP (handles proxies, Cloudflare, load balancers)
    const clientIp =
        req.headers['cf-connecting-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';

    // Hook into response 'finish' event (normal response)
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: clientIp,
            userAgent: req.get('user-agent') || 'unknown',
            userId: req.user ? req.user.id : 'anonymous',
            requestId: req.requestId || 'none', // if you have request-id middleware
            contentLength: res.get('content-length') || 'unknown',
        };

        const msg = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        if (res.statusCode >= 500) {
            logger.error(msg, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(msg, logData);
        } else {
            logger.info(msg, logData);
        }
    });

    // Catch early errors (before response is sent)
    res.on('error', (err) => {
        const duration = Date.now() - start;
        logger.error('Response error before finish', {
            error: err.message,
            stack: err.stack,
            duration: `${duration}ms`,
            ip: clientIp,
            userId: req.user ? req.user.id : 'anonymous',
            requestId: req.requestId || 'none',
        });
    });

    next();
};

/**
 * Error logger middleware (place after all routes, before default error handler)
 * Logs unhandled errors with full stack trace and context
 */
export const errorLogger = (err, req, res, next) => {
    const clientIp =
        req.headers['cf-connecting-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.ip ||
        'unknown';

    logger.error(`Unhandled error: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        status: res.statusCode || 500,
        ip: clientIp,
        userId: req.user ? req.user.id : 'anonymous',
        requestId: req.requestId || 'none',
        body: req.body ? JSON.stringify(req.body, null, 2) : undefined,
    });

    next(err); // pass to final error handler
};

export default requestLogger;