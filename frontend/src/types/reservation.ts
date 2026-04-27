// src/types/reservation.ts

/**
 * Core reservation document shape (from MongoDB backend)
 */
export interface Reservation {
    /** MongoDB ObjectId as string */
    _id: string;
    /** User who made the reservation (User._id) */
    user: string;
    /** Garage being reserved (Garage._id) */
    garage: string;
    /** Vehicle used for reservation (Vehicle._id) */
    vehicle: string;
    /** Start time (ISO string) */
    startTime: string;
    /** End time (ISO string) */
    endTime: string;
    /** Current reservation status */
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    /** Total price in ETB */
    totalPrice: number;
    /** Optional additional notes from user */
    notes?: string;
    /** Creation timestamp (ISO string) */
    createdAt: string;
    /** Last update timestamp (ISO string) */
    updatedAt: string;
}

/**
 * Reservation with populated/denormalized fields (for frontend display)
 */
export interface ReservationWithDetails extends Reservation {
    /** Garage name (populated) */
    garageName: string;
    /** Garage address (populated) */
    garageAddress: string;
    /** Vehicle display name (populated) */
    vehicleName: string;
    /** Vehicle plate number (populated) */
    vehiclePlate: string;
}

/**
 * Input shape when creating a new reservation
 */
export interface CreateReservationInput {
    garageId: string;
    vehicleId: string;
    startTime: string;
    endTime: string;
    notes?: string;
}

/**
 * Input shape when updating an existing reservation
 * (only status and notes are typically updatable by user)
 */
export interface UpdateReservationInput {
    status?: 'confirmed' | 'cancelled'; // admin can confirm, user can cancel
    notes?: string;
}