// src/types/common.ts

/**
 * Generic ID type (MongoDB ObjectId as string)
 */
export type ID = string;

/**
 * Base entity fields shared by most documents
 */
export interface BaseEntity {
    /** MongoDB _id (usually stringified ObjectId) */
    _id: ID;
    /** ISO timestamp when document was created */
    createdAt: string;
    /** ISO timestamp when document was last updated */
    updatedAt: string;
}

/**
 * Base entity with owner reference (common for user-owned resources)
 */
export interface WithOwner extends BaseEntity {
    /** ID of the user who owns/created this entity */
    owner: ID;
}

/**
 * Optional: Soft-deletable entity (very common pattern)
 */
export interface SoftDeletable extends BaseEntity {
    /** Soft delete flag */
    isDeleted?: boolean;
    /** Timestamp of soft deletion */
    deletedAt?: string | null;
}

/**
 * Optional: Timestamped entity with active status
 */
export interface Activable extends BaseEntity {
    /** Whether the entity is currently active/enabled */
    isActive?: boolean;
}