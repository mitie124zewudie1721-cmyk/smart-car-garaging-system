// src/lib/validators.ts
import { z } from 'zod';

// ── Name: letters and spaces only, no numbers ──
export const nameSchema = z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name is too long' })
    .regex(/^[a-zA-Z\u00C0-\u024F\s'-]+$/, {
        message: 'Name can only contain letters, spaces, hyphens and apostrophes',
    })
    .trim();

// ── Username: letters, numbers, underscores only ──
export const usernameSchema = z
    .string()
    .min(3, { message: 'At least 3 characters required' })
    .max(30, { message: 'Max 30 characters' })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]+$/, {
        message: 'Must start with a letter. Letters, numbers and underscores only',
    })
    .trim();

// ── Password: strong — must have uppercase, lowercase, number, special char ──
export const passwordSchema = z
    .string()
    .min(8, { message: 'At least 8 characters required' })
    .max(128, { message: 'Password too long' })
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter (A-Z)' })
    .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter (a-z)' })
    .regex(/[0-9]/, { message: 'Must contain at least one number (0-9)' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must contain at least one special character (!@#$%...)' });

// ── Phone: Ethiopian format — exactly +251 + 9 digits ──
export const phoneSchema = z
    .string()
    .regex(/^\+251[79]\d{8}$/, {
        message: 'Use format: +251XXXXXXXXX (13 digits, starts with +2517 or +2519)',
    })
    .optional()
    .or(z.literal(''));

// ── Role ──
export const roleSchema = z.enum(['car_owner', 'garage_owner'] as const, {
    error: 'Please select your account type',
});

// ── Login ──
export const loginSchema = z.object({
    username: z.string().min(1, { message: 'Username is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

// ── Register ──
export const registerSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
    role: roleSchema,
    phone: phoneSchema,
    email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// ── Garage ──
export const garageSchema = z.object({
    name: z.string().min(3, 'Garage name must be at least 3 characters').max(100),
    address: z.string().min(5, 'Address is required').max(200),
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    pricePerHour: z.number().min(0, 'Price cannot be negative').max(10000),
    description: z.string().max(1000, 'Description is too long').optional(),
    amenities: z.array(z.string()).optional(),
    location: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

// ── Reservation ──
export const reservationSchema = z
    .object({
        garageId: z.string().min(1, 'Garage is required'),
        vehicleId: z.string().min(1, 'Vehicle is required'),
        startTime: z.string().min(1, 'Start time is required'),
        endTime: z.string().min(1, 'End time is required'),
        notes: z.string().max(500, 'Notes too long').optional(),
    })
    .refine(data => new Date(data.startTime) < new Date(data.endTime), {
        message: 'End time must be after start time',
        path: ['endTime'],
    })
    .refine(data => new Date(data.startTime) > new Date(), {
        message: 'Start time must be in the future',
        path: ['startTime'],
    });

// ── Vehicle ──
export const vehicleSchema = z.object({
    make: z.string().min(2, 'Make is required').max(50)
        .regex(/^[a-zA-Z\s-]+$/, { message: 'Make should contain letters only' }),
    model: z.string().min(1, 'Model is required').max(50),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    plateNumber: z.string().min(5, 'Plate number is required').max(20)
        .regex(/^[A-Z0-9\s-]+$/i, { message: 'Invalid plate number format' }),
    color: z.string().max(30).optional(),
    type: z.enum(['sedan', 'suv', 'hatchback', 'truck', 'other']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GarageInput = z.infer<typeof garageSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
