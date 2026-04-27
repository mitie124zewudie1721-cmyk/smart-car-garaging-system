// src/utils/validators.js
import { z } from 'zod';

// ───────────────────────────────────────────────
// 1. User Registration Schema
// ───────────────────────────────────────────────
export const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .trim(),

    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens')
        .trim()
        .toLowerCase(),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .trim(),

    confirmPassword: z.string(),

    phone: z.string()
        .optional()
        .refine(
            (val) => !val || /^[+]?[0-9]{8,15}$/.test(val.replace(/\s/g, '')),
            { message: 'Invalid phone number format (use international format, e.g. +251912345678)' }
        )
        .transform((val) => val?.replace(/\s/g, '') || undefined),

    carType: z.string()
        .optional()
        .max(50, 'Car type is too long')
        .trim(),

    role: z.enum(['car_owner', 'garage_owner', 'admin'], {
        required_error: 'Role is required',
        invalid_type_error: 'Invalid role selected',
    }).default('car_owner'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

// ───────────────────────────────────────────────
// 2. User Login Schema
// ───────────────────────────────────────────────
export const loginSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .trim()
        .toLowerCase(),

    password: z.string()
        .min(1, 'Password is required')
        .trim(),
});

// ───────────────────────────────────────────────
// 3. Optional: Refresh Token Schema
// ───────────────────────────────────────────────
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ───────────────────────────────────────────────
// Helper: Validate and sanitize data
// Usage: const result = validate(registerSchema, req.body);
// ───────────────────────────────────────────────
export const validate = (schema, data) => {
    try {
        return schema.parse(data);
    } catch (error) {
        throw new Error(
            error.errors
                .map((err) => `${err.path.join('.')}: ${err.message}`)
                .join('; ')
        );
    }
};

// ───────────────────────────────────────────────
// Example usage in controller:
// ───────────────────────────────────────────────
// try {
//   const validated = validate(registerSchema, req.body);
//   // proceed with validated data
// } catch (err) {
//   return res.status(400).json({ success: false, message: err.message });
// }