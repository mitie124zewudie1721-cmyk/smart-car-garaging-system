// src/pages/GarageOwner/Withdrawal.tsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';

interface Withdrawal {
    _id: string; amount: number; status: string;
    bankDetails: { bankName: string; accountNumber?: string; phoneNumber?: string; accountName: string };
    createdAt: string; completedAt?: string; rejectionReason?: string;
}
interface Wallet { balance: number; totalEarned: number; totalWithdrawn: number; }

const BANKS = [
    { name: 'CBE', code: 'CBE', label: 'Commercial Bank of Ethiopia' },
    { name: 'Abyssinia', code: 'ABYSSINIA', label: 'Abyssinia Bank' },
    { name: 'Telebirr', code: 'TELEBIRR', label: 'Telebirr (Mobile Money)' },
    { name: 'Awash', code: 'AWASH', label: 'Awash Bank' },
];

const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function Withdrawal() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', bankName: 'CBE', bankCode: 'CBE', accountNumber: '', accountName: '', phoneNumber: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [wr, wdr] = await Promise.all([
                api.get('/payments/my-wallet'),
                api.get('/payments/withdrawal'),
            ]);
            setWallet(wr.data.data);
            setWithdrawals(wdr.data.data || []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (!amount || amount < 50) { toast.error('Minimum withdrawal is 50 ETB'); return; }
        if (wallet && amount > wallet.balance) { toast.error(`Insufficient balance. Available: ${wallet.balance.toFixed(2)} ETB`); return; }
        if (!form.accountName.trim()) { toast.error('Account name is required'); return; }
        if (form.bankName === 'Telebirr' && !form.phoneNumber.trim()) { toast.error('Phone number required for Telebirr'); return; }
        if (form.bankName !== 'Telebirr' && !form.accountNumber.trim()) { toast.error('Account number required'); return; }

        setSubmitting(true);
        try {
            await api.post('/payments/withdrawal/request', {
                amount,
                bankName: form.bankName,
                bankCode: form.bankCode,
                accountNumber: form.accountNumber,
                accountName: form.accountName,
                phoneNumber: form.phoneNumber,
            });
            toast.success('Withdrawal request submitted! Admin will process within 24 hours.');
            setShowForm(false);
            setForm({ amount: '', bankName: 'CBE', bankCode: 'CBE', accountNumber: '', accountName: '', phoneNumber: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit withdrawal');
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;

    const hasPending = withdrawals.some(w => w.status === 'pending');

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💸 Withdraw Earnings</h1>
                <p className="text-gray-500 mt-1">Request a withdrawal from your wallet balance</p>
            </div>

            {/* Wallet summary */}
            {wallet && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Available Balance', value: wallet.balance.toFixed(2), color: 'from-emerald-500 to-emerald-600', suffix: ' ETB' },
                        { label: 'Total Earned', value: wallet.totalEarned.toFixed(2), color: 'from-indigo-500 to-indigo-600', suffix: ' ETB' },
                        { label: 'Total Withdrawn', value: wallet.totalWithdrawn.toFixed(2), color: 'from-violet-500 to-violet-600', suffix: ' ETB' },
                    ].map(c => (
                        <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-white shadow-lg`}>
                            <p className="text-white/70 text-xs mb-1">{c.label}</p>
                            <p className="text-xl font-bold">{c.value}{c.suffix}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-blue-800 mb-2">💡 How Withdrawal Works</p>
                <div className="text-xs text-blue-700 space-y-1">
                    <p>1. You request a withdrawal — amount is reserved from your wallet</p>
                    <p>2. Admin reviews and approves within 24 hours</p>
                    <p>3. Money is transferred to your bank/Telebirr via Chapa</p>
                    <p>4. If rejected, amount is refunded back to your wallet</p>
                    <p className="font-semibold">Minimum: 50 ETB | Only one pending request at a time</p>
                </div>
            </div>

            {/* Request button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    disabled={hasPending || (wallet?.balance || 0) < 50}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
                >
                    {hasPending ? '⏳ Withdrawal Pending...' : (wallet?.balance || 0) < 50 ? 'Insufficient Balance (min 50 ETB)' : '+ Request Withdrawal'}
                </button>
            )}

            {/* Withdrawal form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg">New Withdrawal Request</h3>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount (ETB) *</label>
                        <input type="number" min="50" max={wallet?.balance || 0} step="0.01"
                            value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                            placeholder={`Max: ${wallet?.balance.toFixed(2)} ETB`}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bank / Payment Method *</label>
                        <select value={form.bankName}
                            onChange={e => { const b = BANKS.find(b => b.name === e.target.value)!; setForm(p => ({ ...p, bankName: b.name, bankCode: b.code })); }}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            {BANKS.map(b => <option key={b.code} value={b.name}>{b.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Account Holder Name *</label>
                        <input type="text" value={form.accountName}
                            onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))}
                            placeholder="Full name as registered"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>

                    {form.bankName === 'Telebirr' ? (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telebirr Phone Number *</label>
                            <input type="tel" value={form.phoneNumber}
                                onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                placeholder="+251912345678"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Account Number *</label>
                            <input type="text" value={form.accountNumber}
                                onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}
                                placeholder="Bank account number"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowForm(false)}
                            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold shadow disabled:opacity-60 transition-all">
                            {submitting ? 'Submitting...' : `Request ${form.amount ? parseFloat(form.amount).toFixed(2) : '0'} ETB`}
                        </button>
                    </div>
                </form>
            )}

            {/* Withdrawal history */}
            <div>
                <h3 className="font-bold text-slate-700 mb-3">Withdrawal History</h3>
                {withdrawals.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
                        No withdrawal requests yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {withdrawals.map(w => (
                            <div key={w._id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">{w.amount.toFixed(2)} ETB</p>
                                        <p className="text-xs text-slate-400">{w.bankDetails.bankName} — {w.bankDetails.accountName}</p>
                                        <p className="text-xs text-slate-400">{w.bankDetails.accountNumber || w.bankDetails.phoneNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[w.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {w.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
                                        ❌ Rejected: {w.rejectionReason}
                                    </p>
                                )}
                                {w.completedAt && (
                                    <p className="text-xs text-emerald-600 mt-1">✅ Completed: {new Date(w.completedAt).toLocaleString()}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
