// src/pages/Admin/Withdrawals.tsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface Withdrawal {
    _id: string; amount: number; status: string;
    garageOwner: { name: string; username: string; phone?: string };
    bankDetails: { bankName: string; accountNumber?: string; phoneNumber?: string; accountName: string; bankCode: string };
    createdAt: string; completedAt?: string; rejectionReason?: string;
    reviewedBy?: { name: string };
}

const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const r = await api.get('/payments/withdrawal');
            setWithdrawals(r.data.data || []);
        } catch { toast.error('Failed to load withdrawals'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    const handleProcess = async (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject' && !rejectReason.trim()) { toast.error('Please enter rejection reason'); return; }
        setProcessing(id);
        try {
            await api.patch(`/payments/withdrawal/${id}/process`, {
                action,
                rejectionReason: rejectReason,
            });
            toast.success(action === 'approve' ? 'Withdrawal approved and processed!' : 'Withdrawal rejected');
            setRejectingId(null); setRejectReason('');
            fetchWithdrawals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process');
        } finally { setProcessing(null); }
    };

    const handleMarkCompleted = async (id: string) => {
        setProcessing(id);
        try {
            await api.patch(`/payments/withdrawal/${id}/mark-completed`);
            toast.success('Marked as completed — garage owner notified');
            fetchWithdrawals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setProcessing(null); }
    };

    const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);
    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    💸 Withdrawal Requests
                    {pendingCount > 0 && <span className="ml-3 px-3 py-1 bg-amber-500 text-white text-sm rounded-full">{pendingCount} pending</span>}
                </h1>
                <p className="text-gray-500 mt-1">Review and process garage owner withdrawal requests</p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
                {['all', 'pending', 'approved', 'processing', 'completed', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === s ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        {s !== 'all' && ` (${withdrawals.filter(w => w.status === s).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader size="lg" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
                    No withdrawal requests found
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(w => (
                        <div key={w._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="font-bold text-slate-800 text-xl">{w.amount.toFixed(2)} ETB</p>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[w.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        <div><span className="text-slate-400">Owner:</span> <span className="font-medium text-slate-700">{w.garageOwner?.name}</span></div>
                                        <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{w.garageOwner?.phone || '—'}</span></div>
                                        <div><span className="text-slate-400">Bank:</span> <span className="font-medium text-slate-700">{w.bankDetails.bankName}</span></div>
                                        <div><span className="text-slate-400">Account:</span> <span className="font-mono text-slate-700">{w.bankDetails.accountNumber || w.bankDetails.phoneNumber}</span></div>
                                        <div><span className="text-slate-400">Name:</span> <span className="text-slate-700">{w.bankDetails.accountName}</span></div>
                                        <div><span className="text-slate-400">Requested:</span> <span className="text-slate-700">{new Date(w.createdAt).toLocaleString()}</span></div>
                                    </div>
                                    {w.rejectionReason && (
                                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">❌ {w.rejectionReason}</p>
                                    )}
                                    {w.completedAt && (
                                        <p className="text-xs text-emerald-600 mt-1">✅ Completed: {new Date(w.completedAt).toLocaleString()}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                {w.status === 'pending' && (
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleProcess(w._id, 'approve')}
                                            disabled={processing === w._id}
                                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-60">
                                            {processing === w._id ? '...' : '✓ Approve & Transfer'}
                                        </button>
                                        <button
                                            onClick={() => setRejectingId(w._id)}
                                            className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-xl hover:bg-red-100 transition">
                                            ✕ Reject
                                        </button>
                                    </div>
                                )}
                                {w.status === 'approved' && (
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 max-w-[200px]">
                                            <p className="font-bold mb-1">⚠ Manual Transfer Required</p>
                                            <p>Send <strong>{w.amount} ETB</strong> to:</p>
                                            <p className="font-mono mt-1">{w.bankDetails.bankName}</p>
                                            <p className="font-mono">{w.bankDetails.accountName}</p>
                                            <p className="font-mono">{w.bankDetails.accountNumber || w.bankDetails.phoneNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => handleMarkCompleted(w._id)}
                                            disabled={processing === w._id}
                                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-60">
                                            {processing === w._id ? '...' : '✓ Mark as Sent'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reject form */}
                            {rejectingId === w._id && (
                                <div className="mt-4 border-t pt-4">
                                    <input type="text" value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-2" />
                                    <div className="flex gap-2">
                                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                            className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition">Cancel</button>
                                        <button onClick={() => handleProcess(w._id, 'reject')} disabled={processing === w._id}
                                            className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60">
                                            Confirm Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
