import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface TrashedUser {
    _id: string; name: string; username: string; role: string;
    deletedAt: string; phone?: string;
}
interface TrashedGarage {
    _id: string; name: string; verificationStatus: string;
    deletedAt: string; owner?: { name: string; username: string };
    location?: { address?: string };
}

export default function Trash() {
    const [users, setUsers] = useState<TrashedUser[]>([]);
    const [garages, setGarages] = useState<TrashedGarage[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'users' | 'garages'>('users');

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const r = await api.get('/admin/trash');
            setUsers(r.data.data.users || []);
            setGarages(r.data.data.garages || []);
        } catch { toast.error('Failed to load trash'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTrash(); }, []);

    const restoreUser = async (id: string) => {
        if (!confirm('Restore this user?')) return;
        try {
            await api.patch(`/admin/trash/users/${id}/restore`);
            toast.success('User restored');
            fetchTrash();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const permanentDeleteUser = async (id: string) => {
        if (!confirm('Permanently delete this user and all their data? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/trash/users/${id}/permanent`);
            toast.success('Permanently deleted');
            fetchTrash();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const restoreGarage = async (id: string) => {
        if (!confirm('Restore this garage?')) return;
        try {
            await api.patch(`/admin/trash/garages/${id}/restore`);
            toast.success('Garage restored');
            fetchTrash();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const permanentDeleteGarage = async (id: string) => {
        if (!confirm('Permanently delete this garage? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/trash/garages/${id}/permanent`);
            toast.success('Permanently deleted');
            fetchTrash();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🗑️</span>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Trash</h1>
                    <p className="text-slate-500 text-sm">Deleted items — restore or permanently delete</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(['users', 'garages'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {t === 'users' ? `👤 Users (${users.length})` : `🏢 Garages (${garages.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-16 text-slate-400">Loading trash...</div>
            ) : tab === 'users' ? (
                users.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                        <p className="text-4xl mb-3">✅</p>
                        <p className="text-slate-500">No deleted users</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map(u => (
                            <div key={u._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{u.name}</p>
                                        <p className="text-xs text-slate-400">@{u.username} · <span className="capitalize">{u.role?.replace('_', ' ')}</span></p>
                                        <p className="text-xs text-red-400 mt-0.5">Deleted {new Date(u.deletedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => restoreUser(u._id)}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition">
                                        ↩ Restore
                                    </button>
                                    <button onClick={() => permanentDeleteUser(u._id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                                        🗑 Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                garages.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                        <p className="text-4xl mb-3">✅</p>
                        <p className="text-slate-500">No deleted garages</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {garages.map(g => (
                            <div key={g._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 shadow-sm">
                                <div>
                                    <p className="font-semibold text-slate-800">{g.name}</p>
                                    <p className="text-xs text-slate-400">{g.location?.address || 'No address'}</p>
                                    {g.owner && <p className="text-xs text-slate-400">Owner: {g.owner.name} (@{g.owner.username})</p>}
                                    <p className="text-xs text-red-400 mt-0.5">Deleted {new Date(g.deletedAt).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => restoreGarage(g._id)}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition">
                                        ↩ Restore
                                    </button>
                                    <button onClick={() => permanentDeleteGarage(g._id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                                        🗑 Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
