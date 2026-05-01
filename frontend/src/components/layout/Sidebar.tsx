// src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Home, Search, Car, ParkingSquare, Users, BarChart2,
    Settings, LogOut, CheckCircle, AlertCircle, Building2, Globe, CreditCard,
    ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Badge showing pending refund count for admin
function RefundBadge() {
    const [count, setCount] = useState(0);
    const { user } = useAuthStore();
    useEffect(() => {
        if (user?.role !== 'admin') return;
        api.get('/payments/admin/refunds').then(r => {
            const pending = (r.data.data || []).filter((p: any) => p.escrowStatus === 'refund_pending').length;
            setCount(pending);
        }).catch(() => { });
    }, [user]);
    if (!count) return null;
    return <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>;
}
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'am', label: 'አማ', full: 'አማርኛ' },
    { code: 'om', label: 'OM', full: 'Afaan Oromoo' },
];

function LanguageSelectorSidebar() {
    const { i18n } = useTranslation();
    return (
        <div className="flex items-center gap-1 px-2">
            <Globe size={14} className="text-slate-400 flex-shrink-0" />
            <div className="flex gap-1 flex-wrap">
                {LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => { i18n.changeLanguage(lang.code); }}
                        title={lang.full}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${i18n.language?.startsWith(lang.code)
                            ? 'bg-white/20 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Shared link style helper
const linkCls = (isActive: boolean, accent: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive
        ? `bg-white/15 text-white font-semibold shadow-sm border-l-4 ${accent}`
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

export default function Sidebar() {
    const { user, logout, isLoading } = useAuthStore();
    const { t } = useTranslation();
    const location = useLocation();

    // Finance submenu open state — auto-open if on a finance page
    const financeRoutes = ['/admin/commission', '/admin/payment-history', '/admin/archive-history', '/admin/withdrawals', '/admin/refunds'];
    const garageFinanceRoutes = ['/earnings', '/payment-history', '/withdrawal'];
    const [financeOpen, setFinanceOpen] = useState(() =>
        financeRoutes.some(r => location.pathname.startsWith(r))
    );
    const [garageFinanceOpen, setGarageFinanceOpen] = useState(() =>
        garageFinanceRoutes.some(r => location.pathname.startsWith(r))
    );

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            toast.success('Logged out successfully', { duration: 1500 });
            setTimeout(() => logout(), 100);
        }
    };

    if (isLoading) {
        return (
            <aside className="w-64 h-full"
                style={{ background: 'linear-gradient(180deg, #312e81 0%, #3730a3 50%, #312e81 100%)' }}>
                <div className="flex flex-col h-full p-6">
                    <div className="h-10 bg-white/10 rounded animate-pulse mb-10" />
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-10 bg-white/10 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    if (!user) return null;

    const isCarOwner = user.role === 'car_owner';
    const isGarageOwner = user.role === 'garage_owner';
    const isAdmin = user.role === 'admin';

    // Per-role accent color for active border
    const accent = isAdmin
        ? 'border-emerald-400'
        : isGarageOwner
            ? 'border-purple-400'
            : 'border-indigo-400';

    return (
        <aside
            className="w-full h-full overflow-y-auto shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #312e81 0%, #3730a3 50%, #312e81 100%)' }}
            role="navigation"
            aria-label="Main sidebar navigation"
        >
            <div className="flex flex-col h-full p-5">
                {/* Brand */}
                <div className="mb-8 px-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Smart Garaging</h2>
                    <p className="text-xs text-slate-400 mt-0.5"></p>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 space-y-1">
                    <NavLink to="/dashboard" className={({ isActive }) => linkCls(isActive, accent)}>
                        <Home size={18} />{t('nav.dashboard')}
                    </NavLink>

                    {/* Car Owner */}
                    {isCarOwner && (<>
                        <NavLink to="/find-garage" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Search size={18} />{t('nav.findGarage')}
                        </NavLink>
                        <NavLink to="/my-reservations" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Car size={18} />{t('nav.myReservations')}
                        </NavLink>
                        <NavLink to="/vehicles" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Settings size={18} />{t('nav.myVehicles')}
                        </NavLink>
                        <NavLink to="/disputes" className={({ isActive }) => linkCls(isActive, accent)}>
                            <AlertCircle size={18} />{t('nav.disputes')}
                        </NavLink>
                        <NavLink to="/car-payment-history" className={({ isActive }) => linkCls(isActive, accent)}>
                            <CreditCard size={18} />Payment History
                        </NavLink>

                    </>)}

                    {/* Garage Owner */}
                    {isGarageOwner && (<>
                        <NavLink to="/my-garages" className={({ isActive }) => linkCls(isActive, accent)}>
                            <ParkingSquare size={18} />{t('nav.myGarages')}
                        </NavLink>
                        <NavLink to="/add-garage" className={({ isActive }) => linkCls(isActive || false, accent)}>
                            <ParkingSquare size={18} />
                            <span className="flex-1">{t('nav.addGarage')}</span>
                            {!(user as any).registrationFeePaid && (
                                <span className="text-xs bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">Fee</span>
                            )}
                        </NavLink>
                        <NavLink to="/bookings" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Car size={18} />{t('nav.bookings')}
                        </NavLink>
                        <NavLink to="/analytics" className={({ isActive }) => linkCls(isActive, accent)}>
                            <BarChart2 size={18} />{t('nav.analytics')}
                        </NavLink>

                        {/* ── Finance group (collapsible) ── */}
                        <button
                            onClick={() => setGarageFinanceOpen(v => !v)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 ${garageFinanceOpen
                                ? 'bg-white/15 text-white font-semibold'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CreditCard size={18} />
                            <span className="flex-1 text-left">Payment</span>
                            {garageFinanceOpen
                                ? <ChevronDown size={14} className="opacity-60" />
                                : <ChevronRight size={14} className="opacity-60" />}
                        </button>

                        {garageFinanceOpen && (
                            <div className="ml-4 pl-3 border-l border-white/15 space-y-0.5">
                                <NavLink to="/earnings" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <BarChart2 size={16} />{t('nav.earnings')}
                                </NavLink>
                                <NavLink to="/payment-history" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>💳</span>Payment History
                                </NavLink>
                                <NavLink to="/withdrawal" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>💸</span>Withdraw
                                </NavLink>
                            </div>
                        )}

                        <NavLink to="/garage-disputes" className={({ isActive }) => linkCls(isActive, accent)}>
                            <AlertCircle size={18} />Disputes & Complaints
                        </NavLink>
                    </>)}

                    {/* Admin */}
                    {isAdmin && (<>
                        <NavLink to="/admin/system-overview" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Home size={18} />System Overview
                        </NavLink>
                        <NavLink to="/admin/garage-verification" className={({ isActive }) => linkCls(isActive, accent)}>
                            <CheckCircle size={18} />{t('nav.garageVerification')}
                        </NavLink>
                        <NavLink to="/admin/garage-management" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Building2 size={18} />{t('nav.garageManagement')}
                        </NavLink>
                        <NavLink to="/admin/disputes" className={({ isActive }) => linkCls(isActive, accent)}>
                            <AlertCircle size={18} />{t('nav.feedback')}
                        </NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => linkCls(isActive, accent)}>
                            <Users size={18} />{t('nav.manageUsers')}
                        </NavLink>
                        <NavLink to="/admin/reports" className={({ isActive }) => linkCls(isActive, accent)}>
                            <BarChart2 size={18} />{t('nav.reports')}
                        </NavLink>

                        {/* ── Finance group (collapsible) ── */}
                        <button
                            onClick={() => setFinanceOpen(v => !v)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 ${financeOpen
                                ? 'bg-white/15 text-white font-semibold'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CreditCard size={18} />
                            <span className="flex-1 text-left">Payment</span>
                            {financeOpen
                                ? <ChevronDown size={14} className="opacity-60" />
                                : <ChevronRight size={14} className="opacity-60" />}
                        </button>

                        {financeOpen && (
                            <div className="ml-4 pl-3 border-l border-white/15 space-y-0.5">
                                <NavLink to="/admin/commission" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <Settings size={16} />Commission & Payouts
                                </NavLink>
                                <NavLink to="/admin/payment-history" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>💳</span>Payment History
                                </NavLink>
                                <NavLink to="/admin/archive-history" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>🗄️</span>Archive History
                                </NavLink>
                                <NavLink to="/admin/withdrawals" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>💸</span>Withdrawals
                                </NavLink>
                                <NavLink to="/admin/refunds" className={({ isActive }) => linkCls(isActive, accent)}>
                                    <span style={{ fontSize: 15 }}>↩️</span>
                                    <span className="flex-1">Refunds</span>
                                    <RefundBadge />
                                </NavLink>
                            </div>
                        )}

                        <NavLink to="/admin/trash" className={({ isActive }) => linkCls(isActive, accent)}>
                            <span style={{ fontSize: 16 }}>🗑️</span>{t('nav.trash')}
                        </NavLink>
                    </>)}
                </nav>

                {/* Logout */}
                <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                    {/* Language Selector */}
                    <div className="px-2">
                        <LanguageSelectorSidebar />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200"
                        aria-label="Log out"
                    >
                        <LogOut size={18} />
                        {t('nav.logout')}
                    </button>
                </div>
            </div>
        </aside>
    );
}
