// src/types/api.ts

/**
 * Standard API success response wrapper
 * Used for most successful GET/POST/PUT/DELETE endpoints
 */
export interface ApiResponse<T = unknown> {
    /** Whether the request was successful */
    success: boolean;
    /** The main payload (optional on some endpoints) */
    data?: T;
    /** Human-readable success or info message */
    message?: string;
    /** Total count (useful for lists) */
    count?: number;
    /** Pagination metadata (for paginated endpoints) */
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    /** Optional extra metadata (e.g. timestamp, version) */
    meta?: Record<string, unknown>;
}

/**
 * Standardized error shape returned from backend
 * Use this for Axios error.response?.data
 */
export interface ApiError {
    /** HTTP status code (from axios error.response.status) */
    status?: number;
    /** The error payload */
    response?: {
        status: number;
        data: {
            success: false;
            message: string;
            /** Field-specific validation errors (e.g. { username: "already taken" }) */
            errors?: Record<string, string>;
        };
    };
    /** Fallback error message */
    message: string;
}

/**
 * Paginated list response (for endpoints like /users, /garages, /reservations)
 */
export interface PaginatedResponse<T> {
    /** The list of items */
    data: T[];
    /** Pagination metadata */
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    /** Optional summary stats (e.g. total revenue, average rating) */
    summary?: Record<string, unknown>;
}

/**
 * Common union for API responses that may be paginated or single
 */
export type ApiResult<T> = ApiResponse<T> | PaginatedResponse<T>;