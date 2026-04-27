// src/pages/Register.tsx
import { useState, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Phone, ChevronDown, Camera, Mail } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/* ── Shared input styles ── */
const iBase = [
    'w-full text-white placeholder-slate-300',
    'rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold',
    'border border-white/[0.12] focus:outline-none',
    'focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20',
    'transition-all duration-200',
].join(' ');
const iBg = { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' };
const iErr = 'border-red-500/60 focus:border-red-500/70 focus:ring-red-500/20';

interface FP { id: string; label: string; error?: string; required?: boolean; children: React.ReactNode; }
function F({ id, label, error, required, children }: FP) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                {label}
                {required && <span className="text-teal-400">*</span>}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                    <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                    {error}
                </p>
            )}
        </div>
    );
}

export default function Register() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', username: '', password: '',
        confirmPassword: '', phone: '', email: '',
        role: 'car_owner' as 'car_owner' | 'garage_owner',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const set = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    };

    const onAvatar = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return; }
        setAvatarFile(f);
        const r = new FileReader();
        r.onload = ev => setAvatarPreview(ev.target?.result as string);
        r.readAsDataURL(f);
    };

    const validate = () => {
        const e: Record<string, string> = {};

        // First name — letters only
        if (!form.firstName.trim()) {
            e.firstName = 'First name is required';
        } else if (!/^[a-zA-Z\u00C0-\u024F\s'-]+$/.test(form.firstName)) {
            e.firstName = 'Name can only contain letters';
        } else if (form.firstName.trim().length < 2) {
            e.firstName = 'At least 2 characters required';
        }

        // Last name — letters only
        if (!form.lastName.trim()) {
            e.lastName = 'Last name is required';
        } else if (!/^[a-zA-Z\u00C0-\u024F\s'-]+$/.test(form.lastName)) {
            e.lastName = 'Name can only contain letters';
        }

        // Username — must start with letter
        if (!form.username.trim()) {
            e.username = 'Username is required';
        } else if (form.username.length < 3) {
            e.username = 'At least 3 characters required';
        } else if (!/^[a-zA-Z][a-zA-Z0-9_]+$/.test(form.username)) {
            e.username = 'Must start with a letter. Letters, numbers and underscores only';
        }

        // Password — strong validation
        if (!form.password) {
            e.password = 'Password is required';
        } else if (form.password.length < 8) {
            e.password = 'At least 8 characters required';
        } else if (!/[A-Z]/.test(form.password)) {
            e.password = 'Must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(form.password)) {
            e.password = 'Must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(form.password)) {
            e.password = 'Must contain at least one number';
        } else if (!/[^A-Za-z0-9]/.test(form.password)) {
            e.password = 'Must contain at least one special character (!@#$%...)';
        }

        // Confirm password
        if (form.password !== form.confirmPassword) {
            e.confirmPassword = 'Passwords do not match';
        }

        // Phone — optional but if provided must be valid
        if (form.phone && !/^\+251[79]\d{8}$/.test(form.phone)) {
            e.phone = 'Use format: +251912345678 (13 digits)';
        }

        return e;
    };

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); toast.error(t('register.fixErrors')); return; }
        setLoading(true);
        try {
            await api.post('/auth/register', {
                name: `${form.firstName.trim()} ${form.lastName.trim()}`,
                username: form.username.trim(),
                password: form.password,
                role: form.role,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
            });
            if (avatarFile) {
                try {
                    const lr = await api.post('/auth/login', { username: form.username.trim(), password: form.password });
                    const token = lr.data.data?.token || lr.data.token;
                    if (token) {
                        const fd = new FormData();
                        fd.append('avatar', avatarFile);
                        await api.post('/users/profile/avatar', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
                    }
                } catch { /* not critical */ }
            }
            toast.success(t('register.success'), { duration: 1500 });
            setTimeout(() => { toast.dismiss(); navigate('/login'); }, 1500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('register.failed'));
        } finally { setLoading(false); }
    };

    const initials = ((form.firstName[0] || '') + (form.lastName[0] || '')).toUpperCase() || '?';

    return (
        <div className="flex min-h-screen" style={{ background: '#060d1a' }}>

            {/* ── LEFT — Car garage image ── */}
            <div className="hidden lg:block lg:w-1/2 sticky top-0 overflow-hidden" style={{ height: '100vh' }}>
                <img
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80"
                    alt="Car garage"
                    className="w-full h-full object-cover object-center"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to right, rgba(6,13,26,0.15) 0%, rgba(6,13,26,0.6) 100%)' }} />
                {/* Bottom teal glow */}
                <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(15,164,175,0.12) 0%, transparent 100%)' }} />
            </div>

            {/* ── RIGHT — Form ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto"
                style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 100%)' }}>
                <div className="w-full" style={{ maxWidth: '560px' }}>

                    {/* Card */}
                    <div className="relative rounded-3xl overflow-hidden"
                        style={{
                            background: 'rgba(15,30,55,0.90)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(15,164,175,0.20)',
                            boxShadow: '0 0 0 1px rgba(15,164,175,0.08), 0 32px 64px rgba(0,0,0,0.5)',
                        }}>

                        {/* Top teal accent bar */}
                        <div className="h-1" style={{ background: 'linear-gradient(90deg, #0FA4AF, #f59e0b, #0FA4AF)' }} />

                        <div className="px-10 py-9">

                            {/* Header */}
                            <div className="flex flex-col items-center mb-8">
                                {/* Avatar */}
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatar} />
                                <div onClick={() => fileRef.current?.click()}
                                    className="relative w-16 h-16 rounded-full cursor-pointer group mb-4 shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #0FA4AF, #0a7a8f)', boxShadow: '0 0 20px rgba(15,164,175,0.4)' }}>
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover rounded-full" />
                                        : <div className="w-full h-full flex items-center justify-center text-white text-lg font-black rounded-full">
                                            {initials !== '?' ? initials : <User className="w-7 h-7 opacity-80" />}
                                        </div>
                                    }
                                    <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(0,0,0,0.55)' }}>
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                <h1 className="text-2xl font-black text-white mb-1">
                                    {t('register.title').split(' ').slice(0, -1).join(' ')}{' '}
                                    <span style={{ color: '#0FA4AF' }}>
                                        {t('register.title').split(' ').slice(-1)[0]}
                                    </span>
                                </h1>
                                {/* Yellow underline */}
                                <div className="flex items-center gap-1 mb-2">
                                    <div className="w-8 h-0.5 rounded-full" style={{ background: '#f59e0b' }} />
                                    <div className="w-1.5 h-0.5 rounded-full" style={{ background: '#f59e0b' }} />
                                </div>
                                <p className="text-slate-400 text-sm">{t('register.subtitle')}</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-5">

                                {/* Row 1: First + Last */}
                                <div className="grid grid-cols-2 gap-4">
                                    <F id="firstName" label={t('register.firstName')} error={errors.firstName} required>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="firstName" name="firstName" type="text"
                                                value={form.firstName} onChange={set} placeholder="First Name"
                                                className={cn(iBase, errors.firstName && iErr)} style={iBg} />
                                        </div>
                                    </F>
                                    <F id="lastName" label={t('register.lastName')} error={errors.lastName} required>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="lastName" name="lastName" type="text"
                                                value={form.lastName} onChange={set} placeholder="Last Name"
                                                className={cn(iBase, errors.lastName && iErr)} style={iBg} />
                                        </div>
                                    </F>
                                </div>

                                {/* Username */}
                                <F id="username" label={t('register.username')} error={errors.username} required>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                        <input id="username" name="username" type="text"
                                            value={form.username} onChange={set} placeholder="Username"
                                            className={cn(iBase, errors.username && iErr)} style={iBg} />
                                    </div>
                                </F>

                                {/* Row 2: Password + Confirm */}
                                <div className="grid grid-cols-2 gap-4">
                                    <F id="password" label={t('register.password')} error={errors.password} required>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="password" name="password" type={showPw ? 'text' : 'password'}
                                                value={form.password} onChange={set} placeholder="Min 8 chars"
                                                className={cn(iBase, 'pr-10', errors.password && iErr)} style={iBg} />
                                            <button type="button" onClick={() => setShowPw(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition">
                                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {/* Password strength indicator */}
                                        {form.password && (() => {
                                            const checks = [
                                                form.password.length >= 8,
                                                /[A-Z]/.test(form.password),
                                                /[a-z]/.test(form.password),
                                                /[0-9]/.test(form.password),
                                                /[^A-Za-z0-9]/.test(form.password),
                                            ];
                                            const score = checks.filter(Boolean).length;
                                            const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
                                            const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
                                            return (
                                                <div className="mt-1.5">
                                                    <div className="flex gap-1 mb-1">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score - 1] : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className={`text-[10px] font-semibold ${score <= 2 ? 'text-red-500' : score <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                        {labels[score - 1] || 'Very Weak'}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </F>
                                    <F id="confirmPassword" label={t('register.confirm')} error={errors.confirmPassword} required>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="confirmPassword" name="confirmPassword" type={showCf ? 'text' : 'password'}
                                                value={form.confirmPassword} onChange={set} placeholder="••••••••"
                                                className={cn(iBase, 'pr-10', errors.confirmPassword && iErr)} style={iBg} />
                                            <button type="button" onClick={() => setShowCf(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition">
                                                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {form.confirmPassword && form.password !== form.confirmPassword && (
                                            <p className="text-[10px] text-red-500 mt-1">Passwords don't match</p>
                                        )}
                                        {form.confirmPassword && form.password === form.confirmPassword && (
                                            <p className="text-[10px] text-emerald-600 mt-1">✓ Passwords match</p>
                                        )}
                                    </F>
                                </div>

                                {/* Row 3: Phone + Email */}
                                <div className="grid grid-cols-2 gap-4">
                                    <F id="phone" label={t('register.phone')}>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="phone" name="phone" type="tel"
                                                value={form.phone}
                                                onChange={e => {
                                                    // Only allow +, digits, max 13 chars
                                                    const val = e.target.value.replace(/[^\d+]/g, '');
                                                    if (val.length <= 13) set({ ...e, target: { ...e.target, name: 'phone', value: val } });
                                                }}
                                                placeholder="+251912345678"
                                                maxLength={13}
                                                className={iBase} style={iBg} />
                                        </div>
                                        {form.phone && !/^\+251[79]\d{8}$/.test(form.phone) && form.phone.length > 3 && (
                                            <p className="text-[10px] text-amber-500 mt-1">Format: +251912345678 (13 digits)</p>
                                        )}
                                    </F>
                                    <F id="email" label={t('register.email')}>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0FA4AF' }} />
                                            <input id="email" name="email" type="email"
                                                value={form.email} onChange={set} placeholder="you@email.com"
                                                className={iBase} style={iBg} />
                                        </div>
                                    </F>
                                </div>

                                {/* Role */}
                                <F id="role" label={t('register.role')} required>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#0FA4AF' }} />
                                        <select id="role" name="role" value={form.role} onChange={set}
                                            className={cn(iBase, 'appearance-none pr-10 cursor-pointer')} style={{ ...iBg, color: 'white' }}>
                                            <option value="car_owner" style={{ background: '#0a1628' }}>{t('register.carOwner')}</option>
                                            <option value="garage_owner" style={{ background: '#0a1628' }}>{t('register.garageOwner')}</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </F>

                                {/* Terms checkbox */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative mt-0.5 flex-shrink-0">
                                        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                            className="sr-only" />
                                        <div className={cn(
                                            'w-4 h-4 rounded flex items-center justify-center transition-all duration-200',
                                            agreed
                                                ? 'border-0'
                                                : 'border border-white/20 bg-white/5 group-hover:border-teal-500/50'
                                        )}
                                            style={agreed ? { background: '#0FA4AF' } : {}}>
                                            {agreed && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 6l3 3 5-5" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 leading-relaxed">
                                        I agree to the{' '}
                                        <span className="font-semibold cursor-pointer" style={{ color: '#0FA4AF' }}>Terms of Service</span>
                                        {' '}and{' '}
                                        <span className="font-semibold cursor-pointer" style={{ color: '#0FA4AF' }}>Privacy Policy</span>
                                    </span>
                                </label>

                                {/* Submit */}
                                <button type="submit" disabled={loading}
                                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                    style={{
                                        background: 'linear-gradient(135deg, #0FA4AF 0%, #0a7a8f 100%)',
                                        boxShadow: '0 8px 24px rgba(15,164,175,0.35)',
                                    }}>
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            {t('register.creating')}
                                        </>
                                    ) : (
                                        <>
                                            <User size={16} />
                                            {t('register.createAccount')}
                                        </>
                                    )}
                                </button>

                                {/* Login link */}
                                <p className="text-center text-sm text-slate-400">
                                    {t('register.hasAccount')}{' '}
                                    <Link to="/login" className="font-bold hover:opacity-80 transition-opacity" style={{ color: '#0FA4AF' }}>
                                        {t('auth.login')}
                                    </Link>
                                </p>
                            </form>
                        </div>

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-10 right-10 h-[1px]"
                            style={{ background: 'linear-gradient(90deg, transparent, #0FA4AF, #f59e0b, transparent)' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
