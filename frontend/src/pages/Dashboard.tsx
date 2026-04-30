// src/pages/Dashboard.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Loader from '@/components/common/Loader';
import { User, Car, ParkingSquare, BarChart2, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
    const { user, isLoading, logout } = useAuthStore();
    const navigate = useNavigate();
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
            const [reservationsRes, garagesRes] = await Promise.all([
                api.get('/reservations/garage-bookings'),
                api.get('/garages/my'),
            ]);
            const reservations = reservationsRes.data.data || [];
            const garages = garagesRes.data.data || [];
            const activeGarages = garages.filter((g: any) => g.isActive).length;
            setStats(prev => ({
                ...prev,
                totalReservations: reservations.length,
                activeGarages: activeGarages || garages.length,
                todaysOccupancy: reservations.filter((r: any) => r.status === 'active' || r.status === 'confirmed').length,
            }));
        } catch { /* keep zeros */ } finally {
            setLoadingStats(false);
        }
    };

    const fetchAdminStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            const d = res.data.data || {};
            setStats(prev => ({
                ...prev,
                totalReservations: d.totalReservations || 0,
                totalUsers: d.totalUsers || 0,
                systemHealth: d.totalGarages || 0,
                activeGarages: d.activeGarages || 0,
            }));
        } catch { /* keep zeros */ } finally {
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
                                Welcome back, {displayName}!
                            </h1>
                            <p className="text-indigo-100 opacity-90 text-base md:text-lg">
                                {role === 'car_owner' && 'Find & manage your parking needs easily'}
                                {role === 'garage_owner' && 'Manage your garages and reservations'}
                                {role === 'admin' && 'System overview & administration panel'}
                                {role === 'user' && 'Get started with Smart Garaging'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-lg text-center">
                                <p className="text-sm opacity-80">Role</p>
                                <p className="font-semibold capitalize">{role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Total Reservations — all roles */}
                    <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                        <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><Car size={22} /></div>
                        <p className="text-sm font-medium opacity-80 mb-1">Total Reservations</p>
                        <p className="text-4xl font-black">{stats.totalReservations}</p>
                    </div>

                    {role === 'car_owner' && (
                        <>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><ParkingSquare size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Active Bookings</p>
                                <p className="text-4xl font-black">{stats.activeBookings}</p>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><BarChart2 size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Completed</p>
                                <p className="text-4xl font-black">{stats.completedBookings}</p>
                            </div>
                        </>
                    )}

                    {role === 'garage_owner' && (
                        <>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><ParkingSquare size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Active Garages</p>
                                <p className="text-4xl font-black">{stats.activeGarages}</p>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><BarChart2 size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Today's Occupancy</p>
                                <p className="text-4xl font-black">{stats.todaysOccupancy}</p>
                            </div>
                        </>
                    )}

                    {role === 'admin' && (
                        <>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><User size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Total Users</p>
                                <p className="text-4xl font-black">{stats.totalUsers}</p>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4"><ParkingSquare size={22} /></div>
                                <p className="text-sm font-medium opacity-80 mb-1">Total Garages</p>
                                <p className="text-4xl font-black">{stats.systemHealth}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {role === 'car_owner' && (
                            <>
                                <Link to="/find-garage">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Search size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Find Available Garage</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Search nearby spots</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/my-reservations">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <Car size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">View My Reservations</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage bookings</p>
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
                                            <p className="font-medium">Manage Garages</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Edit & monitor</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/add-garage">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <ParkingSquare size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Add New Garage</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">List new parking</p>
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
                                            <p className="font-medium">Manage Users</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">View & edit accounts</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to="/admin/reports">
                                    <Button variant="outline" className="w-full justify-start text-left h-16 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                        <BarChart2 size={20} className="mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">View Reports</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">System analytics</p>
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