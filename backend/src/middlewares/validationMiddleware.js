// src/middlewares/validationMiddleware.js
import { z } from 'zod';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory using Zod
 * Validates request body, params, query, or all of them.
 * Returns 400 with structured errors on failure.
 *
 * @param {Object} schema - { body?: z.ZodSchema, params?: z.ZodSchema, query?: z.ZodSchema }
 * @param {Object} [options] - optional config
 * @param {Function} [options.skip] - function(req): boolean - skip validation (e.g. health check)
 * @param {boolean} [options.stripUnknown=true] - remove unknown fields from body/query/params
 * @returns {Function} Express middleware
 */
export const validate = (schema, options = {}) => async (req, res, next) => {
    const { skip, stripUnknown = true } = options;

    // Optional skip logic (e.g. for /health or public routes)
    if (skip && skip(req)) {
        return next();
    }

    try {
        // Validate body
        if (schema.body) {
            const bodySchema = stripUnknown ? schema.body : schema.body.passthrough();
            req.body = await bodySchema.parseAsync(req.body);
        }

        // Validate params
        if (schema.params) {
            req.params = await schema.params.parseAsync(req.params);
        }

        // Validate query
        if (schema.query) {
            const querySchema = stripUnknown ? schema.query : schema.query.passthrough();
            req.query = await querySchema.parseAsync(req.query);
        }

        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            // Format errors for frontend (field + message + code + path)
            const errors = err.errors.map((e) => ({
                field: e.path.join('.'),
                path: e.path,
                message: e.message,
                code: e.code,
            }));

            logger.warn('Request validation failed', {
                method: req.method,
                url: req.originalUrl,
                requestId: req.requestId || 'none', // if you have request-id middleware
                body: req.body ? JSON.stringify(req.body, null, 2) : undefined,
                query: req.query ? JSON.stringify(req.query, null, 2) : undefined,
                errors,
            });

            return res.status(400).json({
                success: false,
                message: 'Validation failed - please check your input',
                errors,
            });
        }

        // Non-Zod error (e.g. JSON parse error, unexpected crash)
        logger.error('Validation middleware crash', {
            method: req.method,
            url: req.originalUrl,
            requestId: req.requestId || 'none',
            error: err.message,
            stack: err.stack,
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error during validation',
        });
    }
};