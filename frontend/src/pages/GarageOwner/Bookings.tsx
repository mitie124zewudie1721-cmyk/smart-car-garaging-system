// src/pages/GarageOwner/Bookings.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import { DEFAULT_AVATAR } from '@/lib/constants';

import { useTranslation } from 'react-i18next';

interface Booking {
    _id: string;
    id?: string;
    user: {
        _id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    garage: {
        _id: string;
        name: string;
        address: string;
    };
    vehicle?: {
        _id: string;
        make?: string;
        model?: string;
        plateNumber: string;
        year?: number;
        color?: string;
        type?: string;
        sizeCategory?: string;
        image?: {
            url?: string;
        };
        updatedAt?: string;
    };
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
    totalPrice: number;
    depositAmount?: number;
    depositPaid?: boolean;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
    serviceType: string;
    serviceDescription?: string;
    notes?: string;
    createdAt: string;
    adjustedPrice?: number;
    adjustedPriceReason?: string;
    adjustedPriceStatus?: 'pending' | 'accepted' | 'rejected' | null;
}

interface Payment {
    _id?: string;
    id: string;
    amount: number;
    paymentMethod: string;
    paymentProvider?: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'cancelled';
    transactionId: string;
    paymentDate?: string;
    isVerified: boolean;
    verifiedAt?: string;
    metadata?: { actualMethod?: string; isDeposit?: boolean };
    // commission fields added by backend
    commissionRate?: number;
    commissionAmount?: number;
    garageEarnings?: number;
    // new fields for effective calculation (in case rate changed after payment)
    effectiveCommissionRate?: number;
    effectiveCommissionAmount?: number;
    effectiveGarageEarnings?: number;
    reservation?: Booking;
}

export default function Bookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [priceAdjBooking, setPriceAdjBooking] = useState<Booking | null>(null);
    const [adjustedPrice, setAdjustedPrice] = useState('');
    const [adjustedReason, setAdjustedReason] = useState('');
    const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Helper function to get ID (handles both _id and id from Mongoose toJSON transform)
    const getBookingId = (booking: Booking): string => booking.id || booking._id || '';

    // Fetch payment info for a booking
    const fetchPaymentForBooking = async (reservationId: string) => {
        try {
            const response = await api.get(`/payments/reservation/${reservationId}`);
            const paymentData = response.data.data;
            console.log('🔍 Fetched payment data:', paymentData);
            return paymentData;
        } catch (error) {
            console.log('No payment found for reservation:', reservationId);
            return null;
        }
    };

