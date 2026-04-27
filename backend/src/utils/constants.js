// src/utils/constants.js
/**
 * Application-wide constants used across controllers, services, models, etc.
 * Central place to manage enums, statuses, roles, messages, etc.
 */

module.exports = {
    // User roles (must match User model enum)
    ROLES: {
        CAR_OWNER: 'car_owner',
        GARAGE_OWNER: 'garage_owner',
        ADMIN: 'admin',
    },

    // Reservation statuses
    RESERVATION_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'no_show',
    },

    // Payment statuses & methods
    PAYMENT_STATUS: {
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
        REFUNDED: 'refunded',
    },

    PAYMENT_METHODS: {
        CHAPA: 'chapa',
        TELEBIRR: 'telebirr',
        MOBILE_MONEY: 'mobile_money',
        BANK_TRANSFER: 'bank_transfer',
        CASH: 'cash',
    },

    // Vehicle size categories (used in matching algorithm)
    VEHICLE_SIZE: {
        SMALL: 'small',
        MEDIUM: 'medium',
        LARGE: 'large',
        EXTRA_LARGE: 'extra_large',
    },

    // Common amenities (should match Garage model enum)
    AMENITIES: [
        'covered',
        'secure',
        '24h',
        'washing',
        'repair',
        'electric_charge',
        'air_pump',
        'cctv',
        'valet',
    ],

    // HTTP status codes (for consistent responses)
    STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_ERROR: 500,
    },

    // JWT token durations
    TOKEN: {
        ACCESS: '1h',
        REFRESH: '7d',
    },

    // Default pagination values
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 50,
    },

    // Ethiopian timezone (for date handling)
    TIMEZONE: 'Africa/Addis_Ababa',

    // Error messages (centralized for consistency)
    MESSAGES: {
        UNAUTHORIZED: 'Not authorized - please login',
        FORBIDDEN: 'You do not have permission to perform this action',
        NOT_FOUND: (resource) => `${resource} not found`,
        VALIDATION_FAILED: 'Validation failed - check your input',
        SERVER_ERROR: 'Something went wrong on our end - please try again later',
    },
};