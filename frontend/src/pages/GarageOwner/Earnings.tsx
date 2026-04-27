// src/pages/GarageOwner/Earnings.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PaymentItem { amount: number; commissionAmount: number; garageEarnings: number; paymentMethod: string; createdAt: string; }
interface GarageEarning { garageId: string; garageName: string; totalRevenue: number; totalCommission: number; totalEarnings: number; paymentCount: number; payoutSent: boolean; payments: PaymentItem[]; }
interface EarningsData { month: number; year: number; garages: GarageEarning[]; totals: { revenue: number; commission: number; earnings: number; payoutSent: boolean; }; }
interface WalletTx { type: 'credit' | 'debit'; amount: number; description: string; createdAt: string; }
interface WalletData { balance: number; totalEarned: number; totalWithdrawn: number; transactions: WalletTx[]; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const METHOD_LABELS: Record<string, string> = { cash:'Cash', telebirr:'Telebirr', cbe_birr:'CBE Birr', bank_transfer_cbe:'CBE Bank', bank_transfer_abyssinia:'Abyssinia Bank' };
const fmt = (n: number) => `${n.toLocaleString('en-ET',{minimumFractionDigits:2,maximumFractionDigits:2})} ETB`;

export default function Earnings() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<EarningsData | null>(null);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showTx, setShowTx] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [er, wr] = await Promise.all([
                api.get(`/payments/my-earnings?month=${month}&year=${year}`),
                api.get('/payments/my-wallet'),
            ]);
            setData(er.data.data);
            setWallet(wr.data.data);
        } catch { toast.error('Failed to load earnings'); }
        finally { setLoading(false); }
    }, [month, year]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Earnings & Wallet</h1>
                    <p className="text-slate-500 text-sm mt-1">System auto-deducts 10% commission and credits 90% to your wallet on every verified payment.</p>
                </div>

                {/* Wallet card */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-indigo-200 text-sm">Wallet Balance</p>
                            <p className="text-4xl font-black mt-1">{wallet ? fmt(wallet.balance) : '— ETB'}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-xs text-indigo-200">Auto-credited</p>
                            <p className="text-sm font-bold">90% per payment</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div><p className="text-indigo-200 text-xs">Total Earned (lifetime)</p><p className="text-lg font-bold">{wallet ? fmt(wallet.totalEarned) : '—'}</p></div>
                        <div><p className="text-indigo-200 text-xs">Platform Commission (10%)</p><p className="text-lg font-bold text-indigo-300">{wallet ? fmt(wallet.totalEarned * 0.1111) : '—'}</p></div>
                    </div>
                    <button onClick={() => setShowTx(v => !v)} className="mt-4 text-xs text-indigo-200 hover:text-white underline transition">
                        {showTx ? 'Hide' : 'Show'} recent transactions
                    </button>
                </div>

                {/* Wallet transactions */}
                {showTx && wallet && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-700">Recent Transactions</h3></div>
                        {wallet.transactions.length === 0
                            ? <p className="text-center text-slate-400 py-8 text-sm">No transactions yet</p>
                            : <div className="divide-y divide-slate-50">
                                {wallet.transactions.map((tx, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{tx.type === 'credit' ? '+' : '-'}</div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{tx.description || 'Transaction'}</p>
                                                <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                )}

                {/* Month selector */}
                <div className="flex gap-3 mb-6 flex-wrap items-center">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={fetchAll} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">Refresh</button>
                    <span className="text-sm text-slate-400 ml-auto">{MONTHS[month-1]} {year}</span>
                </div>

                {loading && <div className="text-center py-16 text-slate-400">Loading...</div>}

                {!loading && data && (
                    <>
                        {/* Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                {label:'Total Revenue', value:fmt(data.totals.revenue), color:'text-blue-600', bg:'bg-blue-50', border:'border-blue-100'},
                                {label:'Commission (10%)', value:fmt(data.totals.commission), color:'text-red-500', bg:'bg-red-50', border:'border-red-100'},
                                {label:'Your Earnings (90%)', value:fmt(data.totals.earnings), color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-100'},
                                {label:'Payout Status', value:data.totals.payoutSent ? 'Sent' : 'Pending', color:data.totals.payoutSent ? 'text-emerald-600' : 'text-amber-600', bg:data.totals.payoutSent ? 'bg-emerald-50' : 'bg-amber-50', border:data.totals.payoutSent ? 'border-emerald-100' : 'border-amber-100'},
                            ].map(c => (
                                <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
                                    <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                                    <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 text-sm text-indigo-700">
                            <span className="text-lg">⚡</span>
                            <span>When a payment is verified, <strong>90%</strong> is automatically credited to your wallet and <strong>10%</strong> goes to the platform.</span>
                        </div>

                        {data.garages.length === 0
                            ? <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">No payments found for {MONTHS[month-1]} {year}.</div>
                            : <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Payment Breakdown</h3>
                                {data.garages.map(g => (
                                    <div key={g.garageId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition text-left" onClick={() => setExpanded(expanded === g.garageId ? null : g.garageId)}>
                                            <div>
                                                <p className="font-semibold text-slate-800">{g.garageName}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{g.paymentCount} payment{g.paymentCount !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-base font-bold text-emerald-600">{fmt(g.totalEarnings)}</p>
                                                    <p className="text-xs text-slate-400">your share</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${g.payoutSent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{g.payoutSent ? '✓ Paid Out' : 'Pending'}</span>
                                                <span className="text-slate-400 text-sm">{expanded === g.garageId ? '▲' : '▼'}</span>
                                            </div>
                                        </button>
                                        {expanded === g.garageId && (
                                            <div className="border-t border-slate-100">
                                                <div className="grid grid-cols-5 gap-2 px-5 py-2 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                                    <span>Date</span><span>Method</span><span className="text-right">Amount</span><span className="text-right">Commission</span><span className="text-right">Your Share</span>
                                                </div>
                                                {g.payments.map((p, i) => (
                                                    <div key={i} className="grid grid-cols-5 gap-2 px-5 py-3 border-t border-slate-50 text-sm text-slate-700">
                                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                        <span>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
                                                        <span className="text-right">{p.amount.toFixed(2)}</span>
                                                        <span className="text-right text-red-500">{p.commissionAmount.toFixed(2)}</span>
                                                        <span className="text-right font-semibold text-emerald-600">{p.garageEarnings.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="grid grid-cols-5 gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50 text-sm font-bold">
                                                    <span className="text-slate-500 col-span-2">Total</span>
                                                    <span className="text-right text-blue-600">{g.totalRevenue.toFixed(2)}</span>
                                                    <span className="text-right text-red-500">{g.totalCommission.toFixed(2)}</span>
                                                    <span className="text-right text-emerald-600">{g.totalEarnings.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        }
                    </>
                )}
            </div>
        </div>
    );
}
