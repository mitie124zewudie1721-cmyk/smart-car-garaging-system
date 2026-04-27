// src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import NotificationBell from '@/components/layout/NotificationBell';
import LanguageSelector from '@/components/common/LanguageSelector';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002';

function UserAvatar({ size = 10, textSize = 'text-base' }: { size?: number; textSize?: string }) {
    const { user } = useAuthStore();
    const pic = user?.profilePicture;
    const avatarUrl = pic && pic !== 'default-avatar.png'
        ? (pic.startsWith('http') ? pic : `${BACKEND}${pic}`)
        : null;
    const initial = user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U';
    const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md`;
    return (
        <div className={cls}>
            {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className={textSize}>{initial}</span>}
        </div>
    );
}

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            toast.success('Logged out successfully', { duration: 1500 });
            setIsMobileMenuOpen(false);
            setIsProfileDropdownOpen(false);
            setTimeout(() => { logout(); }, 100);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
            if (isMobileMenuOpen && !(e.target as Element)?.closest?.('.mobile-menu')) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Close dropdown on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsProfileDropdownOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <nav
            className="bg-gradient-to-r from-slate-950 to-slate-900 text-white shadow-xl sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/50"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">

                    {/* Logo — left side */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="group" aria-label="Home">
                            <div className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-purple-300 transition-all duration-300 whitespace-nowrap">
                                Smart Car Garage System
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation — right side */}
                    <div className="hidden md:flex items-center gap-3 lg:gap-5 flex-shrink-0">
                        {/* Language Selector */}
                        <LanguageSelector />

                        <Link
                            to="/"
                            className="text-slate-200 hover:text-white font-semibold text-sm transition-colors duration-200 whitespace-nowrap"
                        >
                            Home
                        </Link>

                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/login"
                                    className="text-slate-200 hover:text-white font-semibold text-sm transition-colors duration-200 whitespace-nowrap"
                                >
                                    Login
                                </Link>
                                <Link to="/register">
                                    <Button
                                        variant="primary"
                                        size="md"
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                                    >
                                        Register
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 lg:gap-4">
                                {/* Notification Bell */}
                                <NotificationBell />

                                {/* Avatar + Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                                        className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none"
                                        aria-label="Profile menu"
                                        aria-expanded={isProfileDropdownOpen}
                                    >
                                        <UserAvatar size={9} />
                                        <div className="hidden lg:block text-left min-w-0">
                                            <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                                                {user?.name || user?.username || 'User'}
                                            </p>
                                            <p className="text-xs font-medium text-slate-300 capitalize whitespace-nowrap">
                                                {user?.role?.replace('_', ' ') || 'Guest'}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Dropdown panel */}
                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Signed in as</p>
                                                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.username}</p>
                                            </div>
                                            <button
                                                onClick={() => { setIsProfileDropdownOpen(false); navigate('/profile'); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                            >
                                                <User size={16} />
                                                View Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 mobile-menu">
                    <div className="px-4 py-8 space-y-6">
                        <Link
                            to="/"
                            className="block text-white text-lg font-medium hover:text-indigo-400 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>

                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/login"
                                    className="block text-white text-lg font-medium hover:text-indigo-400 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                                    >
                                        Register
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* User info in mobile */}
                                <div className="flex items-center gap-4 px-2 py-4 bg-slate-800/50 rounded-xl">
                                    <UserAvatar size={12} textSize="text-xl" />
                                    <div>
                                        <p className="font-medium text-white">
                                            {user?.name || user?.username || 'User'}
                                        </p>
                                        <p className="text-sm text-slate-400 capitalize">
                                            {user?.role?.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 text-white text-lg font-medium hover:text-indigo-400 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <User size={20} />
                                    View Profile
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 rounded-lg border border-red-800/50 transition-all duration-200 text-lg font-medium"
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
