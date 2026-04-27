// src/pages/Admin/Reports.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Period = 'week' | 'month' | 'year';

interface DataPoint {
    label: string;
    count?: number;
    total?: number;
}

interface SummaryStats {
    totalUsers: number;
    totalGarages: number;
    totalReservations: number;
    totalRevenue: number;
    activeReservations: number;
    completedReservations: number;
    pendingGarages: number;
}

function BarChart({ data, color, valueKey, noDataText }: {
    data: DataPoint[];
    color: string;
    valueKey: 'count' | 'total';
    noDataText: string;
}) {
    if (!data.length) {
        return <p className="text-sm text-gray-400 py-4 text-center">{noDataText}</p>;
    }
    const max = Math.max(...data.map(d => (d[valueKey] ?? 0)), 1);
    return (
        <div className="space-y-3">
            {data.map((item, i) => {
                const val = item[valueKey] ?? 0;
                const pct = Math.round((val / max) * 100);
                return (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {valueKey === 'total' ? `${val.toLocaleString()} ETB` : val}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className={`${color} h-3 rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Reports() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>('week');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [userTrend, setUserTrend] = useState<DataPoint[]>([]);
    const [reservationTrend, setReservationTrend] = useState<DataPoint[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<DataPoint[]>([]);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const fetchAll = useCallback(async (p: Period, silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const [summaryRes, usersRes, reservationsRes, revenueRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get(`/admin/analytics/users/${p}`),
                api.get(`/admin/analytics/reservations/${p}`),
                api.get(`/admin/analytics/revenue/${p}`),
            ]);
            setSummary(summaryRes.data.data);
            setUserTrend(usersRes.data.data || []);
            setReservationTrend(reservationsRes.data.data || []);
            setRevenueTrend(revenueRes.data.data || []);
            setLastRefreshed(new Date());
        } catch (err: any) {
            if (!silent) toast.error(err?.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Full reload when period changes
    useEffect(() => {
        fetchAll(period);
    }, [period, fetchAll]);

    // Silent background poll every 30s
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => fetchAll(period, true), 30000);
        return () => clearInterval(interval);
    }, [isLive, period, fetchAll]);

    const periodLabel = period === 'week' ? t('reports.last7Days') : period === 'month' ? t('reports.last30Days') : t('reports.last12Months');

    return (
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {t('reports.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('reports.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <button
                        onClick={() => setIsLive(v => !v)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isLive
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {isLive ? t('reports.live') : t('reports.paused')}
                    </button>

                    {/* Period selector */}
                    <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        {(['week', 'month', 'year'] as Period[]).map(p => (
                            <button key={p} onClick={() => { if (p !== period) setPeriod(p); }}
                                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${period === p ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {p === 'week' ? t('reports.week') : p === 'month' ? t('reports.month') : t('reports.year')}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => fetchAll(period)} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {t('reports.refresh')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="text-center">
                        <Loader size="lg" />
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">{t('reports.loading')}</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg
                            cursor-default transition-all duration-300 ease-out
                            hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40
                            hover:-translate-y-1 active:scale-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">{t('reports.totalUsers')}</p>
                                <span className="text-2xl">👥</span>
                            </div>
                            <p className="text-4xl font-bold mb-1">{summary?.totalUsers ?? '—'}</p>
                            <p className="text-blue-200 text-xs">{t('reports.registeredAccounts')}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg
                            cursor-default transition-all duration-300 ease-out
                            hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40
                            hover:-translate-y-1 active:scale-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">{t('reports.totalGarages')}</p>
                                <span className="text-2xl">🏢</span>
                            </div>
                            <p className="text-4xl font-bold mb-1">{summary?.totalGarages ?? '—'}</p>
                            <p className="text-purple-200 text-xs">{t('reports.pendingApproval', { count: summary?.pendingGarages ?? 0 })}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg
                            cursor-default transition-all duration-300 ease-out
                            hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40
                            hover:-translate-y-1 active:scale-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">{t('reports.totalBookings')}</p>
                                <span className="text-2xl">📅</span>
                            </div>
                            <p className="text-4xl font-bold mb-1">{summary?.totalReservations ?? '—'}</p>
                            <p className="text-emerald-200 text-xs">{t('reports.activeNow', { count: summary?.activeReservations ?? 0 })}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg
                            cursor-default transition-all duration-300 ease-out
                            hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/40
                            hover:-translate-y-1 active:scale-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">{t('reports.totalRevenue')}</p>
                                <span className="text-2xl">💰</span>
                            </div>
                            <p className="text-3xl font-bold mb-1">{summary?.totalRevenue?.toLocaleString() ?? '—'}</p>
                            <p className="text-orange-200 text-xs">{t('reports.etbEarned')}</p>
                        </div>
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* User Growth */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {t('reports.userGrowth')}
                            </h3>
                            <p className="text-xs text-gray-400 mb-5">{periodLabel} — {t('reports.newRegistrations', { period: '' }).replace(' — ', '')}</p>
                            <BarChart data={userTrend} color="bg-blue-500" valueKey="count" noDataText={t('reports.noData')} />
                        </div>

                        {/* Reservation Trend */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {t('reports.bookingTrend')}
                            </h3>
                            <p className="text-xs text-gray-400 mb-5">{periodLabel} — {t('reports.reservationsCreated', { period: '' }).replace(' — ', '')}</p>
                            <BarChart data={reservationTrend} color="bg-emerald-500" valueKey="count" noDataText={t('reports.noData')} />
                        </div>
                    </div>

                    {/* Revenue chart full width */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t('reports.revenueTrend')}
                        </h3>
                        <p className="text-xs text-gray-400 mb-5">{periodLabel} — {t('reports.paymentsPerPeriod', { period: '' }).replace(' — ', '')}</p>
                        <BarChart data={revenueTrend} color="bg-gradient-to-r from-orange-400 to-orange-500" valueKey="total" noDataText={t('reports.noData')} />
                    </div>

                    {/* Booking breakdown from summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t('reports.bookingBreakdown')}
                        </h3>
                        <p className="text-xs text-gray-400 mb-5">{t('reports.allTimeTotals')}</p>
                        {summary && (() => {
                            const total = summary.totalReservations || 1;
                            const items = [
                                { label: t('reports.completed'), value: summary.completedReservations, color: 'bg-emerald-500' },
                                { label: t('reports.activeConfirmed'), value: summary.activeReservations, color: 'bg-blue-500' },
                                { label: t('reports.other'), value: Math.max(0, total - summary.completedReservations - summary.activeReservations), color: 'bg-gray-400' },
                            ];
                            return (
                                <div className="space-y-3">
                                    {items.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {item.value} ({Math.round((item.value / total) * 100)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div
                                                    className={`${item.color} h-3 rounded-full transition-all duration-700`}
                                                    style={{ width: `${Math.round((item.value / total) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                        {isLive ? t('reports.autoRefresh') : '⏸ ' + t('reports.paused')} · {t('reports.lastRefreshed')}: {lastRefreshed.toLocaleTimeString()}
                    </p>
                </>
            )}
        </div>
    );
}
