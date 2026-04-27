// src/components/shared/VehicleCard.tsx
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Car, Edit, Trash2 } from 'lucide-react';

type ApiErrorShape = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

interface Vehicle {
    _id: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color?: string;
    type?: 'sedan' | 'suv' | 'hatchback' | 'truck';
    isDefault?: boolean;
    image?: {
        url?: string;
    };
    onSelect?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => Promise<void> | void;
}

interface VehicleCardProps {
    vehicle: Vehicle;
    isLoading?: boolean;
}

export default function VehicleCard({ vehicle, isLoading = false }: VehicleCardProps) {
    const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const toAbsoluteImageUrl = (maybeRelative?: string) => {
        if (!maybeRelative) return null;
        if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
        return `${backendBaseUrl}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
    };

    const handleDelete = async () => {
        if (!vehicle.onDelete) return;

        const confirmed = confirm(
            `Are you sure you want to delete ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await vehicle.onDelete(vehicle._id);
            toast.success('Vehicle deleted successfully');
        } catch (err: unknown) {
            toast.error((err as ApiErrorShape).response?.data?.message || 'Failed to delete vehicle');
        }
    };

    return (
        <Card
            hoverable
            className={cn(
                'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                isLoading && 'opacity-75 pointer-events-none'
            )}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                {/* Left: Vehicle Info */}
                <div className="flex items-start gap-4 flex-1">
                    {/* Vehicle Icon / Image placeholder */}
                    <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {vehicle.image?.url ? (
                            <img
                                src={toAbsoluteImageUrl(vehicle.image.url) || undefined}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <Car size={24} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {vehicle.make} {vehicle.model}
                            </h3>
                            {vehicle.isDefault && (
                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs rounded-full font-medium">
                                    Default
                                </span>
                            )}
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                            <p>Year: <span className="font-medium">{vehicle.year}</span></p>
                            <p>Plate: <span className="font-mono font-medium">{vehicle.plateNumber}</span></p>
                            {vehicle.color && <p>Color: <span className="capitalize">{vehicle.color}</span></p>}
                            {vehicle.type && <p>Type: <span className="capitalize">{vehicle.type}</span></p>}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-row md:flex-col gap-3 md:items-end">
                    {vehicle.onSelect && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => vehicle.onSelect!(vehicle._id)}
                            disabled={isLoading}
                            aria-label={`Select ${vehicle.make} ${vehicle.model}`}
                        >
                            Select
                        </Button>
                    )}

                    {vehicle.onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => vehicle.onEdit!(vehicle._id)}
                            disabled={isLoading}
                            aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                        >
                            <Edit size={16} className="mr-1" />
                            Edit
                        </Button>
                    )}

                    {vehicle.onDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
                            aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                        >
                            <Trash2 size={16} className="mr-1" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}