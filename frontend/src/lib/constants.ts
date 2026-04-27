// src/lib/constants.ts

// ──────────────────────────────────────────────
// App & Branding
// ──────────────────────────────────────────────

export const APP_NAME = 'Smart Car Garaging System';
export const APP_VERSION = '1.0.0';
export const COMPANY_NAME = 'Smart Garaging';  // ← changed (or delete completely)

// ──────────────────────────────────────────────
// Assets
// ──────────────────────────────────────────────

// Fallback image used when no specific image is available (inline SVG so it always loads)
const PLACEHOLDER_SVG =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>'
    );
export const DEFAULT_AVATAR = PLACEHOLDER_SVG;

// ──────────────────────────────────────────────
// Roles (must match backend enum exactly)
// ──────────────────────────────────────────────

export const ROLES = {
    CAR_OWNER: 'car_owner',
    GARAGE_OWNER: 'garage_owner',
    ADMIN: 'admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ──────────────────────────────────────────────
// API Endpoints (relative to baseURL)
// ──────────────────────────────────────────────

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
        FORGOT_PASSWORD: '/auth/forgot-password',
    },
    USER: {
        PROFILE: '/users/me',
        UPDATE: '/users/me',
    },
    GARAGES: {
        MY: '/garages/my',
        SEARCH: '/garages/search',
        CREATE: '/garages',
        UPDATE: (id: string) => `/garages/${id}`,
        DELETE: (id: string) => `/garages/${id}`,
    },
    RESERVATIONS: {
        MY: '/reservations/my',
        CREATE: '/reservations',
        CANCEL: (id: string) => `/reservations/${id}`,
    },
    VEHICLES: {
        MY: '/vehicles/my',
        CREATE: '/vehicles',
        UPDATE: (id: string) => `/vehicles/${id}`,
        DELETE: (id: string) => `/vehicles/${id}`,
    },
    ADMIN: {
        USERS: '/admin/users',
        ANALYTICS_USERS: '/analytics/users',
        ANALYTICS_RESERVATIONS: '/analytics/reservations',
        ANALYTICS_REVENUE: '/analytics/revenue',
    },
} as const;

// ──────────────────────────────────────────────
// Amenities (used in garage forms/filters)
// ──────────────────────────────────────────────

export const AMENITIES = [
    'covered',
    'secure',
    '24h',
    'washing',
    'repair',
    'electric_charge',
    'air_pump',
    'cctv',
    'valet',
] as const;

// ──────────────────────────────────────────────
// Date & Time formats (used with date-fns)
// ──────────────────────────────────────────────

export const DATE_FORMAT = 'MMM dd, yyyy';
export const TIME_FORMAT = 'hh:mm a';
export const DATETIME_FORMAT = 'MMM dd, yyyy hh:mm a';

// ──────────────────────────────────────────────
// Currency
// ──────────────────────────────────────────────

export const CURRENCY = 'ETB';
export const CURRENCY_SYMBOL = 'ETB';

// Optional extras (useful for forms/uploads)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;