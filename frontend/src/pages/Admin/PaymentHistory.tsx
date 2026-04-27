// src/pages/Admin/PaymentHistory.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface Payment {
    _id: string;
    amount: number;
    paymentMethod: string;
    paymentProvider?: string;
    status: string;
    transactionId: string;
    isVerified: boolean;
    commissionRate?: number;
    commissionAmount?: number;
    garageEarnings?: number;
    createdAt: string;
    user?: { name: string; phone?: string; username: string };
    reservation?: { serviceType: string; garage?: { name: string } };
    metadata?: { isDeposit?: boolean; actualMethod?: string; type?: string };
}

const STATUS_COLOR: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-100 text-gray-700',
};

const METHOD_LABEL: Record<string, string> = {
    telebirr: '📱 Telebirr',
    cbe_birr: '🏦 CBE Birr',
    bank_transfer_cbe: '🏦 CBE Bank',
    bank_transfer_abyssinia: '🏛️ Abyssinia',
    cash: '💵 Cash',
};

const CHAPA_METHOD: Record<string, string> = {
    mpesa: '📱 M-PESA',
    telebirr: '📱 Telebirr',
    cbe: '🏦 CBE Birr',
    cbebirr: '🏦 CBE Birr',
    card: '💳 Card',
    test: '📱 Telebirr', // test mode defaults to Telebirr
};

function getMethodDisplay(p: Payment): string {
    // Use actual method from Chapa verification if available
    if (p.metadata?.actualMethod) {
        const key = p.metadata.actualMethod.toLowerCase().replace(/[^a-z]/g, '');
        return CHAPA_METHOD[key] || p.metadata.actualMethod;
    }
    // Chapa payment — show the payment method used
    if (p.paymentProvider === 'chapa' || p.transactionId?.startsWith('SGS-')) {
        return METHOD_LABEL[p.paymentMethod] || '📱 Telebirr';
    }
    return METHOD_LABEL[p.paymentMethod] || p.paymentMethod?.replace(/_/g, ' ') || '—';
}

export default function AdminPaymentHistory() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ total: 0, commission: 0, count: 0 });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (methodFilter !== 'all') params.method = methodFilter;
            const res = await api.get('/payments/admin/all', { params });
            setPayments(res.data.data || []);
            setTotalPages(res.data.pagination?.pages || 1);
            setSummary({
                total: res.data.summary?.total || 0,
                commission: res.data.summary?.commission || 0,
                count: res.data.pagination?.total || 0,
            });
        } catch (err: any) {
            toast.error('Failed to load payment history');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, [statusFilter, methodFilter, page]);

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💳 Payment History</h1>
                <p className="text-gray-500 mt-1">All transactions across the platform</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Transactions', value: summary.count, color: 'from-indigo-500 to-indigo-600', suffix: '' },
                    { label: 'Total Revenue', value: summary.total.toFixed(2), color: 'from-emerald-500 to-emerald-600', suffix: ' ETB' },
                    { label: 'Platform Commission (10%)', value: summary.commission.toFixed(2), color: 'from-violet-500 to-violet-600', suffix: ' ETB' },
                    { label: 'Garage Earnings (90%)', value: (summary.total - summary.commission).toFixed(2), color: 'from-cyan-500 to-cyan-600', suffix: ' ETB' },
                ].map(c => (
                    <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg`}>
                        <p className="text-white/70 text-sm mb-1">{c.label}</p>
                        <p className="text-2xl font-bold">{c.value}{c.suffix}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex gap-2">
                    {['all', 'success', 'pending', 'failed', 'refunded'].map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {['all', 'telebirr', 'cbe_birr', 'bank_transfer_cbe', 'bank_transfer_abyssinia'].map(m => (
                        <button key={m} onClick={() => { setMethodFilter(m); setPage(1); }}
                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${methodFilter === m ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {m === 'all' ? 'All Methods' : METHOD_LABEL[m] || m}
                        </button>
                    ))}
                </div>
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
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Date', 'Customer', 'Garage', 'Service', 'Method', 'Tx ID', 'Amount', 'Commission', 'Garage Earnings', 'Status', 'Verified'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payments.map(p => (
                                    <tr key={p._id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(p.createdAt).toLocaleDateString()}<br />
                                            <span className="text-slate-400">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800 text-sm">{p.user?.name || '—'}</p>
                                            <p className="text-xs text-slate-400">{p.user?.phone || p.user?.username}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {p.reservation?.garage?.name || (p.metadata?.type === 'registration_fee' ? 'Platform' : 'N/A')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-slate-700">
                                                {p.metadata?.type === 'registration_fee'
                                                    ? 'Registration Fee'
                                                    : (p.reservation?.serviceType || 'N/A')}
                                            </p>
                                            {p.metadata?.isDeposit && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Deposit</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{getMethodDisplay(p)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[100px] truncate">{p.transactionId}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-800 whitespace-nowrap">{p.amount.toFixed(2)} ETB</td>
                                        <td className="px-4 py-3 text-sm text-red-600 whitespace-nowrap">{p.commissionAmount ? `${p.commissionAmount.toFixed(2)} ETB` : '—'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">{p.garageEarnings ? `${p.garageEarnings.toFixed(2)} ETB` : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status] || STATUS_COLOR.pending}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {p.isVerified ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
