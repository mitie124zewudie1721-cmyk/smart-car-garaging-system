// src/components/layout/DashboardLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if not authenticated (ProtectedRoute should prevent this, but extra safety)
        if (!user && !isLoading) {
            navigate('/login', { replace: true });
        }
    }, [user, isLoading, navigate]);


    // Close mobile sidebar on route change (optional)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null; // ProtectedRoute should prevent this

    const isAdmin = user.role === 'admin';
    const isGarageOwner = user.role === 'garage_owner';

    const mainBg = isAdmin
        ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)'
        : isGarageOwner
            ? 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 50%, #faf5ff 100%)'
            : 'linear-gradient(135deg, #f0f4ff 0%, #eef2ff 50%, #f0f4ff 100%)'; return (
                <div className="flex flex-col h-screen overflow-hidden" style={{ background: mainBg }}>
                    {/* Top Navbar — full width */}
                    <Navbar />

                    {/* Below navbar: sidebar + content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
                            <Sidebar />
                        </div>

                        {/* Mobile sidebar overlay/backdrop */}
                        {isSidebarOpen && (
                            <div
                                className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                                onClick={() => setIsSidebarOpen(false)}
                                aria-hidden="true"
                            />
                        )}

                        {/* Mobile sidebar */}
                        <div
                            className={cn(
                                'fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out lg:hidden',
                                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            )}
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                                    <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        Smart Garaging
                                    </h2>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        aria-label="Close sidebar"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <Sidebar />
                                </div>
                            </div>
                        </div>

                        {/* Main content area */}
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {/* Mobile-only hamburger bar */}
                            <div className="lg:hidden flex items-center h-12 px-4 border-b border-slate-200/60">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2"
                                    aria-label="Open sidebar"
                                    aria-expanded={isSidebarOpen}
                                >
                                    <Menu size={24} />
                                </button>
                            </div>

                            {/* Page content */}
                            <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6" style={{ background: 'transparent' }}>
                                <Outlet />
                            </main>
                        </div>
                    </div>
                </div>
            );
}