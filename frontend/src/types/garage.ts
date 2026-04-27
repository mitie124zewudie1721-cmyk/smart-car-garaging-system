// src/types/garage.ts

/**
 * Full Garage document shape (from MongoDB backend)
 */
export interface Garage {
    /** MongoDB ObjectId as string */
    _id: string;
    /** Garage display name */
    name: string;
    /** Owner user ID (reference to User._id) */
    owner: string;
    /** Full address string */
    address: string;
    /** GeoJSON Point for location-based search */
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    /** Total parking capacity */
    capacity: number;
    /** Currently available parking slots */
    availableSlots: number;
    /** Hourly parking price in ETB */
    pricePerHour: number;
    /** Optional detailed description */
    description?: string;
    /** List of available amenities (from AMENITIES constant) */
    amenities: string[];
    /** Array of image URLs (S3 or Cloudinary) */
    images?: string[];
    /** Average rating (0–5) from reviews */
    rating: number;
    /** Total number of reviews */
    totalReviews: number;
    /** Whether the garage is currently active/visible */
    isActive: boolean;
    /** Creation timestamp (ISO string) */
    createdAt: string;
    /** Last update timestamp (ISO string) */
    updatedAt: string;
}

/**
 * Extended type for search results (includes calculated distance)
 */
export interface GarageSearchResult extends Garage {
    /** Distance from user in kilometers (calculated server-side) */
    distance?: number;
}

/**
 * Shape expected when creating a new garage
 */
export interface CreateGarageInput {
    name: string;
    address: string;
    capacity: number;
    pricePerHour: number;
    description?: string;
    amenities?: string[];
    images?: string[];
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
}

/**
 * Shape for updating an existing garage (all fields optional)
 */
export interface UpdateGarageInput extends Partial<CreateGarageInput> {
    isActive?: boolean;
}