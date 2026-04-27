// src/pages/CarOwner/MyReservations.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

interface Reservation {
    _id: string; id?: string;
    garage: { name: string; _id: string; bankAccounts?: any; depositPercent?: number; };
    vehicle: { name: string; plateNumber?: string; _id: string };
    startTime: string; endTime: string;
    status: 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed' | 'no_show';
    totalPrice: number;
    adjustedPrice?: number;
    adjustedPriceReason?: string;
    adjustedPriceStatus?: 'pending' | 'accepted' | 'rejected' | null;
    depositAmount?: number;
    depositPaid?: boolean;
    serviceType?: string; serviceDescription?: string; notes?: string;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

interface Payment {
    _id?: string; id: string; amount: number; paymentMethod: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'cancelled';
    transactionId: string; paymentDate?: string; isVerified: boolean; verifiedAt?: string;
    commissionRate?: number; commissionAmount?: number; garageEarnings?: number;
    effectiveCommissionRate?: number; effectiveCommissionAmount?: number; effectiveGarageEarnings?: number;
    reservation?: Reservation;
}

const STATUS_CONFIG = {
    pending: { label: 'reservation.status.pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-400', dot: 'bg-amber-400', icon: '' },
    confirmed: { label: 'reservation.status.confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-400', icon: '' },
    active: { label: 'reservation.status.active', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-400', dot: 'bg-blue-400', icon: '' },
    completed: { label: 'reservation.status.completed', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-l-slate-400', dot: 'bg-slate-400', icon: '' },
    cancelled: { label: 'reservation.status.cancelled', bg: 'bg-red-50', text: 'text-red-600', border: 'border-l-red-400', dot: 'bg-red-400', icon: '✕' },
    no_show: { label: 'reservation.status.noShow', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-l-orange-400', dot: 'bg-orange-400', icon: '⚠' },
};

export default function MyReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null);
    const [editFormData, setEditFormData] = useState({ startTime: '', endTime: '', serviceDescription: '' });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositPaymentMethod, setDepositPaymentMethod] = useState('cash');
    const [depositLoading, setDepositLoading] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');
    const [depositTransactionRef, setDepositTransactionRef] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation();

    // Handle Chapa return after payment — auto-verify
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('payment');
        const txRef = params.get('txRef') || params.get('trx_ref') || params.get('tx_ref');

        if (paymentStatus === 'success' && txRef) {
            // Call backend to verify and update reservation status
            api.get(`/payments/chapa/verify/${txRef}`)
                .then(res => {
                    if (res.data.success) {
                        toast.success('✅ Payment verified! Booking confirmed.', { duration: 4000 });
                    } else {
                        toast.success('Payment received — confirming...', { duration: 3000 });
                    }
                    fetchReservations();
                })
                .catch(() => {
                    toast.success('Payment received! Refreshing...', { duration: 3000 });
                    fetchReservations();
                })
                .finally(() => {
                    navigate('/my-reservations', { replace: true });
                });
        } else if (paymentStatus === 'failed') {
            toast.error('Payment was not completed. Please try again.');
            navigate('/my-reservations', { replace: true });
        }
    }, [location.search]);
    const fetchPaymentInfo = async (reservationId: string) => {
        try {
            const r = await api.get(`/payments/reservation/${reservationId}`);
            return r.data.data;
        } catch { return null; }
    };

    const fetchReservations = async () => {
        setLoading(true); setError(null);
        try {
            const r = await api.get('/reservations/my');
            setReservations((r.data.data || []).map((res: any) => {
                const garageDepositPercent = res.garage?.depositPercent ?? 30;
                const totalPrice = res.totalPrice || 0;
                // Recalculate deposit using current garage depositPercent if not yet paid
                const depositAmount = res.depositPaid
                    ? (res.depositAmount || 0)
                    : Math.ceil(totalPrice * garageDepositPercent / 100);
                return {
                    _id: res._id || res.id, id: res.id || res._id,
                    garage: { ...res.garage, name: res.garage?.name || 'Unknown Garage', _id: res.garage?._id || '' },
                    vehicle: res.vehicle || { name: 'Unknown Vehicle', _id: '' },
                    startTime: res.startTime, endTime: res.endTime, status: res.status,
                    totalPrice, serviceType: res.serviceType,
                    serviceDescription: res.serviceDescription, notes: res.notes,
                    paymentStatus: res.paymentStatus || 'pending',
                    adjustedPrice: res.adjustedPrice,
                    adjustedPriceReason: res.adjustedPriceReason,
                    adjustedPriceStatus: res.adjustedPriceStatus,
                    depositAmount,
                    depositPaid: res.depositPaid || false,
                };
            }));
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to load reservations';
            setError(msg); toast.error(msg);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (isAuthenticated) fetchReservations();
        else { setError('Please login to view your reservations'); setLoading(false); }
    }, [isAuthenticated]);

    const handleCancel = async (id: string) => {
        const res = reservations.find(r => (r.id || r._id) === id);
        if (!res) return;
        if (res.status === 'active') { toast.error('Cannot cancel an active service.'); return; }
        if (res.status === 'completed') { toast.error('Cannot cancel a completed reservation.'); return; }
        const hrs = (new Date(res.startTime).getTime() - Date.now()) / 3600000;
        if (hrs < 2) { toast.error('Cannot cancel within 2 hours of start time.'); return; }
        const msg = hrs < 24 ? 'Less than 24h notice — continue?' : 'Cancel this reservation?';
        if (!confirm(msg)) return;
        try { await api.delete(`/reservations/${id}`); toast.success('Cancelled'); fetchReservations(); }
        catch (err: any) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
    };

    const handleDelete = async (id: string) => {
        const res = reservations.find(r => (r.id || r._id) === id);
        if (!res) return;
        if (res.status === 'active') { toast.error('Cannot delete an active reservation.'); return; }
        if (!confirm('Permanently delete this reservation?')) return;
        try { await api.delete(`/reservations/${id}`); toast.success('Deleted'); fetchReservations(); }
        catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    const handlePayment = async (res: Reservation) => {
        setSelectedReservation(res);
        setPaymentInfo(await fetchPaymentInfo(res._id));
        setShowPaymentModal(true);
    };

    // ── PAY DEPOSIT: go directly to Chapa ──
    const handlePayDeposit = async (res: Reservation) => {
        try {
            const r = await api.post('/payments/chapa/initiate', {
                reservationId: res._id,
                isDeposit: true,
            });
            if (r.data?.data?.checkoutUrl) {
                window.location.href = r.data.data.checkoutUrl;
            } else {
                toast.error('Could not get payment link');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Payment failed');
        }
    };

    // ── PAY REMAINING: go directly to Chapa ──
    const handlePayRemaining = async (res: Reservation) => {
        try {
            const r = await api.post('/payments/chapa/initiate', {
                reservationId: res._id,
                isDeposit: false,
            });
            if (r.data?.data?.checkoutUrl) {
                window.location.href = r.data.data.checkoutUrl;
            } else {
                toast.error('Could not get payment link');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Payment failed');
        }
    };

    const handleEdit = (res: Reservation) => {
        setSelectedReservation(res);
        setEditFormData({
            startTime: new Date(res.startTime).toISOString().slice(0, 16),
            endTime: new Date(res.endTime).toISOString().slice(0, 16),
            serviceDescription: res.serviceDescription || '',
        });
        setShowEditModal(true);
    };

    const handleLeaveReview = (res: Reservation) => {
        setSelectedReservation(res);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewModal(true);
    };

    // ── VERIFY: check if Chapa payment went through ──
    const handleVerifyPayment = async (reservationId: string) => {
        try {
            // Get the payment record for this reservation
            const paymentRes = await api.get(`/payments/reservation/${reservationId}`);
            const payment = paymentRes.data.data;
            if (!payment?.transactionId) {
                toast.error('No pending payment found for this reservation');
                return;
            }
            const txRef = payment.transactionId;
            const verifyRes = await api.get(`/payments/chapa/verify/${txRef}`);
            if (verifyRes.data.success) {
                toast.success('✅ Payment verified! Status updated.');
                fetchReservations();
            } else {
                toast.error('Payment not confirmed by Chapa yet. Please wait a moment and try again.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed';
            toast.error(typeof msg === 'string' ? msg : 'Verification failed');
        }
    };

    // ── PRICE ADJUSTMENT: car owner responds ──
    const handleRespondPrice = async (reservationId: string, response: 'accepted' | 'rejected') => {
        try {
            await api.patch(`/reservations/${reservationId}/respond-price`, { response });
            toast.success(response === 'accepted' ? 'Price accepted. Please pay the updated amount.' : 'Price adjustment rejected.');
            fetchReservations();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to respond');
        }
    };

    const submitDeposit = async () => {
        if (!selectedReservation) return;
        // For non-cash deposit payments, require transaction reference
        if (depositPaymentMethod !== 'cash') {
            const ref = depositTransactionRef.trim();
            if (!ref || ref.length < 6) {
                toast.error('Please enter the transaction reference number (min 6 characters) from your payment app.');
                return;
            }
            if (!/^[A-Za-z0-9\-\/]+$/.test(ref)) {
                toast.error('Transaction reference can only contain letters, numbers, hyphens, or slashes.');
                return;
            }
        }
        setDepositLoading(true);
        try {
            await api.patch(`/reservations/${selectedReservation._id || selectedReservation.id}/pay-deposit`, {
                paymentMethod: depositPaymentMethod,
                ...(depositPaymentMethod !== 'cash' && { transactionRef: depositTransactionRef.trim() }),
            });
            toast.success('Deposit paid! The garage owner will now review your booking.');
            setShowDepositModal(false);
            setSelectedReservation(null);
            setDepositTransactionRef('');
            fetchReservations();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to pay deposit');
        } finally {
            setDepositLoading(false);
        }
    };

    const submitReview = async () => {
        if (!selectedReservation || reviewRating === 0) { toast.error('Please select a star rating'); return; }
        setReviewLoading(true);
        try {
            await api.post('/feedbacks', {
                reservationId: selectedReservation._id || selectedReservation.id,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });
            toast.success('Review submitted!');
            setReviewedIds(prev => { const s = new Set(prev); s.add(selectedReservation._id || selectedReservation.id!); return s; });
            setShowReviewModal(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally { setReviewLoading(false); }
    };

    const submitEdit = async () => {
        if (!selectedReservation) return;
        try {
            await api.put(`/reservations/${selectedReservation._id || selectedReservation.id}`, {
                startTime: new Date(editFormData.startTime).toISOString(),
                endTime: new Date(editFormData.endTime).toISOString(),
                serviceDescription: editFormData.serviceDescription,
            });
            toast.success('Updated'); setShowEditModal(false); fetchReservations();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
    };

    const submitPayment = async () => {
        if (!selectedReservation) return;
        // For non-cash payments, require a real transaction reference
        if (paymentMethod !== 'cash') {
            const ref = transactionRef.trim();
            if (!ref) {
                toast.error('Please enter the transaction reference number from your payment app.');
                return;
            }
            // Validate: must be at least 6 chars and alphanumeric
            if (ref.length < 6) {
                toast.error('Transaction reference must be at least 6 characters.');
                return;
            }
            if (!/^[A-Za-z0-9\-\/]+$/.test(ref)) {
                toast.error('Transaction reference can only contain letters, numbers, hyphens, or slashes.');
                return;
            }
        }
        setPaymentLoading(true);
        try {
            const depositPaid = selectedReservation.depositPaid ? (selectedReservation.depositAmount || 0) : 0;
            const remainingAmount = selectedReservation.totalPrice - depositPaid;

            const init = await api.post('/payments/initiate', {
                reservationId: selectedReservation._id || selectedReservation.id,
                amount: remainingAmount,
                paymentMethod,
                ...(paymentMethod !== 'cash' && { transactionRef: transactionRef.trim() }),
            });
            const paymentId = init.data.data._id;
            if (paymentMethod === 'cash') {
                await api.post('/payments/verify', { paymentId, status: 'success' });
                toast.success('Payment confirmed! Pay cash at the garage.');
            } else {
                toast.success(`Payment recorded with ref: ${transactionRef.trim()}. The garage will verify your transfer.`);
            }
            setShowPaymentModal(false); setSelectedReservation(null);
            setPaymentMethod('cash'); setPaymentInfo(null); setTransactionRef('');
            fetchReservations();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Payment failed'); }
        finally { setPaymentLoading(false); }
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false); setSelectedReservation(null);
        setPaymentMethod('cash'); setPaymentInfo(null); setTransactionRef('');
    };

    const stats = [
        { label: t('common.status') + ' ' + t('reservation.myReservations').split(' ')[0], value: reservations.length, color: 'from-indigo-500 to-indigo-600', icon: '' },
        { label: t('reservation.status.pending'), value: reservations.filter(r => r.status === 'pending').length, color: 'from-amber-400 to-amber-500', icon: '' },
        { label: t('reservation.status.active'), value: reservations.filter(r => ['active', 'confirmed'].includes(r.status)).length, color: 'from-emerald-500 to-emerald-600', icon: '' },
        { label: t('reservation.status.completed'), value: reservations.filter(r => r.status === 'completed').length, color: 'from-sky-500 to-blue-600', icon: '' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center"><Loader size="lg" /><p className="mt-4 text-slate-500">Loading reservations…</p></div>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 40%, #f5f3ff 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{t('reservation.myReservations')}</h1>
                        <p className="text-slate-500 mt-1">{t('dashboard.manageBookings')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/find-garage')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span className="text-lg">+</span> {t('reservation.bookService')}
                        </button>
                        <button
                            onClick={() => { fetchReservations(); toast.success('Refreshed'); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm transition-all duration-200"
                        >
                            {t('common.refresh')}
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">{error}</div>
                ) : reservations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
                        <div className="text-6xl mb-4"></div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Reservations Yet</h3>
                        <p className="text-slate-500 mb-6">Find a garage and book your first service.</p>
                        <button onClick={() => navigate('/find-garage')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">Find a Garage</button>
                    </div>
                ) : (
                    <>
                        {/* ── Stat Cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map(s => (
                                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl">{s.icon}</span>
                                        <span className="text-3xl font-bold">{s.value}</span>
                                    </div>
                                    <p className="text-white/80 text-sm font-medium">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Reservation Cards ── */}
                        <div className="space-y-4">
                            {reservations.map(res => {
                                const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending;
                                return (
                                    <div key={res.id || res._id}
                                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${cfg.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}>
                                        <div className="p-6">
                                            {/* Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-xl"></div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{res.garage.name}</h3>
                                                        <p className="text-slate-500 text-sm">{res.vehicle.plateNumber ? `• ${res.vehicle.plateNumber}` : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                        {cfg.icon} {t(cfg.label)}
                                                    </span>
                                                    {res.paymentStatus === 'paid' && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                            Paid
                                                        </span>
                                                    )}
                                                    {res.status === 'pending' && res.depositAmount && res.depositAmount > 0 && !res.depositPaid && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                            ⚠ {t('reservation.depositRequired')}
                                                        </span>
                                                    )}
                                                    {res.depositPaid && res.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                            {t('reservation.depositPaid')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                                                {[
                                                    { label: t('reservation.service'), value: res.serviceType || 'General Service', icon: '' },
                                                    { label: t('reservation.totalPrice'), value: `${res.totalPrice.toLocaleString()} ETB`, icon: '' },
                                                    { label: t('reservation.startTime'), value: `${new Date(res.startTime).toLocaleDateString()} ${new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, icon: '' },
                                                    { label: t('reservation.endTime'), value: `${new Date(res.endTime).toLocaleDateString()} ${new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, icon: '' },
                                                ].map(d => (
                                                    <div key={d.label} className="bg-slate-50 rounded-xl p-3">
                                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">{d.icon} {d.label}</p>
                                                        <p className="font-semibold text-slate-700 text-sm">{d.value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Deposit Banner */}
                                            {res.depositAmount && res.depositAmount > 0 && (
                                                <div className={`rounded-xl p-3 mb-4 flex items-center justify-between text-sm ${res.depositPaid ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-200'}`}>
                                                    <div>
                                                        <p className={`font-semibold ${res.depositPaid ? 'text-blue-700' : 'text-orange-700'}`}>
                                                            {res.depositPaid ? `✓ ${t('reservation.depositPaid')}` : `⚠ ${t('reservation.depositRequired')}`}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {res.depositPaid
                                                                ? `${res.depositAmount.toLocaleString()} ETB will be deducted from final payment`
                                                                : `Pay ${res.depositAmount.toLocaleString()} ETB deposit to confirm your slot`}
                                                        </p>
                                                    </div>
                                                    <span className={`font-bold text-base ${res.depositPaid ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {res.depositAmount.toLocaleString()} ETB
                                                    </span>
                                                </div>
                                            )}

                                            {/* Service Description */}
                                            {res.serviceDescription && (
                                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-5 text-sm text-indigo-700">
                                                    {res.serviceDescription}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-2">
                                                {/* Price adjustment notification */}
                                                {res.adjustedPriceStatus === 'pending' && res.adjustedPrice && (
                                                    <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                        <p className="text-sm font-bold text-amber-800 mb-1">⚠️ Price Adjustment Requested</p>
                                                        <p className="text-xs text-amber-700 mb-1">
                                                            New price: <strong>{res.adjustedPrice.toLocaleString()} ETB</strong>
                                                            {' '}(was {res.totalPrice.toLocaleString()} ETB)
                                                        </p>
                                                        {res.adjustedPriceReason && (
                                                            <p className="text-xs text-amber-600 mb-2">Reason: {res.adjustedPriceReason}</p>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleRespondPrice(res._id, 'accepted')}
                                                                className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition">
                                                                ✅ Accept
                                                            </button>
                                                            <button onClick={() => handleRespondPrice(res._id, 'rejected')}
                                                                className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition">
                                                                ❌ Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {res.adjustedPriceStatus === 'accepted' && (
                                                    <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold">
                                                        ✅ Price adjustment accepted — new total: {res.adjustedPrice?.toLocaleString()} ETB
                                                    </div>
                                                )}
                                                {/* Refund pending notice */}
                                                {res.status === 'cancelled' && res.depositPaid && (
                                                    <div className="w-full px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
                                                        🔄 Your deposit of {(res.depositAmount ?? 0).toLocaleString()} ETB is being refunded. Admin will process within 3-5 business days.
                                                    </div>
                                                )}
                                                {/* Pay Deposit — for pending reservations */}
                                                {res.status === 'pending' && (res.depositAmount ?? 0) > 0 && !res.depositPaid && (
                                                    <button onClick={() => handlePayDeposit(res)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-sm font-semibold rounded-xl shadow hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200">
                                                        💳 Pay Deposit ({(res.depositAmount ?? 0).toLocaleString()} ETB)
                                                    </button>
                                                )}
                                                {/* Pay remaining balance — only after service is COMPLETED */}
                                                {res.status === 'completed' && res.paymentStatus !== 'paid' && (
                                                    <>
                                                        <button onClick={() => handlePayRemaining(res)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white text-sm font-semibold rounded-xl shadow hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200">
                                                            🔒 Pay Remaining ({((res.totalPrice || 0) - (res.depositPaid ? (res.depositAmount || 0) : 0)).toLocaleString()} ETB)
                                                        </button>
                                                        <button onClick={() => handleVerifyPayment(res._id)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-all duration-200">
                                                            🔄 Already Paid? Verify
                                                        </button>
                                                    </>
                                                )}
                                                {/* Verify deposit if pending and deposit not confirmed */}
                                                {res.status === 'pending' && !res.depositPaid && (res.depositAmount ?? 0) > 0 && (
                                                    <button onClick={() => handleVerifyPayment(res._id)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-all duration-200">
                                                        🔄 Already Paid? Verify
                                                    </button>
                                                )}
                                                {res.status === 'completed' && res.paymentStatus === 'paid' && (
                                                    <button onClick={() => handlePayment(res)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all duration-200">
                                                        {t('reservation.viewReceipt')}
                                                    </button>
                                                )}
                                                {res.status === 'completed' && !reviewedIds.has(res._id || res.id!) && (
                                                    <button onClick={() => handleLeaveReview(res)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-100 hover:-translate-y-0.5 transition-all duration-200">
                                                        ⭐ {t('reservation.leaveReview')}
                                                    </button>
                                                )}
                                                {res.status === 'completed' && reviewedIds.has(res._id || res.id!) && (
                                                    <span className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl">
                                                        ✓ {t('reservation.leaveReview')}
                                                    </span>
                                                )}
                                                {res.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleEdit(res)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
                                                            {t('common.edit')}
                                                        </button>
                                                        <button onClick={() => handleCancel(res.id || res._id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-100 hover:-translate-y-0.5 transition-all duration-200">
                                                            ✕ {t('reservation.cancel')}
                                                        </button>
                                                        <button onClick={() => handleDelete(res.id || res._id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 hover:-translate-y-0.5 transition-all duration-200">
                                                            {t('common.delete')}
                                                        </button>
                                                    </>
                                                )}
                                                {['confirmed', 'active', 'completed'].includes(res.status) && (
                                                    <button onClick={() => navigate('/disputes')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-xl hover:bg-orange-100 hover:-translate-y-0.5 transition-all duration-200">
                                                        {t('nav.disputes')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ══════════════════════════════════════
                PAYMENT MODAL
            ══════════════════════════════════════ */}
            {showPaymentModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{paymentInfo ? 'Payment Receipt' : 'Complete Payment'}</h3>
                                    <p className="text-indigo-200 text-sm mt-0.5">{selectedReservation.garage.name}</p>
                                </div>
                                <button onClick={closePaymentModal} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* ── HOW TO PAY — Clear instruction ── */}
                            {!paymentInfo && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm font-bold text-blue-800 mb-2">💡 How Payment Works</p>
                                    <div className="text-xs text-blue-700 space-y-1">
                                        <p>1. Select payment method below</p>
                                        <p>2. Send money to the <strong>garage owner's account</strong> shown</p>
                                        <p>3. Enter the transaction reference number</p>
                                        <p>4. Garage owner confirms receipt → car can leave</p>
                                    </div>
                                </div>
                            )}

                            {/* Amount Banner */}
                            {(() => {
                                const depositPaid = selectedReservation.depositPaid ? (selectedReservation.depositAmount || 0) : 0;
                                const remaining = selectedReservation.totalPrice - depositPaid;
                                return (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm text-slate-500">Service</p>
                                                <p className="font-semibold text-slate-700">{selectedReservation.serviceType || 'General Service'}</p>
                                                <p className="text-xs text-slate-400 mt-1">{new Date(selectedReservation.startTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">Remaining Balance</p>
                                                <p className="text-3xl font-bold text-emerald-600">{remaining.toLocaleString()}</p>
                                                <p className="text-sm text-emerald-500 font-medium">ETB</p>
                                            </div>
                                        </div>
                                        {depositPaid > 0 && (
                                            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-emerald-100">
                                                <span>Total price: {selectedReservation.totalPrice.toLocaleString()} ETB</span>
                                                <span className="text-blue-600">Deposit paid: -{depositPaid.toLocaleString()} ETB</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {paymentInfo ? (
                                /* ── Receipt View ── */
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className={`rounded-xl p-4 flex items-center gap-3 ${paymentInfo.status === 'success' && paymentInfo.isVerified ? 'bg-emerald-50 border border-emerald-200' :
                                        paymentInfo.status === 'success' ? 'bg-amber-50 border border-amber-200' :
                                            'bg-slate-50 border border-slate-200'
                                        }`}>
                                        <span className="text-2xl">
                                            {paymentInfo.status === 'success' && paymentInfo.isVerified ? '' :
                                                paymentInfo.status === 'success' ? '' : ''}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                {paymentInfo.status === 'success' && paymentInfo.isVerified ? 'Payment Verified' :
                                                    paymentInfo.status === 'success' ? 'Payment Submitted — Awaiting Verification' :
                                                        `Status: ${paymentInfo.status}`}
                                            </p>
                                            {paymentInfo.verifiedAt && (
                                                <p className="text-xs text-slate-500">Verified {new Date(paymentInfo.verifiedAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transaction Details */}
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Transaction Details</h4>
                                        {[
                                            { label: 'Transaction ID', value: paymentInfo.transactionId, mono: true },
                                            { label: 'Payment Method', value: paymentInfo.paymentMethod },
                                            { label: 'Amount', value: `${paymentInfo.amount?.toLocaleString()} ETB` },
                                            ...(paymentInfo.paymentDate ? [{ label: 'Payment Date', value: new Date(paymentInfo.paymentDate).toLocaleString() }] : []),
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">{row.label}</span>
                                                <span className={`font-medium text-slate-700 ${(row as any).mono ? 'font-mono text-xs' : ''}`}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Commission Breakdown */}
                                    {(paymentInfo.effectiveCommissionRate != null || paymentInfo.commissionRate != null) && (() => {
                                        const rate = paymentInfo.effectiveCommissionRate ?? paymentInfo.commissionRate ?? 0;
                                        const comm = paymentInfo.effectiveCommissionAmount ?? paymentInfo.commissionAmount ?? 0;
                                        const earn = paymentInfo.effectiveGarageEarnings ?? paymentInfo.garageEarnings ?? paymentInfo.amount ?? 0;
                                        return (
                                            <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                                                <h4 className="font-semibold text-indigo-700 text-sm uppercase tracking-wide">Breakdown</h4>
                                                <div className="flex justify-between text-sm"><span className="text-slate-500">Platform fee ({(rate * 100).toFixed(1)}%)</span><span className="font-medium text-slate-700">{comm.toFixed(2)} ETB</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-slate-500">Garage earnings</span><span className="font-semibold text-emerald-600">{earn.toFixed(2)} ETB</span></div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => fetchPaymentInfo(selectedReservation._id).then(setPaymentInfo)}
                                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                                            Refresh
                                        </button>
                                        <button onClick={closePaymentModal}
                                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Payment Form ── */
                                <div className="space-y-4">
                                    {(() => {
                                        const remainingAmt = (selectedReservation.totalPrice || 0) - (selectedReservation.depositPaid ? (selectedReservation.depositAmount || 0) : 0);
                                        return (
                                            <>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-600 mb-3">Select Payment Method</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { id: 'cash', label: 'Cash', icon: '', desc: 'Pay at garage', color: 'amber' },
                                                            { id: 'bank_transfer_cbe', label: 'CBE', icon: '', desc: 'Commercial Bank', color: 'blue' },
                                                            { id: 'bank_transfer_abyssinia', label: 'Abyssinia', icon: '', desc: 'Abyssinia Bank', color: 'purple' },
                                                            { id: 'telebirr', label: 'Telebirr', icon: '', desc: 'Mobile money', color: 'green' },
                                                        ].map(m => (
                                                            <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                                                                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${paymentMethod === m.id
                                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]'
                                                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                                                <div className="text-2xl mb-1">{m.icon}</div>
                                                                <p className="font-bold text-slate-700 text-sm">{m.label}</p>
                                                                <p className="text-xs text-slate-400">{m.desc}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ── CASH ── */}
                                                {paymentMethod === 'cash' && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                                        <p className="font-bold text-amber-700 flex items-center gap-2">Cash Payment Instructions</p>
                                                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                                                            <li>Confirm your reservation below</li>
                                                            <li>Go to the garage at your scheduled time</li>
                                                            <li>Pay <strong>{remainingAmt.toLocaleString()} ETB</strong> in cash to the garage staff</li>
                                                            <li>Ask for a receipt</li>
                                                        </ol>
                                                    </div>
                                                )}

                                                {/* ── CBE ── */}
                                                {paymentMethod === 'bank_transfer_cbe' && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                                        <p className="font-bold text-blue-700 flex items-center gap-2">CBE Bank Transfer Instructions</p>
                                                        {selectedReservation.garage.bankAccounts?.cbe?.accountNumber ? (
                                                            <>
                                                                <div className="bg-white rounded-lg p-3 border border-blue-100 space-y-2 text-sm">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-slate-500">Account Number</span>
                                                                        <span className="font-mono font-bold text-blue-800 text-base">{selectedReservation.garage.bankAccounts.cbe.accountNumber}</span>
                                                                    </div>
                                                                    {selectedReservation.garage.bankAccounts.cbe.accountName && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500">Account Name</span>
                                                                            <span className="font-semibold text-slate-700">{selectedReservation.garage.bankAccounts.cbe.accountName}</span>
                                                                        </div>
                                                                    )}
                                                                    {selectedReservation.garage.bankAccounts.cbe.branch && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500">Branch</span>
                                                                            <span className="font-semibold text-slate-700">{selectedReservation.garage.bankAccounts.cbe.branch}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center border-t pt-2">
                                                                        <span className="text-slate-500">Amount to Send</span>
                                                                        <span className="font-bold text-emerald-600 text-base">{remainingAmt.toLocaleString()} ETB</span>
                                                                    </div>
                                                                </div>
                                                                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                                                    <li>Open CBE Birr app or visit any CBE branch</li>
                                                                    <li>Transfer <strong>{remainingAmt.toLocaleString()} ETB</strong> to the account above</li>
                                                                    <li>Use your name as the transfer description</li>
                                                                    <li>Click "Confirm Payment" below after sending</li>
                                                                </ol>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-blue-600">This garage has not provided CBE account details. Please choose another method.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── ABYSSINIA ── */}
                                                {paymentMethod === 'bank_transfer_abyssinia' && (
                                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                                                        <p className="font-bold text-purple-700 flex items-center gap-2">Abyssinia Bank Transfer Instructions</p>
                                                        {selectedReservation.garage.bankAccounts?.abyssinia?.accountNumber ? (
                                                            <>
                                                                <div className="bg-white rounded-lg p-3 border border-purple-100 space-y-2 text-sm">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-slate-500">Account Number</span>
                                                                        <span className="font-mono font-bold text-purple-800 text-base">{selectedReservation.garage.bankAccounts.abyssinia.accountNumber}</span>
                                                                    </div>
                                                                    {selectedReservation.garage.bankAccounts.abyssinia.accountName && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500">Account Name</span>
                                                                            <span className="font-semibold text-slate-700">{selectedReservation.garage.bankAccounts.abyssinia.accountName}</span>
                                                                        </div>
                                                                    )}
                                                                    {selectedReservation.garage.bankAccounts.abyssinia.branch && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500">Branch</span>
                                                                            <span className="font-semibold text-slate-700">{selectedReservation.garage.bankAccounts.abyssinia.branch}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center border-t pt-2">
                                                                        <span className="text-slate-500">Amount to Send</span>
                                                                        <span className="font-bold text-emerald-600 text-base">{remainingAmt.toLocaleString()} ETB</span>
                                                                    </div>
                                                                </div>
                                                                <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                                                                    <li>Open Abyssinia Bank app or visit any branch</li>
                                                                    <li>Transfer <strong>{remainingAmt.toLocaleString()} ETB</strong> to the account above</li>
                                                                    <li>Use your name as the transfer description</li>
                                                                    <li>Click "Confirm Payment" below after sending</li>
                                                                </ol>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-purple-600">This garage has not provided Abyssinia account details. Please choose another method.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── TELEBIRR ── */}
                                                {paymentMethod === 'telebirr' && (
                                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                                                        <p className="font-bold text-green-700 flex items-center gap-2">Telebirr Payment Instructions</p>
                                                        {selectedReservation.garage.bankAccounts?.telebirr?.phoneNumber ? (
                                                            <>
                                                                <div className="bg-white rounded-lg p-3 border border-green-100 space-y-2 text-sm">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-slate-500">Telebirr Number</span>
                                                                        <span className="font-mono font-bold text-green-800 text-xl tracking-wider">{selectedReservation.garage.bankAccounts.telebirr.phoneNumber}</span>
                                                                    </div>
                                                                    {selectedReservation.garage.bankAccounts.telebirr.accountName && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500">Account Name</span>
                                                                            <span className="font-semibold text-slate-700">{selectedReservation.garage.bankAccounts.telebirr.accountName}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center border-t pt-2">
                                                                        <span className="text-slate-500">Amount to Send</span>
                                                                        <span className="font-bold text-emerald-600 text-base">{remainingAmt.toLocaleString()} ETB</span>
                                                                    </div>
                                                                </div>
                                                                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                                                                    <li>Open the <strong>Telebirr</strong> app on your phone</li>
                                                                    <li>Tap <strong>"Send Money"</strong></li>
                                                                    <li>Enter the number: <strong>{selectedReservation.garage.bankAccounts.telebirr.phoneNumber}</strong></li>
                                                                    <li>Enter amount: <strong>{remainingAmt.toLocaleString()} ETB</strong></li>
                                                                    <li>Confirm and send</li>
                                                                    <li>Click "Confirm Payment" below after sending</li>
                                                                </ol>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-green-600">This garage has not provided a Telebirr number. Please choose another method.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    {/* Transaction reference input for non-cash payments */}
                                    {paymentMethod !== 'cash' && (
                                        <div className="bg-slate-50 border-2 border-indigo-200 rounded-xl p-4">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                                Transaction Reference Number <span className="text-red-500">*</span>
                                            </label>
                                            <p className="text-xs text-slate-500 mb-2">
                                                Enter the exact reference/transaction ID generated by {paymentMethod === 'telebirr' ? 'Telebirr' : paymentMethod === 'cbe_birr' ? 'CBE Birr' : 'your bank'} after sending the payment.
                                            </p>
                                            <input
                                                type="text"
                                                value={transactionRef}
                                                onChange={e => setTransactionRef(e.target.value.toUpperCase())}
                                                placeholder={paymentMethod === 'telebirr' ? 'e.g. TXN123456789' : 'e.g. FT2504160001'}
                                                className={`w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 transition ${transactionRef.length > 0 && transactionRef.length < 6 ? 'border-red-400 focus:ring-red-300 bg-red-50' : transactionRef.length >= 6 ? 'border-emerald-400 focus:ring-emerald-300 bg-emerald-50' : 'border-slate-200 focus:ring-indigo-300'}`}
                                            />
                                            {transactionRef.length > 0 && transactionRef.length < 6 && (
                                                <p className="text-xs text-red-500 mt-1">⚠ Reference must be at least 6 characters</p>
                                            )}
                                            {transactionRef.length >= 6 && (
                                                <p className="text-xs text-emerald-600 mt-1">✓ Reference looks valid</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={closePaymentModal}
                                            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">
                                            Cancel
                                        </button>
                                        <button onClick={submitPayment} disabled={paymentLoading}
                                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-200 disabled:opacity-60 transition-all duration-200">
                                            {paymentLoading ? 'Processing…' : `Confirm Payment — ${((selectedReservation.totalPrice || 0) - (selectedReservation.depositPaid ? (selectedReservation.depositAmount || 0) : 0)).toLocaleString()} ETB`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                DEPOSIT PAYMENT MODAL
            ══════════════════════════════════════ */}
            {showDepositModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-2xl p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">💳 Pay Deposit</h3>
                                    <p className="text-orange-100 text-sm mt-0.5">{selectedReservation.garage.name}</p>
                                </div>
                                <button onClick={() => { setShowDepositModal(false); setSelectedReservation(null); setDepositTransactionRef(''); }}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">✕</button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">

                            {/* Amount */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-orange-700">
                                        Deposit ({selectedReservation.totalPrice > 0 ? Math.round(((selectedReservation.depositAmount || 0) / selectedReservation.totalPrice) * 100) : 0}%)
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Remaining {((selectedReservation.totalPrice || 0) - (selectedReservation.depositAmount || 0)).toLocaleString()} ETB paid on arrival
                                    </p>
                                </div>
                                <span className="text-2xl font-black text-orange-600">{selectedReservation.depositAmount?.toLocaleString()} ETB</span>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm font-bold text-blue-800 mb-2">📋 How to Pay</p>
                                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                    <li>Choose a payment method below</li>
                                    <li>Send <strong>{selectedReservation.depositAmount?.toLocaleString()} ETB</strong> to the <strong>Smart Garaging platform account</strong> shown</li>
                                    <li>Copy the transaction reference from your payment app</li>
                                    <li>Enter it below and click "Confirm"</li>
                                    <li>System verifies and notifies the garage owner</li>
                                </ol>
                            </div>

                            {/* Platform payment accounts */}
                            {depositPaymentMethod === 'telebirr' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-green-700 mb-2">📱 Send to Smart Garaging Telebirr</p>
                                    {selectedReservation.garage.bankAccounts?.telebirr?.phoneNumber ? (
                                        <>
                                            <p className="font-mono font-bold text-slate-800 text-xl">{selectedReservation.garage.bankAccounts.telebirr.phoneNumber}</p>
                                            <p className="text-xs text-slate-500 mt-1">Account: {selectedReservation.garage.bankAccounts.telebirr.accountName || 'Smart Garaging'}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-500">Contact admin for Telebirr account details</p>
                                    )}
                                    <p className="text-xs text-amber-600 mt-2 font-semibold">Amount: {selectedReservation.depositAmount?.toLocaleString()} ETB</p>
                                </div>
                            )}
                            {depositPaymentMethod === 'cbe_birr' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-blue-700 mb-2">🏦 Send to Smart Garaging CBE Account</p>
                                    {selectedReservation.garage.bankAccounts?.cbe?.accountNumber ? (
                                        <>
                                            <p className="font-mono font-bold text-slate-800 text-lg">{selectedReservation.garage.bankAccounts.cbe.accountNumber}</p>
                                            <p className="text-xs text-slate-500 mt-1">Account: {selectedReservation.garage.bankAccounts.cbe.accountName || 'Smart Garaging'}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-500">Contact admin for CBE account details</p>
                                    )}
                                    <p className="text-xs text-amber-600 mt-2 font-semibold">Amount: {selectedReservation.depositAmount?.toLocaleString()} ETB</p>
                                </div>
                            )}
                            {depositPaymentMethod === 'bank_transfer_abyssinia' && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-purple-700 mb-2">🏛️ Send to Smart Garaging Abyssinia Account</p>
                                    {selectedReservation.garage.bankAccounts?.abyssinia?.accountNumber ? (
                                        <>
                                            <p className="font-mono font-bold text-slate-800 text-lg">{selectedReservation.garage.bankAccounts.abyssinia.accountNumber}</p>
                                            <p className="text-xs text-slate-500 mt-1">Account: {selectedReservation.garage.bankAccounts.abyssinia.accountName || 'Smart Garaging'}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-500">Contact admin for Abyssinia account details</p>
                                    )}
                                    <p className="text-xs text-amber-600 mt-2 font-semibold">Amount: {selectedReservation.depositAmount?.toLocaleString()} ETB</p>
                                </div>
                            )}
                            {depositPaymentMethod === 'cash' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-amber-700 mb-1">💵 Cash Payment</p>
                                    <p className="text-xs text-amber-600">Pay {selectedReservation.depositAmount?.toLocaleString()} ETB cash directly at the garage when you arrive. The garage owner will confirm receipt.</p>
                                </div>
                            )}

                            {/* Payment method */}
                            <div>
                                <p className="text-sm font-semibold text-slate-600 mb-3">Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'cash', label: 'Cash', icon: '💵', desc: 'Pay at garage' },
                                        { id: 'telebirr', label: 'Telebirr', icon: '📱', desc: 'Mobile money' },
                                        { id: 'cbe_birr', label: 'CBE Birr', icon: '🏦', desc: 'CBE Bank' },
                                        { id: 'bank_transfer_abyssinia', label: 'Abyssinia', icon: '🏛️', desc: 'Abyssinia Bank' },
                                    ].map(m => (
                                        <button key={m.id} onClick={() => setDepositPaymentMethod(m.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${depositPaymentMethod === m.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
                                            <div className="text-xl mb-0.5">{m.icon}</div>
                                            <p className="font-bold text-slate-700 text-sm">{m.label}</p>
                                            <p className="text-xs text-slate-400">{m.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Transaction ref for non-cash */}
                            {depositPaymentMethod !== 'cash' && (
                                <div className="bg-slate-50 border-2 border-orange-200 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Transaction Reference <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        After sending via {depositPaymentMethod === 'telebirr' ? 'Telebirr' : 'bank'}, enter the exact reference shown in your app.
                                    </p>
                                    <input
                                        type="text"
                                        value={depositTransactionRef}
                                        onChange={e => setDepositTransactionRef(e.target.value.toUpperCase())}
                                        placeholder={depositPaymentMethod === 'telebirr' ? 'e.g. TXN123456789' : 'e.g. FT2504160001'}
                                        className={`w-full border-2 rounded-xl px-4 py-3 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 transition ${depositTransactionRef.length > 0 && depositTransactionRef.length < 6 ? 'border-red-400 bg-red-50' : depositTransactionRef.length >= 6 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}
                                    />
                                    {depositTransactionRef.length > 0 && depositTransactionRef.length < 6 && (
                                        <p className="text-xs text-red-500 mt-1">⚠ Min 6 characters</p>
                                    )}
                                    {depositTransactionRef.length >= 6 && (
                                        <p className="text-xs text-emerald-600 mt-1">✓ Looks valid</p>
                                    )}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowDepositModal(false); setSelectedReservation(null); setDepositTransactionRef(''); }}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button onClick={submitDeposit} disabled={depositLoading}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-bold shadow disabled:opacity-60 transition-all">
                                    {depositLoading ? 'Processing…' : `Pay ${selectedReservation.depositAmount?.toLocaleString()} ETB`}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                REVIEW MODAL
            ══════════════════════════════════════ */}
            {showReviewModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Leave a Review</h3>
                                    <p className="text-amber-100 text-sm mt-0.5">{selectedReservation.garage.name}</p>
                                </div>
                                <button onClick={() => setShowReviewModal(false)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">✕</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Star Rating */}
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-600 mb-3">How was your experience?</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setReviewRating(star)}
                                            className={`text-4xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400' : 'text-slate-200'}`}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                                {reviewRating > 0 && (
                                    <p className="text-sm text-slate-500 mt-2">
                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                                    </p>
                                )}
                            </div>
                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Comment <span className="text-slate-400 font-normal">(optional)</span></label>
                                <textarea rows={3} value={reviewComment}
                                    onChange={e => setReviewComment(e.target.value)}
                                    placeholder="Share your experience with this garage..."
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowReviewModal(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button onClick={submitReview} disabled={reviewLoading || reviewRating === 0}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-semibold shadow disabled:opacity-50 transition-all duration-200">
                                    {reviewLoading ? 'Submitting…' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* ══════════════════════════════════════
                EDIT MODAL
            ══════════════════════════════════════ */}
            {
                showEditModal && selectedReservation && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Edit Reservation</h3>
                                    <button onClick={() => { setShowEditModal(false); setSelectedReservation(null); }}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">✕</button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">Start Time</label>
                                    <input type="datetime-local" value={editFormData.startTime}
                                        onChange={e => setEditFormData(p => ({ ...p, startTime: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">End Time</label>
                                    <input type="datetime-local" value={editFormData.endTime}
                                        onChange={e => setEditFormData(p => ({ ...p, endTime: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">Service Description</label>
                                    <textarea rows={3} value={editFormData.serviceDescription}
                                        onChange={e => setEditFormData(p => ({ ...p, serviceDescription: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => { setShowEditModal(false); setSelectedReservation(null); }}
                                        className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">
                                        Cancel
                                    </button>
                                    <button onClick={submitEdit}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-purple-500 transition">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
