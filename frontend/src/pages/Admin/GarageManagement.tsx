// src/pages/Admin/GarageManagement.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    User,
    Calendar,
    DollarSign,
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle,
    Eye,
    TrendingUp
} from 'lucide-react';

interface GarageOwner {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface Reservation {
    _id: string;
    user: {
        _id: string;
        name: string;
        phone?: string;
    };
    startTime: string;
    endTime: string;
    serviceType: string;
    totalPrice: number;
    status: string;
}

interface Garage {
    _id: string;
    name: string;
    location?: {
        address?: string;
        coordinates: [number, number];
    };
    city?: string;
    phone?: string;
    owner: GarageOwner;
    totalSlots?: number;
    availableSlots?: number;
    capacity?: number;
    pricePerHour: number;
    status: string;
    verificationStatus?: string;
    createdAt: string;
    reservationCount?: number;
    totalRevenue?: number;
}

interface GarageDetails extends Garage {
    reservations: Reservation[];
    uniqueCustomers: number;
}

export default function GarageManagement() {
    const { t } = useTranslation();
    const [garages, setGarages] = useState<Garage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGarage, setSelectedGarage] = useState<GarageDetails | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchGarages();
    }, []);

    // Silent background refresh every 30s
    useEffect(() => {
        const interval = setInterval(() => fetchGarages(false), 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchGarages = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const response = await api.get('/garages');
            const garagesData = response.data.data || [];
            setGarages(garagesData.map((garage: Garage) => ({
                ...garage,
                reservationCount: 0,
                totalRevenue: 0,
            })));
        } catch (err: any) {
            console.error('Failed to fetch garages:', err);
            if (showLoader) toast.error('Failed to load garages');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const fetchGarageDetails = async (garageId: string) => {
        try {
            const [garageResponse, reservationsResponse] = await Promise.all([
                api.get(`/garages/${garageId}`),
                api.get(`/admin/garages/${garageId}/reservations`)
            ]);

            const garage = garageResponse.data.data;
            const reservations = reservationsResponse.data.data || [];

            // Calculate unique customers
            const uniqueCustomerIds = new Set(reservations.map((r: Reservation) => r.user._id));

            setSelectedGarage({
                ...garage,
                reservations,
                uniqueCustomers: uniqueCustomerIds.size,
            });
        } catch (err: any) {
            console.error('Failed to fetch garage details:', err);
            toast.error('Failed to load garage details');
        }
    };

    const handleViewDetails = async (garage: Garage) => {
        setShowDetailsModal(true);
        await fetchGarageDetails(garage._id);
    };

    const handleApprove = async (garageId: string) => {
        if (!confirm('Approve this garage?')) return;
        try {
            await api.patch(`/admin/garages/${garageId}/approve`);
            toast.success('Garage approved!');
            setShowDetailsModal(false);
            setSelectedGarage(null);
            fetchGarages();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve garage');
        }
    };

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleReject = async () => {
        if (!selectedGarage || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        try {
            await api.patch(`/admin/garages/${selectedGarage._id}/reject`, { reason: rejectionReason });
            toast.success('Garage rejected');
            setShowRejectModal(false);
            setShowDetailsModal(false);
            setSelectedGarage(null);
            setRejectionReason('');
            fetchGarages();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject garage');
        }
    };

    const handleDelete = async (garageId: string) => {
        if (!confirm('Move this garage to trash?')) return;
        try {
            await api.delete(`/admin/garages/${garageId}`);
            toast.success('Garage moved to trash');
            setShowDetailsModal(false);
            setSelectedGarage(null);
            fetchGarages();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete garage');
        }
    };


    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[status] || colors.pending;
    };

    const filteredGarages = garages.filter(garage => {
        const matchesSearch = garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (garage.location?.address && garage.location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (garage.city && garage.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (garage.owner?.name && garage.owner.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || garage.verificationStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate totals
    const stats = {
        total: garages.length,
        approved: garages.filter(g => g.verificationStatus === 'approved').length,
        pending: garages.filter(g => g.verificationStatus === 'pending').length,
        totalReservations: garages.reduce((sum, g) => sum + (g.reservationCount || 0), 0),
        totalRevenue: garages.reduce((sum, g) => sum + (g.totalRevenue || 0), 0),
    };

    return (
        <div className="p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('garageManagement.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('garageManagement.subtitle')}
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-purple-700">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90 mb-1">{t('garageManagement.totalGarages')}</p>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-emerald-700">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90 mb-1">{t('garageManagement.approved')}</p>
                        <p className="text-3xl font-bold">{stats.approved}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-yellow-700">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">{t('garageManagement.new')}</span>
                        </div>
                        <p className="text-xs opacity-90 mb-1">{t('garageManagement.pending')}</p>
                        <p className="text-3xl font-bold">{stats.pending}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-blue-700">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90 mb-1">{t('garageManagement.totalBookings')}</p>
                        <p className="text-3xl font-bold">{stats.totalReservations}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-indigo-700">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-4 h-4 opacity-70" />
                        </div>
                        <p className="text-xs opacity-90 mb-1">{t('garageManagement.totalRevenue')}</p>
                        <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ETB</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder={t('garageManagement.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
                <div className="flex gap-2">
                    {['all', 'approved', 'pending', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${statusFilter === status
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {status === 'all' ? t('garageManagement.all') :
                                status === 'approved' ? t('garageManagement.approved') :
                                    status === 'pending' ? t('garageManagement.pending') :
                                        t('garageManagement.rejected')}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : filteredGarages.length === 0 ? (
                <Alert variant="info">{t('garageManagement.noGarages')}</Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredGarages.map((garage) => (
                        <div
                            key={garage._id}
                            className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Building2 className="w-5 h-5 text-purple-600" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {garage.name}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(garage.verificationStatus || 'pending')}`}>
                                                {garage.verificationStatus || 'pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <MapPin className="w-4 h-4" />
                                            {garage.location?.address || 'Address not provided'}
                                            {garage.city && `, ${garage.city}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Garage Owner Info */}
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-emerald-600" />
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {t('garageManagement.owner')}: {garage.owner?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    {garage.owner?.email && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Mail className="w-3 h-3" />
                                            {garage.owner.email}
                                        </div>
                                    )}
                                    {garage.owner?.phone && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Phone className="w-3 h-3" />
                                            {garage.owner.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('garageManagement.reservations')}</p>
                                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {garage.reservationCount || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('garageManagement.revenue')}</p>
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                            {(garage.totalRevenue || 0).toLocaleString()} ETB
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('garageManagement.availableSlots')}</p>
                                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                            {garage.availableSlots || 0}/{garage.capacity || garage.totalSlots || 0}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewDetails(garage)}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    {t('garageManagement.viewDetails')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Garage Details Modal ── */}
            {showDetailsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl p-6 text-white sticky top-0 z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedGarage?.name || 'Loading...'}</h3>
                                    <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {selectedGarage?.location?.address || 'No address'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedGarage && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedGarage.verificationStatus || 'pending')}`}>
                                            {selectedGarage.verificationStatus || 'pending'}
                                        </span>
                                    )}
                                    <button onClick={() => { setShowDetailsModal(false); setSelectedGarage(null); }}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">✕</button>
                                </div>
                            </div>
                        </div>

                        {!selectedGarage ? (
                            <div className="flex justify-center py-16"><Loader size="lg" /></div>
                        ) : (
                            <div className="p-6 space-y-6">

                                {/* Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: t('garageManagement.capacity') || 'Capacity', value: `${selectedGarage.capacity || selectedGarage.totalSlots || 0}`, color: 'bg-blue-50 text-blue-700' },
                                        { label: t('garageManagement.availableSlots') || 'Available', value: `${selectedGarage.availableSlots || 0}`, color: 'bg-emerald-50 text-emerald-700' },
                                        { label: t('garageManagement.customers'), value: `${selectedGarage.uniqueCustomers}`, color: 'bg-violet-50 text-violet-700' },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                                            <p className="text-xs opacity-60 mb-1">{s.label}</p>
                                            <p className="text-xl font-bold">{s.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                {(selectedGarage as any).description && (
                                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
                                        {(selectedGarage as any).description}
                                    </div>
                                )}

                                {/* Operating Hours + Amenities */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(selectedGarage as any).operatingHours?.start && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> {t('garageManagement.operatingHours')}
                                            </p>
                                            <p className="font-semibold text-amber-800">
                                                {(selectedGarage as any).operatingHours.start} – {(selectedGarage as any).operatingHours.end}
                                            </p>
                                        </div>
                                    )}
                                    {(selectedGarage as any).amenities?.length > 0 && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">{t('garageManagement.amenities')}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(selectedGarage as any).amenities.map((a: string) => (
                                                    <span key={a} className="bg-white text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                                                        {a.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Owner Info */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('garageManagement.ownerInfo')}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                            <div><p className="text-xs text-slate-400">{t('garageManagement.name')}</p><p className="font-semibold text-slate-800">{selectedGarage.owner?.name || '—'}</p></div>
                                        </div>
                                        {selectedGarage.owner?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <div><p className="text-xs text-slate-400">{t('garageManagement.email')}</p><p className="font-semibold text-slate-800 text-sm break-all">{selectedGarage.owner.email}</p></div>
                                            </div>
                                        )}
                                        {selectedGarage.owner?.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                <div><p className="text-xs text-slate-400">{t('garageManagement.phone')}</p><p className="font-semibold text-slate-800">{selectedGarage.owner.phone}</p></div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            <div><p className="text-xs text-slate-400">{t('garageManagement.registered')}</p><p className="font-semibold text-slate-800">{new Date(selectedGarage.createdAt).toLocaleDateString()}</p></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reservations */}
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        {t('garageManagement.customerReservations')} ({selectedGarage.reservations.length})
                                    </h4>
                                    {selectedGarage.reservations.length === 0 ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                                            <p className="text-4xl mb-2">📭</p>
                                            <p className="text-sm text-blue-600 font-medium">{t('garageManagement.noReservations')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                            {selectedGarage.reservations.map((r) => {
                                                const statusColors: Record<string, string> = {
                                                    confirmed: 'bg-blue-50 text-blue-700 border-l-blue-400',
                                                    completed: 'bg-emerald-50 text-emerald-700 border-l-emerald-400',
                                                    cancelled: 'bg-red-50 text-red-600 border-l-red-400',
                                                    pending: 'bg-amber-50 text-amber-700 border-l-amber-400',
                                                    active: 'bg-indigo-50 text-indigo-700 border-l-indigo-400',
                                                };
                                                const sc = statusColors[r.status] || statusColors.pending;
                                                return (
                                                    <div key={r._id} className={`bg-white rounded-xl border border-slate-100 border-l-4 ${sc} p-4 hover:shadow-sm transition-all`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-base">👤</div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 text-sm">{r.user.name}</p>
                                                                    {r.user.phone && <p className="text-xs text-slate-400">{r.user.phone}</p>}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${sc.split(' ').slice(0, 2).join(' ')}`}>
                                                                {r.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="bg-slate-50 rounded-lg p-2">
                                                                <p className="text-xs text-slate-400">{t('garageManagement.service')}</p>
                                                                <p className="font-medium text-slate-700 text-xs mt-0.5">{r.serviceType || 'General'}</p>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-lg p-2">
                                                                <p className="text-xs text-slate-400">{t('garageManagement.price')}</p>
                                                                <p className="font-medium text-slate-700 text-xs mt-0.5">{r.totalPrice} ETB</p>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-lg p-2">
                                                                <p className="text-xs text-slate-400">{t('garageManagement.date')}</p>
                                                                <p className="font-medium text-slate-700 text-xs mt-0.5">{new Date(r.startTime).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Actions for pending garages */}
                                {selectedGarage.verificationStatus === 'pending' && (
                                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                                        <button onClick={() => handleApprove(selectedGarage._id)}
                                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow hover:shadow-emerald-200 transition-all">
                                            ✅ {t('garageVerification.approve')}
                                        </button>
                                        <button onClick={() => setShowRejectModal(true)}
                                            className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition-all">
                                            ✕ {t('garageVerification.reject')}
                                        </button>
                                        <button onClick={() => handleDelete(selectedGarage._id)}
                                            className="py-3 px-4 bg-slate-800 text-red-400 border border-red-900/40 font-semibold rounded-xl hover:bg-red-950/40 transition-all">
                                            🗑
                                        </button>
                                    </div>
                                )}

                                {selectedGarage.verificationStatus !== 'pending' && (
                                    <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                                        <button onClick={() => handleDelete(selectedGarage._id)}
                                            className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition">
                                            🗑 {t('common.delete')}
                                        </button>
                                        <button onClick={() => { setShowDetailsModal(false); setSelectedGarage(null); }}
                                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">
                                            {t('common.close')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject reason modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('garageVerification.reject')}</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={t('garageVerification.rejectPlaceholder')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                            rows={4}
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">{rejectionReason.length}/500</div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {t('garageVerification.confirmReject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
