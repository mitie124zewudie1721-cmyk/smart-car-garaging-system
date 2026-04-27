// src/pages/Admin/ArchiveHistory.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface Archived {
    _id: string;
    originalId: string;
    user?: { name: string; email?: string };
    garage?: { name: string };
    serviceType: string;
    totalPrice: number;
    depositAmount: number;
    paymentStatus: string;
    paymentMethod?: string;
    commissionRate?: number;
    commissionAmount?: number;
    garageEarnings?: number;
    chapaRef?: string;
    startTime: string;
    endTime: string;
    reservationCreatedAt: string;
    serviceCompletedAt: string;
    paymentConfirmedAt: string;
    archivedAt: string;
    slotRestored: boolean;
}

const statusColor: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
};

export default function ArchiveHistory() {
    const [records, setRecords] = useState<Archived[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sweeping, setSweeping] = useState(false);
    const [search, setSearch] = useState('');

    const fetchArchives = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/reservations/admin/archived?page=${p}&limit=20`);
            setRecords(res.data.data || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.pages || 1);
            setPage(p);
        } catch {
            toast.error('Failed to load archive history');
        } finally {
            setLoading(false);
        }
    };

    const runSweep = async () => {
        setSweeping(true);
        try {
            const res = await api.post('/reservations/admin/archive-sweep');
            toast.success(`Archive sweep: ${res.data.archived} reservation(s) archived`);
            fetchArchives(1);
        } catch {
            toast.error('Sweep failed');
        } finally {
            setSweeping(false);
        }
    };

    useEffect(() => { fetchArchives(); }, []);

    const filtered = search
        ? records.filter(r =>
            r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.garage?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.serviceType?.toLowerCase().includes(search.toLowerCase())
        )
        : records;

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        🗄️ Archive History
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Completed & paid reservations — {total} total records
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={runSweep}
                        disabled={sweeping}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition"
                    >
                        {sweeping ? '⏳ Running...' : '🔄 Run Archive Sweep'}
                    </button>
                    <button
                        onClick={() => fetchArchives(page)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Archived', value: total, color: 'from-indigo-500 to-indigo-600', icon: '🗄️' },
                    { label: 'Total Revenue', value: `${records.reduce((s, r) => s + r.totalPrice, 0).toLocaleString()} ETB`, color: 'from-emerald-500 to-emerald-600', icon: '💰' },
                    { label: 'Platform Commission', value: `${records.reduce((s, r) => s + (r.commissionAmount || 0), 0).toFixed(2)} ETB`, color: 'from-orange-500 to-orange-600', icon: '📊' },
                    { label: 'Garage Earnings', value: `${records.reduce((s, r) => s + (r.garageEarnings || 0), 0).toFixed(2)} ETB`, color: 'from-teal-500 to-teal-600', icon: '🏢' },
                ].map(s => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-lg`}>
                        <p className="text-xs opacity-80 mb-1">{s.icon} {s.label}</p>
                        <p className="text-xl font-black">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by customer, garage or service..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader size="lg" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-5xl mb-3">🗄️</p>
                    <p className="font-semibold text-lg">No archived records yet</p>
                    <p className="text-sm mt-1">Reservations appear here after service completion + payment</p>
                    <button onClick={runSweep} disabled={sweeping}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60">
                        {sweeping ? 'Running...' : '🔄 Run Archive Sweep Now'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        {['Archived On', 'Customer', 'Garage', 'Service', 'Total', 'Commission', 'Garage Earnings', 'Payment', 'Slot Restored'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.map(r => (
                                        <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(r.archivedAt).toLocaleDateString()}<br />
                                                <span className="text-slate-400">{new Date(r.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-800 dark:text-white">{r.user?.name || '—'}</p>
                                                <p className="text-xs text-slate-400">{r.user?.email || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{r.garage?.name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-slate-700 dark:text-slate-300">{r.serviceType}</p>
                                                <p className="text-xs text-slate-400">{new Date(r.startTime).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                                {r.totalPrice.toLocaleString()} ETB
                                            </td>
                                            <td className="px-4 py-3 text-orange-600 font-semibold whitespace-nowrap">
                                                {r.commissionAmount ? `${r.commissionAmount.toFixed(2)} ETB` : '—'}
                                                {r.commissionRate && <span className="text-xs text-slate-400 ml-1">({(r.commissionRate * 100).toFixed(0)}%)</span>}
                                            </td>
                                            <td className="px-4 py-3 text-emerald-600 font-semibold whitespace-nowrap">
                                                {r.garageEarnings ? `${r.garageEarnings.toFixed(2)} ETB` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[r.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                                                    {r.paymentStatus}
                                                </span>
                                                {r.paymentMethod && <p className="text-xs text-slate-400 mt-0.5">{r.paymentMethod}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {r.slotRestored
                                                    ? <span className="text-emerald-500 text-lg">✅</span>
                                                    : <span className="text-red-400 text-lg">❌</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button onClick={() => fetchArchives(page - 1)} disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition">
                                ← Prev
                            </button>
                            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                            <button onClick={() => fetchArchives(page + 1)} disabled={page === totalPages}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition">
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
