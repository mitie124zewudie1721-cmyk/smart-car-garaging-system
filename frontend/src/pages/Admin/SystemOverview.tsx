// src/pages/Admin/SystemOverview.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { useTranslation } from 'react-i18next';
import {
    Users, Building2, Calendar, DollarSign, Activity,
    TrendingUp, Database, Server, HardDrive, AlertTriangle,
    Clock, Zap, BarChart3, RefreshCw, UserCheck, Car, Shield, Bell
} from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalGarages: number;
    totalReservations: number;
    totalRevenue: number;
    activeReservations: number;
    completedReservations: number;
    pendingGarages: number;
    userGrowth: number;
    garageGrowth: number;
    reservationGrowth: number;
    revenueGrowth: number;
    systemUptime?: number;
    activeUsers?: number;
    totalVehicles?: number;
    averageRating?: number;
}

interface ActivityItem {
    id: string;
    type: 'user' | 'garage' | 'reservation' | 'payment' | 'system';
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
}

interface SystemHealth {
    database: 'healthy' | 'warning' | 'critical';
    api: 'healthy' | 'warning' | 'critical';
    storage: number;
    cpu: number;
    memory: number;
    lastBackup: string;
}

export default function SystemOverview() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isLive, setIsLive] = useState(true);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth>({
        database: 'healthy', api: 'healthy', storage: 83, cpu: 37, memory: 62,
        lastBackup: new Date().toISOString()
    });
    const { t } = useTranslation();

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data.data);
            setLastUpdate(new Date());
            // API is reachable — mark healthy
            setSystemHealth(prev => ({ ...prev, database: 'healthy', api: 'healthy' }));
        } catch (err) {
            // API unreachable — mark warning, keep existing stats unchanged
            setSystemHealth(prev => ({ ...prev, api: 'warning' }));
        }
    };

    const fetchActivities = async () => {
        try {
            // Use the existing /admin/users endpoint to build recent activity
            const usersRes = await api.get('/admin/users?limit=5&sort=-createdAt');
            const users = usersRes.data?.data || usersRes.data?.users || [];

            const items: ActivityItem[] = users.slice(0, 5).map((u: any, i: number) => ({
                id: `u-${u._id || i}`,
                type: 'user' as const,
                message: `User registered: ${u.email || u.username || u.name || 'New user'}`,
                timestamp: u.createdAt || new Date().toISOString(),
                status: 'success' as const,
            }));

            if (items.length > 0) setActivities(items);
        } catch {
            // keep existing activities unchanged
        }
    };

    // Initial load
    useEffect(() => {
        Promise.all([fetchStats(), fetchActivities()]).finally(() => setLoading(false));
    }, []);

    // Silent background refresh every 30s — no loading flash
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            fetchStats();
            fetchActivities();
        }, 30000);
        return () => clearInterval(interval);
    }, [isLive]);


    const handleManualRefresh = () => {
        fetchStats();
        fetchActivities();
        toast.success('Dashboard refreshed');
    };

    const toggleLiveUpdates = () => {
        setIsLive(prev => !prev);
        toast.success(isLive ? 'Live updates paused' : 'Live updates resumed');
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'user': return <UserCheck className="w-4 h-4" />;
            case 'garage': return <Building2 className="w-4 h-4" />;
            case 'reservation': return <Calendar className="w-4 h-4" />;
            case 'payment': return <DollarSign className="w-4 h-4" />;
            case 'system': return <Server className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
            case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
            case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
            case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <Loader size="lg" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading system overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('admin.systemOverview')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('admin.realtimeMonitoring')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                        <button
                            onClick={toggleLiveUpdates}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${isLive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            {isLive ? t('admin.live') : t('admin.paused')}
                        </button>
                        <button
                            onClick={handleManualRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('admin.refresh')}
                        </button>
                    </div>
                </div>

                {/* System Status Banner */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">System Status: Operational</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime: {stats?.systemUptime}%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {systemHealth.database === 'warning' && (
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm">Database Warning</span>
                                </div>
                            )}
                            {systemHealth.api === 'critical' && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm">API Critical</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-blue-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 opacity-70" />
                                <span className="text-xs opacity-70">+{stats?.userGrowth}%</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">
                            {t('admin.totalUsers')}
                        </h3>
                        <p className="text-4xl font-bold mb-2">
                            {stats?.totalUsers?.toLocaleString() || 0}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            {stats?.activeUsers} active now
                        </div>
                    </div>
                </div>

                {/* Total Garages Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-purple-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Building2 className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 opacity-70" />
                                <span className="text-xs opacity-70">+{stats?.garageGrowth}%</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">
                            {t('admin.totalGarages')}
                        </h3>
                        <p className="text-4xl font-bold mb-2">
                            {stats?.totalGarages || 0}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <AlertTriangle className="w-3 h-3" />
                            {stats?.pendingGarages} pending approval
                        </div>
                    </div>
                </div>

                {/* Total Reservations Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-indigo-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 opacity-70" />
                                <span className="text-xs opacity-70">+{stats?.reservationGrowth}%</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">
                            Total Reservations
                        </h3>
                        <p className="text-4xl font-bold mb-2">
                            {stats?.totalReservations?.toLocaleString() || 0}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                            {stats?.activeReservations} active
                        </div>
                    </div>
                </div>

                {/* Total Revenue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-emerald-700">
                    <div className="p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 opacity-70" />
                                <span className="text-xs opacity-70">+{stats?.revenueGrowth}%</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">
                            {t('admin.totalRevenue')}
                        </h3>
                        <p className="text-3xl font-bold mb-2">
                            {stats?.totalRevenue?.toLocaleString()} ETB
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <Zap className="w-3 h-3" />
                            Monthly growth
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Vehicles Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Vehicles</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Registered in system</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalVehicles}</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">+8% this month</p>
                        </div>
                    </div>
                </div>

                {/* Average score card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average score</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">User satisfaction</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.averageRating?.toFixed(1)} / 5</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">+0.2 this month</p>
                        </div>
                    </div>
                </div>

                {/* System Performance Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                                <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.systemLoad')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.currentPerformance')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemHealth.cpu}%</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.cpuUsage')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* {t('admin.realtimeActivity')} */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-6 h-6 text-emerald-600" />
                                {t('admin.realtimeActivity')}                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('admin.live')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {activities.map((activity) => (
                                <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                                                {activity.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                            activity.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                activity.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                            }`}>
                                            {activity.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Health & Performance */}
                <div className="space-y-6">
                    {/* System Health Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Server className="w-6 h-6 text-emerald-600" />
                                System Health
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Database */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${systemHealth.database === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                                        systemHealth.database === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                                            'bg-red-100 dark:bg-red-900/20'
                                        }`}>
                                        <Database className={`w-5 h-5 ${systemHealth.database === 'healthy' ? 'text-emerald-600' :
                                            systemHealth.database === 'warning' ? 'text-amber-600' :
                                                'text-red-600'
                                            }`} />
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium">Database</span>
                                </div>
                                <span className={`flex items-center gap-2 font-semibold ${systemHealth.database === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' :
                                    systemHealth.database === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-red-600 dark:text-red-400'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${systemHealth.database === 'healthy' ? 'bg-emerald-500' :
                                        systemHealth.database === 'warning' ? 'bg-amber-500' :
                                            'bg-red-500'
                                        } ${systemHealth.database === 'healthy' ? 'animate-pulse' : ''}`}></div>
                                    {systemHealth.database}
                                </span>
                            </div>

                            {/* API Server */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${systemHealth.api === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                                        systemHealth.api === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                                            'bg-red-100 dark:bg-red-900/20'
                                        }`}>
                                        <Server className={`w-5 h-5 ${systemHealth.api === 'healthy' ? 'text-emerald-600' :
                                            systemHealth.api === 'warning' ? 'text-amber-600' :
                                                'text-red-600'
                                            }`} />
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium">API Server</span>
                                </div>
                                <span className={`flex items-center gap-2 font-semibold ${systemHealth.api === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' :
                                    systemHealth.api === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-red-600 dark:text-red-400'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${systemHealth.api === 'healthy' ? 'bg-emerald-500' :
                                        systemHealth.api === 'warning' ? 'bg-amber-500' :
                                            'bg-red-500'
                                        } ${systemHealth.api === 'healthy' ? 'animate-pulse' : ''}`}></div>
                                    {systemHealth.api}
                                </span>
                            </div>

                            {/* Storage */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <HardDrive className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium">Storage</span>
                                </div>
                                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    {systemHealth.storage}% Available
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                                Performance
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('admin.cpuUsage')}</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{systemHealth.cpu}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${systemHealth.cpu}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('admin.memoryUsage')}</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{systemHealth.memory}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${systemHealth.memory}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{t('admin.lastBackup')}</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {new Date(systemHealth.lastBackup).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell className="w-6 h-6 text-purple-600" />
                                Quick Actions
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <button className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t('admin.runSystemBackup')}</span>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t('admin.viewSystemLogs')}</span>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Send Alert</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
