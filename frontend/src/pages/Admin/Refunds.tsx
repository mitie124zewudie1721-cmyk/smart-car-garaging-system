// src/pages/Admin/Refunds.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface RefundPayment {
    id: string;
    amount: number;
    escrowStatus: 'refund_pending' | 'refunded';
    escrowRefundReason?: string;
    escrowRefundedAt?: string;
    transactionId?: string;
    chapaRef?: string;
    createdAt: string;
    user?: { name: string; email?: string; phone?: string; username: string };
    reservation?: { id: string; serviceType: string; garage?: { name: string } };
    metadata?: { chapaRefundRef?: string; refundNote?: string };
}

export default function Refunds() {
    const [refunds, setRefunds] = useState<RefundPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<RefundPayment | null>(null);
    const [refundRef, setRefundRef] = useState('');
    const [refundNote, setRefundNote] = useState('');
    const [filter, setFilter] = useState<'all' | 'refund_pending' | 'refunded'>('refund_pending');

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const r = await api.get('/payments/admin/refunds');
            setRefunds(r.data.data || []);
        } catch { toast.error('Failed to load refunds'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRefunds(); }, []);

    // When opening modal, pre-fill with the chapaRef we already have
    const openModal = (r: RefundPayment) => {
        setRefundRef(r.chapaRef || '');
        setRefundNote('');
        setShowModal(r);
    };

    const handleMarkRefunded = async () => {
        if (!showModal) return;
        if (!refundRef.trim()) {
            toast.error('Chapa Reference is required');
            return;
        }
        setProcessing(showModal.id);
        try {
            await api.patch(`/payments/admin/refunds/${showModal.id}/mark-refunded`, {
                chapaRefundRef: refundRef.trim(),
                note: refundNote.trim() || undefined,
            });
            toast.success('Refund marked as completed — car owner notified');
            setShowModal(null);
            setRefundRef('');
            setRefundNote('');
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark refund');
        } finally { setProcessing(null); }
    };

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
    };

    const filtered = filter === 'all' ? refunds : refunds.filter(r => r.escrowStatus === filter);
    const pendingCount = refunds.filter(r => r.escrowStatus === 'refund_pending').length;

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        💸 Deposit Refunds
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
                        )}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage deposit refunds when garage owners reject bookings</p>
                </div>
                <button onClick={fetchRefunds}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                    🔄 Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {(['refund_pending', 'refunded', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {f === 'refund_pending' ? `⏳ Pending (${pendingCount})` : f === 'refunded' ? '✅ Refunded' : 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader size="lg" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-5xl mb-3">✅</p>
                    <p className="font-semibold text-lg">{filter === 'refund_pending' ? 'No pending refunds' : 'No refunds found'}</p>
                    <p className="text-sm mt-1">Refunds appear here when garage owners reject bookings with paid deposits</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(r => (
                        <div key={r.id}
                            className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm ${r.escrowStatus === 'refund_pending' ? 'border-amber-200' : 'border-emerald-200'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.escrowStatus === 'refund_pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {r.escrowStatus === 'refund_pending' ? '⏳ Refund Pending' : '✅ Refunded'}
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <p className="font-bold text-slate-800 dark:text-white text-lg">{r.user?.name || 'Unknown'}</p>
                                    <p className="text-sm text-slate-500">{r.user?.email || r.user?.phone || r.user?.username}</p>

                                    <div className="mt-3 space-y-1.5 text-sm">
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-400">Garage: </span><span className="font-medium text-slate-700">{r.reservation?.garage?.name || '—'}</span></span>
                                            <span><span className="text-slate-400">Service: </span><span className="font-medium text-slate-700">{r.reservation?.serviceType || '—'}</span></span>
                                        </div>

                                        {/* Chapa Reference — what appears in Chapa dashboard "CHAPA REFERENCE" column */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 text-xs">Chapa Reference:</span>
                                            {r.chapaRef ? (
                                                <button
                                                    onClick={() => copy(r.chapaRef!, 'Chapa Reference')}
                                                    className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1"
                                                    title="Click to copy"
                                                >
                                                    {r.chapaRef} <span className="text-indigo-400">📋</span>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not yet verified — payment may still be pending</span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-slate-400 text-xs">Reason: </span>
                                            <span className="text-slate-600 text-xs">{r.escrowRefundReason || 'Booking rejected'}</span>
                                        </div>
                                    </div>

                                    {r.escrowStatus === 'refunded' && r.escrowRefundedAt && (
                                        <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs text-emerald-700">
                                            ✅ Refunded on {new Date(r.escrowRefundedAt).toLocaleString()}
                                            {r.metadata?.chapaRefundRef && ` · Ref: ${r.metadata.chapaRefundRef}`}
                                            {r.metadata?.refundNote && ` · ${r.metadata.refundNote}`}
                                        </div>
                                    )}
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{r.amount.toLocaleString()} ETB</p>
                                    <p className="text-xs text-slate-400 mb-3">Deposit amount</p>
                                    {r.escrowStatus === 'refund_pending' && (
                                        <button
                                            onClick={() => openModal(r)}
                                            disabled={processing === r.id}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-60"
                                        >
                                            ✓ Mark as Refunded
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">✅ Mark Deposit as Refunded</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Confirm you have refunded <strong>{showModal.amount.toLocaleString()} ETB</strong> to <strong>{showModal.user?.name}</strong> via Chapa dashboard.
                        </p>

                        <div className="space-y-3">
                            {/* Show the expected reference so admin knows what to enter */}
                            {showModal.chapaRef && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-0.5">Expected Chapa Reference</p>
                                        <p className="font-mono text-sm font-bold text-indigo-800">{showModal.chapaRef}</p>
                                    </div>
                                    <button
                                        onClick={() => { setRefundRef(showModal.chapaRef!); copy(showModal.chapaRef!, 'Reference'); }}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition font-semibold"
                                    >
                                        Use this
                                    </button>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Chapa Reference <span className="text-red-500">*</span>
                                    <span className="ml-1 text-slate-400 normal-case font-normal">(must match exactly)</span>
                                </label>
                                <input
                                    type="text"
                                    value={refundRef}
                                    onChange={e => setRefundRef(e.target.value)}
                                    placeholder="e.g. APpjT1Po6GJaC"
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800 dark:text-white ${!refundRef.trim()
                                        ? 'border-red-300 dark:border-red-500'
                                        : showModal.chapaRef && refundRef.trim() !== showModal.chapaRef
                                            ? 'border-orange-400 dark:border-orange-500'
                                            : 'border-emerald-300 dark:border-emerald-600'
                                        }`}
                                />
                                {!refundRef.trim() && (
                                    <p className="text-xs text-red-500 mt-1">Required — must match the Chapa Reference exactly</p>
                                )}
                                {refundRef.trim() && showModal.chapaRef && refundRef.trim() !== showModal.chapaRef && (
                                    <p className="text-xs text-orange-600 mt-1">⚠️ This does not match the stored Chapa Reference — the server will reject it</p>
                                )}
                                {refundRef.trim() && showModal.chapaRef && refundRef.trim() === showModal.chapaRef && (
                                    <p className="text-xs text-emerald-600 mt-1">✅ Reference matches</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
                                <input type="text" value={refundNote} onChange={e => setRefundNote(e.target.value)}
                                    placeholder="e.g. Refunded via Telebirr"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => { setShowModal(null); setRefundRef(''); setRefundNote(''); }}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleMarkRefunded} disabled={!!processing || !refundRef.trim() || (!!showModal.chapaRef && refundRef.trim() !== showModal.chapaRef)}
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed">
                                {processing ? '⏳ Processing...' : '✅ Confirm Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
