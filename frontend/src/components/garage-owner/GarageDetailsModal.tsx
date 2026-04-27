// src/components/garage-owner/GarageDetailsModal.tsx
import { X } from 'lucide-react';
import Button from '@/components/common/Button';

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
    location: { address?: string; coordinates: [number, number]; };
    capacity: number; availableSlots: number; pricePerHour: number;
    rating: number; totalReviews: number; amenities: string[];
    description?: string; images?: string[];
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string; contact?: Contact; services?: Service[];
    operatingHours?: {
        start?: string; end?: string;
        weekly?: Record<string, { open: boolean; start: string; end: string }>;
    };
    paymentMethods?: string[]; bankAccounts?: BankAccounts;
    isActive?: boolean;
}

interface GarageDetailsModalProps {
    garage: Garage;
    isOpen: boolean;
    onClose: () => void;
    role?: 'owner' | 'admin';
    onEdit?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
}

export default function GarageDetailsModal({ garage, isOpen, onClose, role = 'owner', onEdit, onDelete, onApprove, onReject }: GarageDetailsModalProps) {
    if (!isOpen) return null;

    const formatPaymentMethod = (method: string) => {
        const methodMap: Record<string, string> = {
            cash: 'Cash',
            telebirr: 'Telebirr',
            cbe_birr: 'CBE Birr',
            abyssinia_bank: 'Abysinia Bank',
            chapa: 'Chapa',
            m_pesa: 'M-Pesa',
        };
        return methodMap[method] || method;
    };

    const getStatusColor = () => {
        switch (garage.verificationStatus) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getStatusIcon = () => {
        switch (garage.verificationStatus) {
            case 'approved':
                return '✅';
            case 'pending':
                return '⏳';
            case 'rejected':
                return '❌';
            default:
                return '📋';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {garage.name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {garage.location.address || 'No address provided'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
                                {getStatusIcon()} {garage.verificationStatus?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            {garage.verificationStatus === 'approved' && (
                                <span className="text-sm text-green-600 dark:text-green-400">
                                    ✓ Verified and Active
                                </span>
                            )}
                        </div>

                        {/* Rejection Reason */}
                        {garage.verificationStatus === 'rejected' && garage.rejectionReason && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                                    Rejection Reason:
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {garage.rejectionReason}
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        {garage.description && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Description
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {garage.description}
                                </p>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Capacity</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {garage.capacity} slots
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available</p>
                                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                        {garage.availableSlots} slots
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {garage.pricePerHour} ETB
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {garage.rating.toFixed(1)} / 5 ({garage.totalReviews || 0})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        {garage.contact && (garage.contact.phone || garage.contact.email) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {garage.contact.phone && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <span className="text-2xl">📞</span>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {garage.contact.phone}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {garage.contact.email && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <span className="text-2xl">📧</span>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {garage.contact.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Location
                            </h3>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {garage.location.address || 'No address provided'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Coordinates: {garage.location.coordinates[1].toFixed(4)}°N, {garage.location.coordinates[0].toFixed(4)}°E
                                </p>
                            </div>
                        </div>

                        {/* Operating Hours */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Operating Hours
                            </h3>
                            {garage.operatingHours?.weekly ? (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, i) => {
                                        const s = garage.operatingHours!.weekly![day];
                                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                                        return (
                                            <div key={day} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < 6 ? 'border-b border-gray-100 dark:border-gray-600' : ''} ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                <span className={`w-28 capitalize font-medium ${isToday ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {day}{isToday ? ' (Today)' : ''}
                                                </span>
                                                {s?.open && s.start && s.end
                                                    ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{s.start} – {s.end}</span>
                                                    : <span className="text-red-400 italic text-xs">Closed</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : garage.operatingHours?.start ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        🕐 {garage.operatingHours.start} – {garage.operatingHours.end}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-400 italic">Working hours not set yet. Go to Edit Garage to set your schedule.</p>
                                </div>
                            )}
                        </div>

                        {/* Services */}
                        {garage.services && garage.services.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Services Offered ({garage.services.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {garage.services.map((service, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {service.name}
                                                </h4>
                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    {service.price} ETB
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                ⏱️ {service.duration} minutes
                                            </p>
                                            {service.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {service.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amenities */}
                        {garage.amenities && garage.amenities.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Amenities
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {garage.amenities.map((amenity) => (
                                        <span
                                            key={amenity}
                                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                        >
                                            {amenity.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Methods */}
                        {garage.paymentMethods && garage.paymentMethods.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Payment Methods Accepted
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {garage.paymentMethods.map((method) => (
                                        <span
                                            key={method}
                                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        >
                                            💳 {formatPaymentMethod(method)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bank Account Details */}
                        {garage.bankAccounts && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Bank Account Details
                                </h3>
                                <div className="space-y-3">
                                    {/* CBE */}
                                    {garage.bankAccounts.cbe?.accountNumber && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                                🏦 Commercial Bank of Ethiopia (CBE)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-blue-700 dark:text-blue-400">Account Number</p>
                                                    <p className="font-medium text-blue-900 dark:text-blue-200">
                                                        {garage.bankAccounts.cbe.accountNumber}
                                                    </p>
                                                </div>
                                                {garage.bankAccounts.cbe.accountName && (
                                                    <div>
                                                        <p className="text-xs text-blue-700 dark:text-blue-400">Account Name</p>
                                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                                            {garage.bankAccounts.cbe.accountName}
                                                        </p>
                                                    </div>
                                                )}
                                                {garage.bankAccounts.cbe.branch && (
                                                    <div>
                                                        <p className="text-xs text-blue-700 dark:text-blue-400">Branch</p>
                                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                                            {garage.bankAccounts.cbe.branch}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Abysinia Bank */}
                                    {garage.bankAccounts.abyssinia?.accountNumber && (
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                                                🏦 Abysinia Bank
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-purple-700 dark:text-purple-400">Account Number</p>
                                                    <p className="font-medium text-purple-900 dark:text-purple-200">
                                                        {garage.bankAccounts.abyssinia.accountNumber}
                                                    </p>
                                                </div>
                                                {garage.bankAccounts.abyssinia.accountName && (
                                                    <div>
                                                        <p className="text-xs text-purple-700 dark:text-purple-400">Account Name</p>
                                                        <p className="font-medium text-purple-900 dark:text-purple-200">
                                                            {garage.bankAccounts.abyssinia.accountName}
                                                        </p>
                                                    </div>
                                                )}
                                                {garage.bankAccounts.abyssinia.branch && (
                                                    <div>
                                                        <p className="text-xs text-purple-700 dark:text-purple-400">Branch</p>
                                                        <p className="font-medium text-purple-900 dark:text-purple-200">
                                                            {garage.bankAccounts.abyssinia.branch}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Telebirr */}
                                    {garage.bankAccounts.telebirr?.phoneNumber && (
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                            <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                                                📱 Telebirr
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-orange-700 dark:text-orange-400">Phone Number</p>
                                                    <p className="font-medium text-orange-900 dark:text-orange-200">
                                                        {garage.bankAccounts.telebirr.phoneNumber}
                                                    </p>
                                                </div>
                                                {garage.bankAccounts.telebirr.accountName && (
                                                    <div>
                                                        <p className="text-xs text-orange-700 dark:text-orange-400">Account Name</p>
                                                        <p className="font-medium text-orange-900 dark:text-orange-200">
                                                            {garage.bankAccounts.telebirr.accountName}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                        {role === 'admin' ? (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => { onReject?.(); onClose(); }}
                                >
                                    Reject
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => { onApprove?.(); onClose(); }}
                                >
                                    Approve
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={onClose}>
                                    Close
                                </Button>
                                {onEdit && (
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { onEdit(); onClose(); }}>
                                        Edit
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { onDelete(); onClose(); }}>
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
