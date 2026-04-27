// src/pages/Dashboard.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Loader from '@/components/common/Loader';
import { User, Car, ParkingSquare, BarChart2, Search, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalReservations: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        favoriteGarages: 0,
        recentReservations: [] as any[],
        activeGarages: 0,
        todaysOccupancy: 0,
        totalUsers: 0,
        systemHealth: 0,
        totalSlots: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const role = user?.role || 'user';
    const displayName = user?.name || user?.username || 'Guest';

    useEffect(() => {
        if (user && role === 'car_owner') {
            fetchDashboardStats();
        } else if (user && role === 'admin') {
            fetchAdminStats();
        } else if (user && role === 'garage_owner') {
            fetchGarageOwnerStats();
        } else {
            setLoadingStats(false);
        }
    }, [user, role]);

    const fetchGarageOwnerStats = async () => {
        try {
            const [garagesRes, bookingsRes] = await Promise.all([
                api.get('/garages/my'),
                api.get('/reservations/garage-bookings'),
            ]);
            const garages = garagesRes.data.data || [];
            const bookings = bookingsRes.data.data || [];
            // Count all approved garages (regardless of isActive — that's just open/closed hours)
            const activeGarages = garages.filter((g: any) => g.verificationStatus === 'approved').length;
            const totalReservations = bookings.length;
            // Today's occupancy = any booking that is currently active or confirmed
            const todaysOccupancy = bookings.filter((b: any) =>
                ['confirmed', 'active'].includes(b.status)
            ).length;
            // Calculate total slots across all approved garages
            const totalSlots = garages
                .filter((g: any) => g.verificationStatus === 'approved')
                .reduce((sum: number, g: any) => sum + (g.capacity || 0), 0);
            setStats(prev => ({
                ...prev,
                totalReservations,
                activeGarages,
                todaysOccupancy,
                totalSlots,
            }));
        } catch (error) {
            console.error('Failed to fetch garage owner stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchAdminStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            const data = response.data.data;
            setStats(prev => ({
                ...prev,
                totalReservations: data.totalReservations || 0,
                totalUsers: data.totalUsers || 0,
                systemHealth: data.totalGarages || 0,
            }));
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const [reservationsRes] = await Promise.all([
                api.get('/reservations/my'),
            ]);

            const reservations = reservationsRes.data.data || [];
            const active = reservations.filter((r: any) => r.status === 'confirmed' || r.status === 'active').length;
            const completed = reservations.filter((r: any) => r.status === 'completed').length;
            const totalSpent = reservations
                .filter((r: any) => r.status === 'completed')
                .reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0);

            setStats({
                totalReservations: reservations.length,
                activeBookings: active,
                completedBookings: completed,
                totalSpent: totalSpent,
                favoriteGarages: 4,
                recentReservations: reservations.slice(0, 5),
                activeGarages: 0,
                todaysOccupancy: 0,
                totalUsers: 0,
                systemHealth: 0,
                totalSlots: 0,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    if (isLoading || loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="text-center">
                    <Loader size="lg" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        navigate('/login', { replace: true });
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-xl p-6 sm:p-8 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {t('dashboard.welcomeBack', { name: displayName })}
                            </h1>
                            <p className="text-indigo-100 opacity-90 text-base md:text-lg">
                                {role === 'car_owner' && t('dashboard.manageParkingNeeds')}
                                {role === 'garage_owner' && t('dashboard.manageGarages')}
                                {role === 'admin' && t('dashboard.systemOverview')}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-lg text-center">
                                <p className="text-sm opacity-80">{t('dashboard.role')}</p>
                                <p className="font-semibold capitalize">{role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Common card */}
                    <Card className="p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('dashboard.totalReservations')}
                            </h3>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                                <Car size={24} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalReservations}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.fromLastMonth')}</p>
                    </Card>

                    {/* Role-specific cards */}
                    {role === 'car_owner' && (
                        <>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('dashboard.activeBookings')}
                                    </h3>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <ParkingSquare size={24} className="text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeBookings}</p>
                            </Card>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('dashboard.favoriteGarages')}
                                    </h3>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <Search size={24} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.favoriteGarages}</p>
                            </Card>
                        </>
                    )}

                    {role === 'garage_owner' && (
                        <>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        My Garages
                                    </h3>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                        <ParkingSquare size={24} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeGarages}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.totalSlots')}: {stats.totalSlots}</p>
                            </Card>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Active Bookings
                                    </h3>
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                        <BarChart2 size={24} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.todaysOccupancy}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confirmed + In Progress</p>
                            </Card>
                        </>
                    )}

                    {role === 'admin' && (
                        <>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('dashboard.totalUsers')}
                                    </h3>
                                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                                        <User size={24} className="text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalUsers}</p>
                            </Card>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('dashboard.systemHealth')}
                                    </h3>
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                                        <ShieldAlert size={24} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.systemHealth > 0 ? t('dashboard.healthy') : '—'}</p>
                            </Card>
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('dashboard.quickActions')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {role === 'car_owner' && (
                            <>
                                <Link to="/find-garage">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Search size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.findAvailableGarage')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.searchNearbySpots')}</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/my-reservations">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Car size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.viewMyReservations')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.manageBookings')}</p>
                                        </div>
                                    </Button>
                                </Link>
                            </>
                        )}

                        {role === 'garage_owner' && (
                            <>
                                <Link to="/my-garages">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <ParkingSquare size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.manageGaragesAction')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.editMonitor')}</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/add-garage">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <ParkingSquare size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.addNewGarage')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.listNewParking')}</p>
                                        </div>
                                    </Button>
                                </Link>
                            </>
                        )}

                        {role === 'admin' && (
                            <>
                                <Link to="/admin/users">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <User size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.manageUsersAction')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.viewEditAccounts')}</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/admin/reports">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <BarChart2 size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{t('dashboard.viewReports')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.systemAnalytics')}</p>
                                        </div>
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}