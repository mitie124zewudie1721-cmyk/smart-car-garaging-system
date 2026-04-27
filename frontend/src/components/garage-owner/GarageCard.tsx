import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import GarageDetailsModal from './GarageDetailsModal';
// src/components/garage-owner/GarageCard.tsx
import { useTranslation } from 'react-i18next';

interface Service {
    name: string;
    price: number;
    duration: number;
    description?: string;
}

interface Contact {
    phone?: string;
    email?: string;
}

interface BankAccounts {
    cbe?: {
        accountNumber?: string;
        accountName?: string;
        branch?: string;
    };
    abyssinia?: {
        accountNumber?: string;
        accountName?: string;
        branch?: string;
    };
    telebirr?: {
        phoneNumber?: string;
        accountName?: string;
    };
}

interface Garage {
    _id: string;
    name: string;
    address?: string;
    location?: {
        address?: string;
        coordinates: [number, number];
    };
    capacity: number;
    availableSlots: number;
    pricePerHour: number;
    rating: number;
    totalReviews?: number;
    amenities: string[];
    description?: string;
    images?: string[];
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    contact?: Contact;
    services?: Service[];
    operatingHours?: { start?: string; end?: string; };
    paymentMethods?: string[];
    bankAccounts?: BankAccounts;
    depositPercent?: number;
}

interface GarageCardProps {
    garage: Garage;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function GarageCard({ garage, onEdit, onDelete }: GarageCardProps) {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { t } = useTranslation();
    // Cap availableSlots to never exceed capacity (guard against stale data)
    const availableSlots = Math.min(garage.availableSlots ?? garage.capacity, garage.capacity);
    const occupancy = garage.capacity > 0
        ? Math.round(((garage.capacity - availableSlots) / garage.capacity) * 100)
        : 0;

    // Get address from either old format or new location format
    const address = garage.address || garage.location?.address || 'No address provided';

    const getStatusBadge = () => {
        if (!garage.verificationStatus || garage.verificationStatus === 'approved') {
            return null;
        }

        if (garage.verificationStatus === 'pending') {
            return (
                <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 shadow-sm">
                        ⏳ Pending Verification
                    </span>
                </div>
            );
        }

        if (garage.verificationStatus === 'rejected') {
            return (
                <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm">
                        ❌ Rejected
                    </span>
                </div>
            );
        }

        return null;
    };

    return (
        <Card hoverable className="transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex flex-col h-full relative">
                {/* Status Badge */}
                {getStatusBadge()}

                {/* Image placeholder or first image */}
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-t-xl flex items-center justify-center overflow-hidden">
                    {garage.images?.[0] ? (
                        <img src={garage.images[0]} alt={garage.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-6xl text-slate-400 dark:text-slate-600">🏠</span>
                    )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {garage.name}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {address}
                    </p>

                    {/* Verification Status Message */}
                    {garage.verificationStatus === 'pending' && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                ⚠️ Your garage is pending admin verification and cannot receive bookings until approved.
                            </p>
                        </div>
                    )}

                    {garage.verificationStatus === 'rejected' && garage.rejectionReason && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                                Rejected by Admin
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400">
                                {garage.rejectionReason}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('garage.capacity')}</p>
                            <p className="font-medium">{garage.capacity} {t('garage.slots')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('garage.available')}</p>
                            <p className="font-medium text-green-600 dark:text-green-400">{availableSlots} {t('garage.slots')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('garage.score')}</p>
                            <p className="font-medium">{garage.rating.toFixed(1)} / 5</p>
                        </div>
                    </div>

                    {/* Deposit info */}
                    <div className="mb-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                        <div>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">{t('garage.bookingDeposit')}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">{t('garage.requiredUpfront')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                                {garage.depositPercent ?? 30}%
                            </span>
                            <button
                                onClick={() => onEdit?.(garage._id)}
                                className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
                                title="Edit deposit percentage in garage settings"
                            >
                                {t('garage.edit')}
                            </button>
                        </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{t('garage.occupancy')}</span>
                            <span>{occupancy}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all"
                                style={{ width: `${occupancy}%` }}
                            />
                        </div>
                    </div>

                    {/* Amenities tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {garage.amenities.slice(0, 4).map((amenity) => (
                            <span
                                key={amenity}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                                {amenity.replace('_', ' ')}
                            </span>
                        ))}
                        {garage.amenities.length > 4 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{garage.amenities.length - 4} {t('garage.more')}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-auto">
                        <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() => setShowDetailsModal(true)}
                        >
                            {t('garage.viewDetails')}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" fullWidth onClick={() => onEdit?.(garage._id)}>
                                {t('garage.edit')}
                            </Button>
                            <Button variant="destructive" size="sm" fullWidth onClick={() => onDelete?.(garage._id)}>
                                {t('garage.delete')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <GarageDetailsModal
                garage={{
                    ...garage,
                    location: garage.location || {
                        address: garage.address || '',
                        coordinates: [0, 0],
                    },
                    totalReviews: garage.totalReviews || 0,
                }}
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
            />
        </Card>
    );
}
