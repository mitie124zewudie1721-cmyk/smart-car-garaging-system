// src/pages/Login.tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { loginSchema } from '@/lib/validators';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, user } = useAuthStore();
    const { t } = useTranslation();

    // Already logged in — redirect away
    if (isAuthenticated && user) {
        const dest = user.role === 'admin' ? '/admin/system-overview'
            : user.role === 'garage_owner' ? '/my-garages'
            : '/dashboard';
        return <Navigate to={dest} replace />;
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name as keyof typeof fieldErrors])
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
            const errors: typeof fieldErrors = {};
            result.error.issues.forEach(issue => {
                const p = issue.path[0] as keyof typeof fieldErrors;
                if (p) errors[p] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }
        setIsLoading(true);
        setFieldErrors({});
        try {
            const response = await api.post('/auth/login', {
                username: formData.username.trim(),
                password: formData.password.trim(),
            });
            const { token, user } = response.data;
            login(token, user);
            localStorage.setItem('token', token);
            toast.success('Welcome back!', { duration: 2000 });
            const from = (location.state as any)?.from?.pathname;
            if (from && from !== '/login') {
                navigate(from, { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin/system-overview', { replace: true });
            } else if (user.role === 'garage_owner') {
                navigate('/my-garages', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            const e = err as any;
            toast.error(e.response?.data?.message || 'Login failed.', { duration: 4000 });
        } finally {
            setIsLoading(false);
        }
    };

    const css = `
        @keyframes border-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        @keyframes neon-flicker {
            0%,100% { opacity:1; }
            93% { opacity:0.75; }
            95% { opacity:1; }
        }
        .login-page {
            min-height: 100vh; width: 100%;
            display: flex; align-items: center; justify-content: center;
            background: radial-gradient(ellipse at 30% 20%, #0a0020 0%, #050010 40%, #000008 100%);
            overflow: hidden; position: relative;
        }
        .card-border-wrapper {
            position: relative; border-radius: 28px; padding: 3px; overflow: hidden;
        }
        .card-border-wrapper::before {
            content: ''; position: absolute; inset: -100%;
            background: conic-gradient(
                from 0deg,
                #00ffb4 0deg, #00ffb4 40deg, transparent 40deg, transparent 120deg,
                #ec4899 120deg, #ec4899 160deg, transparent 160deg, transparent 240deg,
                #a855f7 240deg, #a855f7 280deg, transparent 280deg, transparent 360deg
            );
            animation: border-spin 3s linear infinite;
        }
        .card-border-wrapper::after {
            content: ''; position: absolute; inset: -100%;
            background: conic-gradient(
                from 0deg,
                rgba(0,255,180,0.6) 0deg, rgba(0,255,180,0.6) 40deg, transparent 40deg, transparent 120deg,
                rgba(236,72,153,0.6) 120deg, rgba(236,72,153,0.6) 160deg, transparent 160deg, transparent 240deg,
                rgba(168,85,247,0.6) 240deg, rgba(168,85,247,0.6) 280deg, transparent 280deg, transparent 360deg
            );
            animation: border-spin 3s linear infinite; filter: blur(8px);
        }
        .card-inner {
            position: relative; z-index: 1; border-radius: 26px;
            background: rgba(5,0,20,0.93);
            backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
        }
        .title-neon {
            color: #00ffb4;
            text-shadow: 0 0 16px rgba(0,255,180,0.8), 0 0 32px rgba(0,255,180,0.4);
            animation: neon-flicker 6s ease-in-out infinite;
        }
        .input-box {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 16px; border-radius: 12px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.12);
            transition: all 0.25s ease;
        }
        .input-box:focus-within {
            border-color: rgba(0,255,180,0.6);
            box-shadow: 0 0 0 3px rgba(0,255,180,0.10), 0 0 20px rgba(0,255,180,0.08);
            background: rgba(0,255,180,0.03);
        }
        .input-box.error { border-color: rgba(239,68,68,0.6); background: rgba(239,68,68,0.05); }
        .input-box input {
            flex: 1; background: transparent; border: none; outline: none;
            box-shadow: none; color: white; font-size: 15px; font-weight: 600;
        }
        .input-box input::placeholder { color: rgba(148,163,184,0.5); font-weight: 400; }
        .btn-pink { transition: all 0.3s ease; }
        .btn-pink:hover {
            box-shadow: 0 0 28px rgba(236,72,153,0.65), 0 0 56px rgba(236,72,153,0.3) !important;
            transform: translateY(-2px);
        }
    `;

    return (
        <>
            <style>{css}</style>
            <div className="login-page">
                <div className="absolute top-[-10%] left-[-8%] w-96 h-96 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,255,180,0.06) 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-8%] right-[-6%] w-80 h-80 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)' }} />
                <div className="card-border-wrapper" style={{ width: 520 }}>
                    <div className="card-inner px-10 py-10">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #00ffb4 0%, #00c9b1 40%, #6366f1 100%)',
                                    boxShadow: '0 0 24px rgba(0,255,180,0.5), 0 0 48px rgba(0,255,180,0.2)',
                                }}>
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mb-1 title-neon">Well Come </h1>
                            <p className="text-slate-400 text-sm">{t('auth.loginSubtitle')}</p>
                        </div>
                        <form onSubmit={handleSubmit} noValidate className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                                    style={{ color: 'rgba(0,255,180,0.7)' }}>
                                    {t('auth.username')}
                                </label>
                                <div className={cn('input-box', fieldErrors.username && 'error')}>
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#00ffb4">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <input
                                        name="username"
                                        type="text"
                                        autoFocus
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder={t('auth.username')}
                                    />
                                </div>
                                {fieldErrors.username && (
                                    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2 pl-1 font-medium">
                                        <span>&#9679;</span> {fieldErrors.username}
                                    </p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest"
                                        style={{ color: 'rgba(0,255,180,0.7)' }}>
                                        {t('auth.password')}
                                    </label>
                                    <Link to="/forgot-password"
                                        className="text-sm font-semibold hover:opacity-80 transition-opacity"
                                        style={{ color: '#ec4899', textShadow: '0 0 8px rgba(236,72,153,0.5)' }}>
                                        {t('auth.forgotPassword')}
                                    </Link>
                                </div>
                                <div className={cn('input-box', fieldErrors.password && 'error')}>
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#00ffb4">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        style={{ color: 'rgba(0,255,180,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2 pl-1 font-medium">
                                        <span>&#9679;</span> {fieldErrors.password}
                                    </p>
                                )}
                            </div>
                            <button type="submit" disabled={isLoading}
                                className="btn-pink w-full py-4 rounded-xl font-bold text-sm text-white uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
                                    boxShadow: '0 0 20px rgba(236,72,153,0.4), 0 8px 32px rgba(0,0,0,0.4)',
                                    border: 'none', cursor: 'pointer',
                                }}
                            >
                                {isLoading ? 'Signing in...' : t('auth.login')}
                            </button>
                        </form>
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                            <span className="text-slate-600 text-xs tracking-widest uppercase">{t('auth.noAccount')}</span>
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        </div>
                        <Link to="/register"
                            className="flex items-center justify-center w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(0,255,180,0.15)',
                                color: 'rgba(0,255,180,0.7)',
                                textShadow: '0 0 8px rgba(0,255,180,0.3)',
                            }}
                        >
                            {t('auth.register')}
                        </Link>
                    </div>
                </div>

            </div>
        </>
    );
}
