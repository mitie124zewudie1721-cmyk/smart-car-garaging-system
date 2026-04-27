// src/pages/Profile.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Loader from '@/components/common/Loader';
import { Eye, EyeOff, User, Phone, Lock, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ApiErr = { response?: { data?: { message?: string } } };

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002';

const ROLE_LABEL: Record<string, string> = {
    car_owner: 'Car Owner',
    garage_owner: 'Garage Owner',
    admin: 'System Administrator',
};
const ROLE_COLOR: Record<string, string> = {
    car_owner: 'bg-indigo-100 text-indigo-700',
    garage_owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-emerald-100 text-emerald-700',
};

const inputBase = 'w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200';

export default function Profile() {
    const { user, login, token } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPwSection, setShowPwSection] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        api.get('/users/profile').then(r => {
            const u = r.data.data || r.data;
            setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '' });
        }).catch(() => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return; }
        const reader = new FileReader();
        reader.onload = ev => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const r = await api.post('/users/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const updated = r.data.data;
            if (token) login(token, { ...user!, ...updated });
            toast.success('Profile photo updated');
        } catch (e: unknown) {
            toast.error((e as ApiErr).response?.data?.message || 'Upload failed');
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            const r = await api.put('/users/profile', {
                name: form.name,
                ...(form.email ? { email: form.email } : {}),
                ...(form.phone ? { phone: form.phone.replace(/\s+/g, '') } : {}),
                ...(form.address ? { address: form.address } : {}),
            });
            const updated = r.data.data || r.data;
            if (token) login(token, { ...user!, ...updated });
            toast.success('Profile updated');
        } catch (e: unknown) {
            toast.error((e as ApiErr).response?.data?.message || 'Failed to update');
        } finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Fill in all password fields'); return; }
        if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('New passwords do not match'); return; }
        if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setChangingPw(true);
        try {
            await api.put('/users/profile', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            toast.success('Password changed successfully');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPwSection(false);
        } catch (e: unknown) {
            toast.error((e as ApiErr).response?.data?.message || 'Failed to change password');
        } finally { setChangingPw(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center"><Loader size="lg" /><p className="mt-4 text-slate-500">Loading profile…</p></div>
        </div>
    );

    const role = user?.role || 'car_owner';
    const nameParts = form.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || '?';

    const storedPic = user?.profilePicture;
    const avatarUrl = avatarPreview
        || (storedPic && storedPic !== 'default-avatar.png'
            ? (storedPic.startsWith('http') ? storedPic : `${BACKEND}${storedPic}`)
            : null);

    return (
        <div className="min-h-screen">
            <div className="max-w-md mx-auto px-4 py-10">

                <div className="mb-8">
                    <button onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4 transition-colors">
                        <ArrowLeft size={16} />
                        {t('profile.back')}
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('profile.subtitle')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-100 px-8 py-8 space-y-5">

                    {/* Avatar row */}
                    <div className="flex items-center gap-4 pb-2">
                        <div className="relative flex-shrink-0 group" style={{ width: 72, height: 72 }}>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                                className="hidden" onChange={handleAvatarChange} />
                            <div onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                                className="rounded-2xl overflow-hidden cursor-pointer shadow-md"
                                style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#6366f1,#9333ea)' }}
                                title="Click to change photo">
                                {avatarUrl
                                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">{initials}</div>}
                            </div>
                            <div onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: 'rgba(0,0,0,0.45)' }}>
                                {uploadingAvatar
                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <span className="text-white text-xs font-semibold">{t('profile.editPhoto')}</span>}
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{form.name || user?.username}</p>
                            <p className="text-sm text-gray-500">@{user?.username}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${ROLE_COLOR[role]}`}>
                                {ROLE_LABEL[role] || role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                {t('profile.firstName')} <span className="text-indigo-400">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input value={firstName}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value + (lastName ? ' ' + lastName : '') }))}
                                    placeholder="John" className={inputBase + ' pl-9'} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('profile.lastName')}</label>
                            <input value={lastName}
                                onChange={e => setForm(p => ({ ...p, name: (firstName || '') + (e.target.value ? ' ' + e.target.value : '') }))}
                                placeholder="Doe" className={inputBase} />
                        </div>
                    </div>

                    {/* Username (read-only) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('profile.username')}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                            <input value={user?.username || ''} readOnly
                                className={inputBase + ' pl-8 bg-gray-50 text-gray-400 cursor-not-allowed'} />
                        </div>
                    </div>

                    {(!form.email || !form.phone) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
                            <span className="text-base mt-0.5">🔔</span>
                            <span>{t('profile.notifHint')}</span>
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Email <span className="text-indigo-500 font-normal normal-case">({t('profile.forEmailNotif')})</span>
                        </label>
                        <input type="email" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="your@email.com"
                            className={inputBase} />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            {t('profile.phone')}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="+251912345678"
                                className={inputBase + ' pl-9'} />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Address / Location
                        </label>
                        <input value={form.address}
                            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                            placeholder="e.g. Jimma, Ethiopia"
                            className={inputBase} />
                    </div>

                    {/* Role (read-only) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            {t('profile.role')}
                        </label>
                        <input value={ROLE_LABEL[role] || role} readOnly
                            className={inputBase + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
                    </div>

                    {/* Save */}
                    <button onClick={handleSave} disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 text-sm">
                        {saving ? `${t('common.save')}…` : t('profile.saveChanges')}
                    </button>

                    {/* Change Password */}
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Lock size={13} /> Change Password
                            </p>
                            <button onClick={() => setShowPwSection(p => !p)}
                                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition">
                                {showPwSection ? 'Cancel' : 'Change'}
                            </button>
                        </div>
                        {showPwSection && (
                            <div className="space-y-4">
                                {[
                                    { label: 'Current Password', key: 'currentPassword' as const, show: showCurrent, toggle: () => setShowCurrent(p => !p), placeholder: 'Enter current password' },
                                    { label: 'New Password', key: 'newPassword' as const, show: showNew, toggle: () => setShowNew(p => !p), placeholder: 'Min 6 characters' },
                                    { label: 'Confirm New Password', key: 'confirmPassword' as const, show: showConfirm, toggle: () => setShowConfirm(p => !p), placeholder: 'Repeat new password' },
                                ].map(({ label, key, show, toggle, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                                        <div className="relative">
                                            <input type={show ? 'text' : 'password'} value={pwForm[key]}
                                                onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                                                className={inputBase + ' pr-11'}
                                                placeholder={placeholder} />
                                            <button type="button" onClick={toggle}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleChangePassword} disabled={changingPw}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-indigo-500/20">
                                    {changingPw ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

