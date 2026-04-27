// src/utils/helpers.js
const logger = require('./logger');
const { STATUS, MESSAGES } = require('./constants');
const crypto = require('crypto');

/**
 * Format error response consistently
 */
function errorResponse(res, statusCode = STATUS.INTERNAL_ERROR, message = MESSAGES.SERVER_ERROR, details = null) {
    const response = {
        success: false,
        message,
    };

    if (details && process.env.NODE_ENV !== 'production') {
        response.details = details;
    }

    logger.error(message, { statusCode, stack: new Error().stack });
    return res.status(statusCode).json(response);
}

/**
 * Success response helper
 */
function successResponse(res, statusCode = STATUS.OK, message = 'Success', data = null) {
    const response = {
        success: true,
        message,
    };

    if (data) response.data = data;
    return res.status(statusCode).json(response);
}

/**
 * Generate a unique receipt/invoice number
 * Example: SCR-20260213-ABC123
 */
function generateReceiptNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SCR-${date}-${random}`;
}

/**
 * Format Ethiopian Birr with comma separator
 * Example: 12,345.67 ETB
 */
function formatBirr(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Sleep helper (for testing or rate limiting)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    errorResponse,
    successResponse,
    generateReceiptNumber,
    formatBirr,
    sleep,
};