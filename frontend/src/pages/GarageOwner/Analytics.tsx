// src/pages/GarageOwner/Analytics.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    CheckCircle2,
    DollarSign,
    Star,
    Activity,
    XCircle,
    TrendingUp
} from 'lucide-react';

interface GarageStats {
    totalBookings: number;
    completedServices: number;
    revenue: number;
    averageRating: number;
    activeBookings: number;
    cancelledBookings: number;
}

export default function Analytics() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<GarageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/garages/my/analytics');
                setStats(response.data.data);
            } catch (err: any) {
                console.error('Failed to load analytics:', err);
                setError(err.response?.data?.message || 'Failed to load analytics data');
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    {t('analytics.title')}
                </h1>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                    <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                        {error || t('analytics.noData')}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {t('analytics.registerFirst')}
                    </p>
                </div>
            </div>
        );
    }

    const completionRate = stats.totalBookings > 0
        ? Math.round((stats.completedServices / stats.totalBookings) * 100)
        : 0;

    const satisfactionRate = Math.round((stats.averageRating / 5) * 100);

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {t('analytics.title')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Bookings Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-blue-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-5 h-5 opacity-70" />
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.totalBookings')}</h3>
                        <p className="text-4xl font-bold">{stats.totalBookings}</p>
                    </div>
                </div>

                {/* Completed Services Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-emerald-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                                {completionRate}%
                            </span>
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.completedServices')}</h3>
                        <p className="text-4xl font-bold">{stats.completedServices}</p>
                    </div>
                </div>

                {/* Total Revenue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-indigo-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-5 h-5 opacity-70" />
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.totalRevenue')}</h3>
                        <p className="text-3xl font-bold">{stats.revenue.toLocaleString()} ETB</p>
                    </div>
                </div>

                {/* Average score card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-amber-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Star className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                                {satisfactionRate}%
                            </span>
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.averageScore')}</h3>
                        <p className="text-4xl font-bold">{stats.averageRating.toFixed(1)} / 5</p>
                        <p className="text-xs mt-2 opacity-80">
                            {stats.averageRating === 0 ? t('analytics.noReviews') :
                                stats.averageRating < 2 ? t('analytics.veryDissatisfied') :
                                    stats.averageRating < 3 ? t('analytics.belowAverage') :
                                        stats.averageRating < 4 ? t('analytics.satisfactory') :
                                            stats.averageRating < 4.5 ? t('analytics.good') :
                                                t('analytics.excellent')}
                        </p>
                    </div>
                </div>

                {/* Active Bookings Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-purple-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium animate-pulse">
                                {t('analytics.active')}
                            </span>
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.activeBookings')}</h3>
                        <p className="text-4xl font-bold">{stats.activeBookings}</p>
                    </div>
                </div>

                {/* Cancelled Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-red-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <TrendingUp className="w-5 h-5 opacity-70 rotate-180" />
                        </div>
                        <h3 className="text-sm opacity-90 mb-1">{t('analytics.cancelled')}</h3>
                        <p className="text-4xl font-bold">{stats.cancelledBookings}</p>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="mt-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                            {t('analytics.performanceInsights')}
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('analytics.completionRate')}
                                    </span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        {completionRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {t('analytics.bookingsCompleted', { completed: stats.completedServices, total: stats.totalBookings })}
                                </p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('analytics.customerSatisfaction')}
                                    </span>
                                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                        {satisfactionRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${satisfactionRate}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {t('analytics.basedOnScore', { score: stats.averageRating.toFixed(1) })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
