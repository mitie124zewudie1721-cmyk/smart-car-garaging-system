// src/components/common/UserDropdown.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserDropdown() {
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        toast.success('Logged out successfully', { duration: 1500 });
        setIsOpen(false);
        setTimeout(() => {
            logout();
        }, 100);
    };

    const toggleDropdown = () => setIsOpen((prev) => !prev);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && !(e.target as Element)?.closest('.user-dropdown')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative user-dropdown">
            {/* Avatar + Name Button */}
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="User menu"
            >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-offset-2 ring-offset-slate-900 dark:ring-offset-slate-950">
                    {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* Name + Chevron */}
                <div className="hidden md:flex items-center gap-1">
                    <span className="font-medium text-white">
                        {user.name || user.username || 'User'}
                    </span>
                    <ChevronDown size={16} className="text-slate-300" />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div
                        className="fixed inset-0 z-30 md:hidden bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown content */}
                    <div className="absolute right-0 mt-3 w-72 md:w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-40">
                        {/* User Info Header */}
                        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50">
                            <p className="font-medium text-white truncate">
                                {user.name || user.username || 'User'}
                            </p>
                            <p className="text-sm text-slate-400 truncate">
                                {user.username || 'No username'}
                            </p>
                            <p className="text-xs text-indigo-400 mt-1 capitalize">
                                {user.role.replace('_', ' ')}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <Link
                                to="/dashboard/profile"
                                className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                onClick={() => setIsOpen(false)}
                            >
                                <User size={18} />
                                Profile
                            </Link>

                            {user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Shield size={18} />
                                    Admin Dashboard
                                </Link>
                            )}

                            <Link
                                to="/settings"
                                className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings size={18} />
                                Settings
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