    // Handle payment verification by garage owner
    const handleVerifyPayment = async (paymentId: string) => {
        console.log('🔍 Payment verification attempt:', { paymentId, paymentInfo });

        if (!paymentId || paymentId === 'undefined') {
            toast.error('Payment ID is missing. Please refresh and try again.');
            return;
        }

        setPaymentLoading(true);
        try {
            await api.patch(`/payments/${paymentId}/garage-verify`);
            toast.success('Payment verified successfully! Customer has been notified.');

            // Refresh payment info
            if (selectedBooking) {
                const updatedPayment = await fetchPaymentForBooking(getBookingId(selectedBooking));
                setPaymentInfo(updatedPayment);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to verify payment';
            toast.error(message);
        } finally {
            setPaymentLoading(false);
        }
    };

    // Payment status display helper
    const getPaymentStatusBadge = (status: string, isVerified: boolean) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
            success: { color: 'bg-green-100 text-green-800', text: isVerified ? 'Verified' : 'Paid' },
            failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
            refunded: { color: 'bg-purple-100 text-purple-800', text: 'Refunded' },
            cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const toAbsoluteImageUrl = (maybeRelative?: string) => {
        if (!maybeRelative) return null;
        if (/^https?:\/\//i.test(maybeRelative) || /^data:/i.test(maybeRelative)) return maybeRelative;
        return `${backendBaseUrl}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
    };

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use the dedicated garage-bookings endpoint for garage owners
            const response = await api.get('/reservations/garage-bookings');
            const garageBookings = response.data.data || [];
            setBookings(garageBookings);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load bookings';
            setError(message);
            console.error('Fetch bookings error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (bookingId: string) => {
        if (!bookingId) {
            toast.error('Invalid booking ID');
            return;
        }
        setActionLoading(bookingId);
        try {
            await api.patch(`/reservations/${bookingId}/accept`);
            toast.success('Booking accepted successfully');
            fetchBookings(); // Refresh the list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to accept booking';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId: string) => {
        if (!bookingId) {
            toast.error('Invalid booking ID');
            return;
        }
        setActionLoading(bookingId);
        try {
            await api.patch(`/reservations/${bookingId}/reject`, {
                reason: 'Rejected by garage owner'
            });
            toast.success('Booking rejected successfully');
            fetchBookings(); // Refresh the list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to reject booking';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        if (!bookingId) {
            toast.error('Invalid booking ID');
            return;
        }
        setActionLoading(bookingId);
        try {
            await api.patch(`/reservations/${bookingId}/status`, { status: newStatus });
            toast.success(`Booking status updated to ${newStatus}`);
            fetchBookings(); // Refresh the list
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update status';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkNoShow = async (bookingId: string) => {
        if (!bookingId) { toast.error('Invalid booking ID'); return; }
        if (!confirm('Mark this booking as no-show? The customer\'s deposit will be forfeited.')) return;
        setActionLoading(bookingId);
        try {
            await api.patch(`/reservations/${bookingId}/no-show`);
            toast.success('Booking marked as no-show. Deposit retained.');
            fetchBookings();
            setShowDetailsModal(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark as no-show');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckArrival = async (bookingId: string) => {
        if (!bookingId) { toast.error('Invalid booking ID'); return; }
        setActionLoading(bookingId);
        try {
            const res = await api.patch(`/reservations/${bookingId}/check-arrival`);
            const { isLate, depositForfeited: _depositForfeited } = res.data.data;
            if (isLate) {
                toast.error(`Customer arrived LATE — deposit forfeited. Full price applies.`, { duration: 5000 });
            } else {
                toast.success('Customer arrived on time. Booking is now active.');
            }
            fetchBookings();
            setShowDetailsModal(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to check arrival');
        } finally {
            setActionLoading(null);
        }
    };

    const handleProposePrice = async () => {
        if (!priceAdjBooking) return;
        const bookingId = getBookingId(priceAdjBooking);
        if (!bookingId) { toast.error('Invalid booking ID'); return; }
        const price = parseFloat(adjustedPrice);
        if (!price || price <= priceAdjBooking.totalPrice) {
            toast.error('Adjusted price must be higher than original price');
            return;
        }
        try {
            await api.patch(`/reservations/${bookingId}/adjust-price`, {
                adjustedPrice: price,
                reason: adjustedReason || 'Additional work required',
            });
            toast.success('Price adjustment sent to customer for approval');
            setShowPriceModal(false);
            setAdjustedPrice('');
            setAdjustedReason('');
            fetchBookings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to propose price adjustment');
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            no_show: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        };
        return colors[status] || colors.pending;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleViewDetails = async (booking: Booking) => {
        setSelectedBooking(booking);

        // Fetch payment info for this booking
        const payment = await fetchPaymentForBooking(getBookingId(booking));
        setPaymentInfo(payment);

        setShowDetailsModal(true);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('bookings.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('bookings.subtitle')}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'all' && ` (${bookings.length})`}
                        {status !== 'all' && ` (${bookings.filter(b => b.status === status).length})`}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : error ? (
                <Alert variant="error">{error}</Alert>
            ) : filteredBookings.length === 0 ? (
                <Alert variant="info">
                    {filter === 'all'
                        ? 'No bookings yet. Bookings will appear here when customers book your garages.'
                        : `No ${filter} bookings found.`
                    }
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredBookings.map((booking) => {
                        const bookingId = getBookingId(booking);
                        return (
                            <Card key={bookingId}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {booking.garage?.name || 'Unknown Garage'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {booking.garage?.address}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-24">Customer:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {booking.user?.name || 'Unknown'}
                                            </span>
                                        </div>
                                        {booking.user?.phone && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 w-24">Phone:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {booking.user.phone}
                                                </span>
                                            </div>
                                        )}
                                        {booking.vehicle && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 w-24">Vehicle:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {(booking.vehicle.make || '')} {(booking.vehicle.model || '')} ({booking.vehicle.plateNumber})
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-24">Service:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {booking.serviceType}
                                            </span>
                                        </div>
                                        {booking.serviceDescription && (
                                            <div className="flex items-start text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Details:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {booking.serviceDescription}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-24">Start:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {formatDate(booking.startTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-24">End:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {formatDate(booking.endTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-24">Price:</span>
                                            <span className="text-gray-900 dark:text-white font-semibold">
                                                {booking.totalPrice} ETB
                                            </span>
                                        </div>
                                        {booking.depositAmount && booking.depositAmount > 0 && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 w-24">Deposit:</span>
                                                <span className={`font-semibold ${booking.depositPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {booking.depositAmount} ETB {booking.depositPaid ? '✓ Paid' : '⚠ Unpaid'}
                                                </span>
                                            </div>
                                        )}

                                        {/* ── PAYMENT STATUS BANNER — visible for completed bookings ── */}
                                        {booking.status === 'completed' && (
                                            <div className={`mt-3 rounded-xl px-4 py-3 flex items-center justify-between ${booking.paymentStatus === 'paid' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border-2 border-red-400'}`}>
                                                <div>
                                                    <p className={`font-bold text-sm ${booking.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {booking.paymentStatus === 'paid' ? '✅ FULLY PAID — Car can leave' : '🚫 NOT PAID — Do not release car'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {booking.paymentStatus === 'paid'
                                                            ? `Total ${booking.totalPrice} ETB received`
                                                            : `Remaining: ${booking.totalPrice - (booking.depositPaid ? (booking.depositAmount || 0) : 0)} ETB unpaid`}
                                                    </p>
                                                </div>
                                                <span className={`text-2xl ${booking.paymentStatus === 'paid' ? '' : 'animate-pulse'}`}>
                                                    {booking.paymentStatus === 'paid' ? '🟢' : '🔴'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {booking.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAccept(bookingId)}
                                                    disabled={actionLoading === bookingId}
                                                    fullWidth
                                                >
                                                    {actionLoading === bookingId ? t('bookings.processing') : t('bookings.accept')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleReject(bookingId)}
                                                    disabled={actionLoading === bookingId}
                                                    fullWidth
                                                >
                                                    {t('bookings.reject')}
                                                </Button>
                                            </>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleCheckArrival(bookingId)}
                                                    disabled={actionLoading === bookingId}
                                                    fullWidth
                                                >
                                                    {actionLoading === bookingId ? t('bookings.processing') : t('bookings.checkArrival')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkNoShow(bookingId)}
                                                    disabled={actionLoading === bookingId}
                                                    fullWidth
                                                >
                                                    {t('bookings.noShow')}
                                                </Button>
                                            </>
                                        )}
                                        {booking.status === 'active' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(bookingId, 'completed')}
                                                    disabled={actionLoading === bookingId}
                                                    fullWidth
                                                >
                                                    {actionLoading === bookingId ? t('bookings.processing') : t('bookings.completeService')}
                                                </Button>
                                                {!booking.adjustedPriceStatus && (
                                                    <button
                                                        onClick={() => { setPriceAdjBooking(booking); setShowPriceModal(true); }}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition whitespace-nowrap"
                                                        title="Propose price adjustment"
                                                    >
                                                        💰 Adjust Price
                                                    </button>
                                                )}
                                                {booking.adjustedPriceStatus === 'pending' && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl whitespace-nowrap">
                                                        ⏳ Awaiting approval
                                                    </span>
                                                )}
                                                {booking.adjustedPriceStatus === 'accepted' && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-xl whitespace-nowrap">
                                                        ✅ Price accepted
                                                    </span>
                                                )}
                                                {booking.adjustedPriceStatus === 'rejected' && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-xl whitespace-nowrap">
                                                        ❌ Price rejected
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {/* Release car button — only when completed AND paid */}
                                        {booking.status === 'completed' && booking.paymentStatus === 'paid' && (
                                            <div className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl text-center">
                                                ✅ Car Released — Payment Complete
                                            </div>
                                        )}
                                        {/* Warning — completed but NOT paid */}
                                        {booking.status === 'completed' && booking.paymentStatus !== 'paid' && (
                                            <div className="w-full px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-xl text-center animate-pulse">
                                                🚫 HOLD CAR — Awaiting Payment
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(booking)}
                                        >
                                            {t('bookings.viewDetails')}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Booking Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedBooking(null);
                    setPaymentInfo(null);
                }}
                title="Booking Details"
                size="lg"
            >
                {selectedBooking && (
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Booking #{getBookingId(selectedBooking).slice(-8)}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                                {selectedBooking.status}
                            </span>
                        </div>

                        {/* Garage Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Garage Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedBooking.garage?.name || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                                        {selectedBooking.garage?.address || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedBooking.user?.name || 'N/A'}
                                    </span>
                                </div>
                                {selectedBooking.user?.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedBooking.user.phone}
                                        </span>
                                    </div>
                                )}
                                {selectedBooking.user?.email && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedBooking.user.email}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        {selectedBooking.vehicle && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Information</h4>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                    {/* Vehicle image */}
                                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                        <img
                                            src={
                                                (() => {
                                                    const url = (selectedBooking.vehicle.image?.url &&
                                                        (toAbsoluteImageUrl(selectedBooking.vehicle.image.url) || undefined)) ||
                                                        DEFAULT_AVATAR;
                                                    return url === DEFAULT_AVATAR ? url : `${url}?t=${selectedBooking.vehicle.updatedAt}`;
                                                })()
                                            }
                                            alt={`${selectedBooking.vehicle.make || ''} ${selectedBooking.vehicle.model || ''}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Vehicle:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {(selectedBooking.vehicle.make || '')} {(selectedBooking.vehicle.model || '')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Plate Number:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedBooking.vehicle.plateNumber}
                                        </span>
                                    </div>
                                    {selectedBooking.vehicle.color && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedBooking.vehicle.color}
                                            </span>
                                        </div>
                                    )}
                                    {selectedBooking.vehicle.type && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedBooking.vehicle.type}
                                            </span>
                                        </div>
                                    )}
                                    {selectedBooking.vehicle.year && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Year:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedBooking.vehicle.year}
                                            </span>
                                        </div>
                                    )}
                                    {selectedBooking.vehicle.sizeCategory && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Size Category:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedBooking.vehicle.sizeCategory}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Service Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Service Type:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedBooking.serviceType}
                                    </span>
                                </div>
                                {selectedBooking.serviceDescription && (
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Description:</span>
                                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded">
                                            {selectedBooking.serviceDescription}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Appointment Details */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Appointment Details</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Start Time:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(selectedBooking.startTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">End Time:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(selectedBooking.endTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Price:</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {selectedBooking.totalPrice} ETB
                                    </span>
                                </div>
                                {selectedBooking.depositAmount && selectedBooking.depositAmount > 0 && (
                                    <div className={`flex justify-between items-center p-2 rounded-lg ${selectedBooking.depositPaid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Deposit (30%):</span>
                                        <span className={`text-sm font-bold ${selectedBooking.depositPaid ? 'text-green-700' : 'text-orange-700'}`}>
                                            {selectedBooking.depositAmount} ETB {selectedBooking.depositPaid ? '✓ Paid' : '⚠ Not Paid'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Booked On:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(selectedBooking.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('bookings.paymentInfo')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                {paymentInfo ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                                            {getPaymentStatusBadge(paymentInfo.status, paymentInfo.isVerified)}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Method:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {paymentInfo.metadata?.actualMethod
                                                    ? `${paymentInfo.metadata.actualMethod} (via Chapa)`
                                                    : paymentInfo.paymentProvider === 'chapa'
                                                        ? `${paymentInfo.paymentMethod} (via Chapa)`
                                                        : paymentInfo.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {paymentInfo.amount} ETB
                                            </span>
                                        </div>
                                        {(paymentInfo.commissionRate != null || paymentInfo.effectiveCommissionRate != null) && (
                                            <div className="flex justify-between">
                                                {(() => {
                                                    const rate =
                                                        paymentInfo.effectiveCommissionRate != null
                                                            ? paymentInfo.effectiveCommissionRate
                                                            : paymentInfo.commissionRate || 0;
                                                    const amount =
                                                        paymentInfo.effectiveCommissionAmount != null
                                                            ? paymentInfo.effectiveCommissionAmount
                                                            : paymentInfo.commissionAmount || 0;
                                                    const earnings =
                                                        paymentInfo.effectiveGarageEarnings != null
                                                            ? paymentInfo.effectiveGarageEarnings
                                                            : paymentInfo.garageEarnings != null
                                                                ? paymentInfo.garageEarnings
                                                                : paymentInfo.amount || 0;
                                                    return (
                                                        <>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Commission ({(rate * 100).toFixed(1)}%):</span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {amount.toFixed(2)} ETB
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Your earnings:</span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {earnings.toFixed(2)} ETB
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {/* only show legacy earnings line when commission block not rendered */}
                                        {(paymentInfo.commissionRate == null && paymentInfo.effectiveCommissionRate == null && paymentInfo.garageEarnings != null) && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Your earnings:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {paymentInfo.garageEarnings?.toFixed(2)} ETB
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                                                {paymentInfo.transactionId}
                                            </span>
                                        </div>
                                        {paymentInfo.paymentDate && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Date:</span>
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(paymentInfo.paymentDate).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {paymentInfo.isVerified && paymentInfo.verifiedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Verified At:</span>
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(paymentInfo.verifiedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Payment verification button */}
                                        {(paymentInfo.status === 'success' || paymentInfo.status === 'pending') && !paymentInfo.isVerified && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                                {/* Chapa auto-verify button — only show if payment was initiated via Chapa */}
                                                {paymentInfo.transactionId?.startsWith('SGS-') && paymentInfo.status === 'pending' && (
                                                    <>
                                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                                            ⏳ Car owner initiated Chapa payment but may not have completed checkout yet. Click below to check if it went through.
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.get(`/payments/chapa/verify/${paymentInfo.transactionId}`);
                                                                    toast.success('✅ Payment verified with Chapa!');
                                                                    const updated = await api.get(`/payments/reservation/${getBookingId(selectedBooking)}`);
                                                                    setPaymentInfo(updated.data.data);
                                                                    fetchBookings();
                                                                } catch (err: any) {
                                                                    const msg = err.response?.data?.message || 'Verification failed';
                                                                    if (msg.includes('not confirmed')) {
                                                                        toast.error('Payment not completed by car owner yet — ask them to finish the Chapa checkout');
                                                                    } else {
                                                                        toast.error(msg);
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition text-sm"
                                                        >
                                                            🔄 Check Chapa Payment Status
                                                        </button>
                                                    </>
                                                )}
                                                {/* Manual confirm — only for non-Chapa payments */}
                                                {!paymentInfo.transactionId?.startsWith('SGS-') && (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleVerifyPayment(paymentInfo.id)}
                                                            disabled={paymentLoading}
                                                            fullWidth
                                                        >
                                                            {paymentLoading ? t('bookings.verifying') : t('bookings.confirmReceived')}
                                                        </Button>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                                            Click to confirm you have received the payment
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {(paymentInfo.status === 'success' || paymentInfo.status === 'pending') && paymentInfo.isVerified && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-center">
                                                    <p className="text-sm text-green-800 dark:text-green-200">
                                                        ✅ Payment verified and confirmed
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No payment information available
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Payment will appear here after customer pays
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedBooking.notes && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Notes</h4>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                        {selectedBooking.notes}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {selectedBooking.status === 'pending' && (
                                <>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            handleAccept(getBookingId(selectedBooking));
                                            setShowDetailsModal(false);
                                        }}
                                        disabled={actionLoading === getBookingId(selectedBooking)}
                                        fullWidth
                                    >
                                        Accept Booking
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            handleReject(getBookingId(selectedBooking));
                                            setShowDetailsModal(false);
                                        }}
                                        disabled={actionLoading === getBookingId(selectedBooking)}
                                        fullWidth
                                    >
                                        {t('bookings.reject')}
                                    </Button>
                                </>
                            )}
                            {selectedBooking.status === 'confirmed' && (
                                <>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            handleCheckArrival(getBookingId(selectedBooking));
                                            setShowDetailsModal(false);
                                        }}
                                        disabled={actionLoading === getBookingId(selectedBooking)}
                                        fullWidth
                                    >
                                        {t('bookings.checkArrival')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMarkNoShow(getBookingId(selectedBooking))}
                                        disabled={actionLoading === getBookingId(selectedBooking)}
                                        fullWidth
                                    >
                                        {t('bookings.markNoShow')}
                                    </Button>
                                </>
                            )}
                            {selectedBooking.status === 'active' && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        handleStatusUpdate(getBookingId(selectedBooking), 'completed');
                                        setShowDetailsModal(false);
                                    }}
                                    disabled={actionLoading === getBookingId(selectedBooking)}
                                    fullWidth
                                >
                                    Complete Service
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedBooking(null);
                                    setPaymentInfo(null);
                                }}
                                fullWidth
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Price Adjustment Modal ── */}
            {showPriceModal && priceAdjBooking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">💰 Propose Price Adjustment</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Original price: <strong>{priceAdjBooking.totalPrice} ETB</strong>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    New Total Price (ETB) *
                                </label>
                                <input
                                    type="number"
                                    value={adjustedPrice}
                                    onChange={e => setAdjustedPrice(e.target.value)}
                                    placeholder={`More than ${priceAdjBooking.totalPrice} ETB`}
                                    min={priceAdjBooking.totalPrice + 1}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Reason for adjustment *
                                </label>
                                <textarea
                                    value={adjustedReason}
                                    onChange={e => setAdjustedReason(e.target.value)}
                                    placeholder="e.g. Engine oil replacement needed, brake pads worn out..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowPriceModal(false); setAdjustedPrice(''); setAdjustedReason(''); }}
                                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProposePrice}
                                disabled={!adjustedPrice || !adjustedReason}
                                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
                            >
                                Send to Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
