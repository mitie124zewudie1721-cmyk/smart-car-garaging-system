// src/types/vehicle.ts (optional – add if needed)
export interface Vehicle {
    _id: string;
    user: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color?: string;
    type?: 'sedan' | 'suv' | 'hatchback' | 'truck' | 'other';
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVehicleInput {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color?: string;
    type?: string;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> { }