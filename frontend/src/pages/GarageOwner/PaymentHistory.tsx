// src/pages/GarageOwner/PaymentHistory.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface Payment {
    _id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    transactionId: string;
    isVerified: boolean;
    commissionRate?: number;
    commissionAmount?: number;
    garageEarnings?: number;
    createdAt: string;
    user?: { name: string; phone?: string; username: string };
    reservation?: { serviceType: string; garage?: { name: string } };
    metadata?: { isDeposit?: boolean };
}

const STATUS_COLOR: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-100 text-gray-700',
};

const METHOD_LABEL: Record<string, string> = {
    cash: '💵 Cash',
    telebirr: '📱 Telebirr',
    cbe_birr: '🏦 CBE Birr',
    bank_transfer_cbe: '🏦 CBE Bank',
    bank_transfer_abyssinia: '🏛️ Abyssinia',
};

export default function PaymentHistory() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ totalRevenue: 0, totalEarnings: 0, totalCount: 0 });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 15 };
            if (filter !== 'all') params.status = filter;
            const res = await api.get('/payments/garage-payments', { params });
            const data = res.data.data || [];
            setPayments(data);
            setTotalPages(res.data.pagination?.pages || 1);
            // Calculate summary
            const revenue = data.reduce((s: number, p: Payment) => p.status === 'success' ? s + p.amount : s, 0);
            const earnings = data.reduce((s: number, p: Payment) => p.status === 'success' ? s + (p.garageEarnings || 0) : s, 0);
            setSummary({ totalRevenue: revenue, totalEarnings: earnings, totalCount: res.data.pagination?.total || data.length });
        } catch (err: any) {
            toast.error('Failed to load payment history');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, [filter, page]);

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
                <p className="text-gray-500 mt-1">All payments received for your garages</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Payments', value: summary.totalCount, color: 'from-indigo-500 to-indigo-600', suffix: '' },
                    { label: 'Total Revenue', value: summary.totalRevenue.toFixed(2), color: 'from-emerald-500 to-emerald-600', suffix: ' ETB' },
                    { label: 'Your Earnings (90%)', value: summary.totalEarnings.toFixed(2), color: 'from-violet-500 to-violet-600', suffix: ' ETB' },
                ].map(c => (
                    <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg`}>
                        <p className="text-white/70 text-sm mb-1">{c.label}</p>
                        <p className="text-2xl font-bold">{c.value}{c.suffix}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
                {['all', 'success', 'pending', 'failed'].map(s => (
                    <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === s ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader size="lg" /></div>
            ) : payments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                    <p className="text-5xl mb-3">💳</p>
                    <p className="text-slate-500">No payment records found.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        {/* Table header */}
                        <div className="grid grid-cols-7 gap-2 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <span className="col-span-2">Customer</span>
                            <span>Service</span>
                            <span>Method</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">Your Share</span>
                            <span className="text-center">Status</span>
                        </div>

                        {payments.map(p => (
                            <div key={p._id} className="grid grid-cols-7 gap-2 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition text-sm items-center">
                                <div className="col-span-2">
                                    <p className="font-semibold text-slate-800">{p.user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-400">{p.user?.phone || p.user?.username || ''}</p>
                                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div>
                                    <p className="text-slate-700">
                                        {(p.metadata as any)?.type === 'registration_fee'
                                            ? '🏢 Registration Fee'
                                            : (p.reservation?.serviceType || '—')}
                                    </p>
                                    {p.metadata?.isDeposit && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Deposit</span>}
                                </div>
                                <div>
                                    <p>{METHOD_LABEL[p.paymentMethod] || p.paymentMethod}</p>
                                    {p.transactionId && <p className="text-xs text-slate-400 font-mono truncate max-w-[80px]">{p.transactionId}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">{p.amount.toFixed(2)} ETB</p>
                                    {p.commissionAmount ? <p className="text-xs text-red-500">-{p.commissionAmount.toFixed(2)} comm.</p> : null}
                                </div>
                                <div className="text-right">
                                    {(p.metadata as any)?.type === 'registration_fee' ? (
                                        <p className="font-bold text-orange-600">-{p.amount.toFixed(2)} ETB</p>
                                    ) : (
                                        <p className="font-bold text-emerald-600">{(p.garageEarnings ?? p.amount).toFixed(2)} ETB</p>
                                    )}
                                    {p.isVerified && <p className="text-xs text-emerald-500">✓ Verified</p>}
                                </div>
                                <div className="text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status] || STATUS_COLOR.pending}`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-5">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">← Prev</button>
                            <span className="px-4 py-2 text-slate-500 text-sm">{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
