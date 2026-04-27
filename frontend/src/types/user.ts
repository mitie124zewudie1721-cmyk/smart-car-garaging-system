// src/types/user.ts

/**
 * Core user shape returned from backend (after login/register/profile)
 */
export interface User {
    /** User identifier (backend sends "id", not "_id") */
    id: string;
    /** Full name */
    name: string;
    /** Unique username/login handle */
    username: string;
    /** Role determines permissions and dashboard redirect */
    role: 'car_owner' | 'garage_owner' | 'admin';
    /** Optional phone number (Ethiopian format usually +2519XXXXXXXX) */
    phone?: string | null;
    /** Optional vehicle type (for car_owner role) */
    carType?: string | null;
    /** Optional profile picture URL */
    profilePicture?: string | null;
    /** Account active status (can be false for banned/deactivated) */
    isActive?: boolean;
    /** Last successful login timestamp (ISO string) */
    lastLogin?: string;
    /** Account creation timestamp (ISO string) */
    createdAt: string;
}

/** Union type for role checks (use with type guards) */
export type UserRole = User['role'];

/**
 * Authenticated user shape (includes token for client-side usage)
 */
export interface AuthUser extends User {
    /** JWT access token (short-lived) */
    token: string;
}

/**
 * Standard login response shape (access + refresh token + user)
 */
export interface LoginResponse {
    success: boolean;
    message?: string;
    data: {
        accessToken: string;
        refreshToken: string;
        user: User;
    };
}

/**
 * Standard registration response shape (same as login)
 */
export interface RegisterResponse {
    success: boolean;
    message?: string;
    data: {
        accessToken: string;
        refreshToken: string;
        user: User;
    };
}