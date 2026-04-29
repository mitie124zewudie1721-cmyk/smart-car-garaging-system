// src/pages/Admin/CommissionManagement.tsx
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { Settings, Building2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface GarageRate { _id: string; name: string; commissionRate: number; isApproved: boolean; }
interface CommissionRow { garageId: string; garageName: string; totalRevenue: number; totalCommission: number; totalGarageEarnings: number; paymentCount: number; commissionRate: number; }
interface CommissionData { month: number; year: number; autoCollected: boolean; summary: CommissionRow[]; totalCommissionOwed: number; totalCommissionPaid: number; }
interface PayoutRow { garageId: string; garageName: string; ownerName: string; ownerPhone?: string; bankAccounts?: any; totalRevenue: number; totalCommission: number; totalGarageEarnings: number; paymentCount: number; payoutSent: boolean; payoutSentAt?: string; }
interface PayoutData { month: number; year: number; payouts: PayoutRow[]; totalPending: number; totalSent: number; }
interface PlatformAccount { key: string; bank: string; accountNo: string; accountName: string; branch: string; icon: string; color: string; bg: string; border: string; }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CommissionManagement() {
    const now = new Date();
    const [tab, setTab] = useState<'rates' | 'payments' | 'payouts'>('rates');
    const [loading, setLoading] = useState(true);
    const [defaultRate, setDefaultRate] = useState(0);
    const [garages, setGarages] = useState<GarageRate[]>([]);
    const [newDefault, setNewDefault] = useState('');
    const [savingDefault, setSavingDefault] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);
    const [registrationFee, setRegistrationFee] = useState(500);
    const [editingFee, setEditingFee] = useState(false);
    const [feeDraft, setFeeDraft] = useState('500');
    const [savingFee, setSavingFee] = useState(false);
    const [editingAccounts, setEditingAccounts] = useState(false);
    const [accountDraft, setAccountDraft] = useState<PlatformAccount[]>([]);
    const [savingAccounts, setSavingAccounts] = useState(false);
    const [agreementContent, setAgreementContent] = useState('');
    const [agreementVersion, setAgreementVersion] = useState(1);
    const [editingAgreement, setEditingAgreement] = useState(false);
    const [agreementDraft, setAgreementDraft] = useState('');
    const [savingAgreement, setSavingAgreement] = useState(false);
    const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
    const [selYear, setSelYear] = useState(now.getFullYear());
    const [payData, setPayData] = useState<CommissionData | null>(null);
    const [payLoading, setPayLoading] = useState(false);
    const [poMonth, setPoMonth] = useState(now.getMonth() + 1);
    const [poYear, setPoYear] = useState(now.getFullYear());
    const [poData, setPoData] = useState<PayoutData | null>(null);
    const [poLoading, setPoLoading] = useState(false);
    const [poActionId, setPoActionId] = useState<string | null>(null);
    const [poFilter, setPoFilter] = useState<'all' | 'pending' | 'sent'>('all');

    const fetchRates = async () => {
        setLoading(true);
        try {
            const [ratesRes, accountsRes] = await Promise.all([api.get('/admin/commission'), api.get('/admin/platform-accounts')]);
            setDefaultRate(ratesRes.data.data.defaultRate);
            setGarages(ratesRes.data.data.garages);
            setNewDefault(String((ratesRes.data.data.defaultRate * 100).toFixed(1)));
            setPlatformAccounts(accountsRes.data.data?.platformAccounts || accountsRes.data.data || []);
            const fee = accountsRes.data.data?.registrationFee;
            if (fee) { setRegistrationFee(fee); setFeeDraft(String(fee)); }
            try { const ag = await api.get('/admin/agreement'); setAgreementContent(ag.data.data?.content || ''); setAgreementVersion(ag.data.data?.version || 1); } catch { }
        } catch { toast.error('Failed to load settings'); }
        finally { setLoading(false); }
    };
    const fetchPayments = useCallback(async () => {
        setPayLoading(true);
        try { const r = await api.get('/admin/commission/payments', { params: { month: selMonth, year: selYear } }); setPayData(r.data.data); }
        catch { toast.error('Failed to load commission data'); }
        finally { setPayLoading(false); }
    }, [selMonth, selYear]);
    const fetchPayouts = useCallback(async () => {
        setPoLoading(true);
        try { const r = await api.get('/admin/payouts?month=' + poMonth + '&year=' + poYear); setPoData(r.data.data); }
        catch { toast.error('Failed to load cash commission data'); }
        finally { setPoLoading(false); }
    }, [poMonth, poYear]);
    useEffect(() => { fetchRates(); }, []);
    useEffect(() => { if (tab === 'payments') fetchPayments(); }, [tab, fetchPayments]);
    useEffect(() => { if (tab === 'payouts') fetchPayouts(); }, [tab, fetchPayouts]);
    const handleSaveDefault = async () => {
        const p = parseFloat(newDefault) / 100;
        if (isNaN(p) || p < 0 || p > 1) { toast.error('Enter 0-100'); return; }
        setSavingDefault(true);
        try { await api.patch('/admin/commission/default', { rate: p }); toast.success('Default updated'); fetchRates(); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSavingDefault(false); }
    };
    const handleSaveGarage = async (id: string) => {
        const p = parseFloat(editValue) / 100;
        if (isNaN(p) || p < 0 || p > 1) { toast.error('Enter 0-100'); return; }
        setSavingId(id);
        try { await api.patch('/admin/commission/garage/' + id, { rate: p }); toast.success('Updated'); setEditingId(null); fetchRates(); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSavingId(null); }
    };
    const saveFee = async () => {
        const v = Number(feeDraft);
        if (isNaN(v) || v < 0) { toast.error('Invalid amount'); return; }
        setSavingFee(true);
        try { await api.put('/admin/platform-accounts', { registrationFee: v }); setRegistrationFee(v); setEditingFee(false); toast.success('Fee updated'); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSavingFee(false); }
    };
    const handleSaveAccounts = async () => {
        setSavingAccounts(true);
        try { const r = await api.put('/admin/platform-accounts', { accounts: accountDraft }); setPlatformAccounts(r.data.data?.platformAccounts || r.data.data || []); setEditingAccounts(false); toast.success('Accounts updated'); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSavingAccounts(false); }
    };
    const saveAgreement = async () => {
        if (!agreementDraft.trim()) { toast.error('Cannot be empty'); return; }
        setSavingAgreement(true);
        try { const r = await api.put('/admin/agreement', { content: agreementDraft }); setAgreementContent(r.data.data?.content || agreementDraft); setAgreementVersion(r.data.data?.version || agreementVersion + 1); setEditingAgreement(false); toast.success('Agreement updated'); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSavingAgreement(false); }
    };
    const handleTogglePayout = async (garageId: string, currentSent: boolean) => {
        setPoActionId(garageId);
        try { await api.patch('/admin/payouts/' + garageId + '/mark-sent', { month: poMonth, year: poYear, sent: !currentSent }); toast.success(!currentSent ? 'Commission marked as received' : 'Marked as pending'); fetchPayouts(); }
        catch { toast.error('Failed'); }
        finally { setPoActionId(null); }
    };
    const updateDraft = (idx: number, field: keyof PlatformAccount, val: string) =>
        setAccountDraft(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
    const prevSel = () => { if (selMonth === 1) { setSelMonth(12); setSelYear(y => y - 1); } else setSelMonth(m => m - 1); };
    const nextSel = () => { if (selMonth === 12) { setSelMonth(1); setSelYear(y => y + 1); } else setSelMonth(m => m + 1); };
    const poFiltered = poData?.payouts.filter(p => poFilter === 'all' ? true : poFilter === 'pending' ? !p.payoutSent : p.payoutSent) ?? [];
    if (loading && tab === 'rates') return <div className="flex items-center justify-center min-h-[60vh]"><Loader size="lg" /></div>;

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f8faff 0%,#eef2ff 40%,#f5f3ff 100%)' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Commission &amp; Payouts</h1>

                </div>
                <div className="flex gap-2 mb-6 bg-white border border-indigo-100 rounded-xl p-1 w-fit shadow-sm flex-wrap">
                    {(['rates', 'payments', 'payouts'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={"px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 " + (tab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600')}>
                            {t === 'rates' ? 'Commission Rates' : t === 'payments' ? 'Commission Collected' : ''}
                        </button>
                    ))}
                </div>

                {tab === 'rates' && (
                    <>

                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Settings className="w-5 h-5 text-indigo-600" /></div>
                                <div><h2 className="text-lg font-bold text-slate-800"> Platform Commission</h2><p className="text-sm text-slate-500"></p></div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex-1 max-w-xs">
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">Rate (%)</label>
                                    <div className="relative">
                                        <input type="number" min="0" max="100" step="0.1" value={newDefault} onChange={e => setNewDefault(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-700 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button onClick={handleSaveDefault} disabled={savingDefault}
                                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-md disabled:opacity-60 transition-all">
                                        {savingDefault ? 'Saving...' : 'Apply to All'}
                                    </button>
                                </div>
                                <div className="pt-6">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-center">
                                        <p className="text-xs text-indigo-400 mb-0.5">Current Default</p>
                                        <p className="text-2xl font-bold text-indigo-700">{(defaultRate * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-emerald-600" /></div>
                                <div><h2 className="text-lg font-bold text-slate-800">Per-Garage Commission</h2><p className="text-sm text-slate-500">{garages.length} garage{garages.length !== 1 ? 's' : ''} registered</p></div>
                            </div>
                            {garages.length === 0 ? <div className="p-12 text-center text-slate-400">No garages found</div> : (
                                <div className="divide-y divide-slate-50">
                                    {garages.map(g => (
                                        <div key={g._id} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/30 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">🏠</div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">{g.name}</p>
                                                    <span className={"inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full " + (g.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                                                        {g.isApproved ? '✓ Approved' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {editingId === g._id ? (
                                                    <>
                                                        <div className="relative">
                                                            <input type="number" min="0" max="100" step="0.1" value={editValue} onChange={e => setEditValue(e.target.value)}
                                                                className="w-24 border border-indigo-300 rounded-lg px-3 py-1.5 pr-7 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" autoFocus />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                                                        </div>
                                                        <button onClick={() => handleSaveGarage(g._id)} disabled={savingId === g._id}
                                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-60 transition">
                                                            {savingId === g._id ? '...' : 'Save'}
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition">Cancel</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-center min-w-[64px]">
                                                            <p className="text-lg font-bold text-indigo-700">{(g.commissionRate * 100).toFixed(1)}%</p>
                                                        </div>
                                                        <button onClick={() => { setEditingId(g._id); setEditValue(String((g.commissionRate * 100).toFixed(1))); }}
                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all">
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">💰</div>
                                    <div><h2 className="text-lg font-bold text-slate-800">Registration Fee</h2><p className="text-sm text-slate-500">One-time fee for new garage owners</p></div>
                                </div>
                                {!editingFee && <button onClick={() => setEditingFee(true)} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition">Edit</button>}
                            </div>
                            {editingFee ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 max-w-xs">
                                        <input type="number" min="0" value={feeDraft} onChange={e => setFeeDraft(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-16 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">ETB</span>
                                    </div>
                                    <button onClick={saveFee} disabled={savingFee} className="px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-60 transition">{savingFee ? 'Saving...' : 'Save'}</button>
                                    <button onClick={() => setEditingFee(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancel</button>
                                </div>
                            ) : <p className="text-3xl font-black text-amber-600">{registrationFee.toLocaleString()} ETB</p>}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🏦</div>
                                    <div><h2 className="text-lg font-bold text-slate-800">Platform Bank Accounts</h2><p className="text-sm text-slate-500">Accounts where platform receives payments</p></div>
                                </div>
                                {!editingAccounts && <button onClick={() => { setAccountDraft([...platformAccounts]); setEditingAccounts(true); }} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">Edit Accounts</button>}
                            </div>
                            {editingAccounts ? (
                                <div className="space-y-4">
                                    {accountDraft.map((acc, idx) => (
                                        <div key={idx} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            {(['bank', 'accountNo', 'accountName', 'branch'] as const).map(field => (
                                                <div key={field}>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                                    <input value={acc[field]} onChange={e => updateDraft(idx, field, e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setEditingAccounts(false)} className="px-5 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                                        <button onClick={handleSaveAccounts} disabled={savingAccounts} className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">{savingAccounts ? 'Saving...' : 'Save Accounts'}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {platformAccounts.map((acc, i) => (
                                        <div key={i} style={{ background: acc.bg, border: '1px solid ' + acc.border, borderRadius: '12px', padding: '14px 16px' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: acc.color }}>{acc.icon} {acc.bank}</p>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e1b4b' }}>{acc.accountNo}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>{acc.accountName}</p>
                                            {acc.branch && <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>{acc.branch}</p>}
                                        </div>
                                    ))}
                                    {platformAccounts.length === 0 && <p className="text-sm text-slate-400 col-span-3">No accounts configured yet.</p>}
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">📋</div>
                                    <div><h2 className="text-lg font-bold text-slate-800">Garage Owner Agreement</h2><p className="text-sm text-slate-500">Version {agreementVersion} · Must be accepted before registration</p></div>
                                </div>
                                {!editingAgreement && <button onClick={() => { setAgreementDraft(agreementContent); setEditingAgreement(true); }} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition">{agreementContent ? 'Edit' : 'Create'}</button>}
                            </div>
                            {editingAgreement ? (
                                <div className="space-y-3">
                                    <textarea value={agreementDraft} onChange={e => setAgreementDraft(e.target.value)} rows={14}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 transition resize-y"
                                        placeholder="Write the full agreement text here..." />
                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Updating increments the version — all garage owners must re-accept.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setEditingAgreement(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
                                        <button onClick={saveAgreement} disabled={savingAgreement} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition">{savingAgreement ? 'Saving...' : 'Save & Publish'}</button>
                                    </div>
                                </div>
                            ) : agreementContent ? (
                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 max-h-48 overflow-y-auto">
                                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{agreementContent}</pre>
                                </div>
                            ) : <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">No agreement set yet. Click Create to write the terms.</div>}
                        </div>
                    </>
                )}

                {tab === 'payments' && (
                    <>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
                            <span className="text-2xl"></span>

                        </div>
                        <div className="flex items-center justify-between mb-5 bg-white border border-indigo-100 rounded-2xl px-5 py-4 shadow-sm">
                            <button onClick={prevSel} className="p-2 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition"><ChevronLeft className="w-5 h-5" /></button>
                            <div className="text-center">
                                <p className="text-xl font-bold text-slate-800">{MONTHS[selMonth - 1]} {selYear}</p>
                                <button onClick={fetchPayments} className="text-xs text-indigo-500 hover:text-indigo-700 underline mt-0.5">Refresh</button>
                            </div>
                            <button onClick={nextSel} disabled={selYear === now.getFullYear() && selMonth === now.getMonth() + 1} className="p-2 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        {payData && (
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500 mb-1">Total Revenue</p><p className="text-2xl font-black text-blue-600">ETB {payData.summary.reduce((s, g) => s + g.totalRevenue, 0).toFixed(2)}</p></div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500 mb-1">Commission Auto-Collected</p><p className="text-2xl font-black text-emerald-600">ETB {payData.totalCommissionPaid.toFixed(2)}</p></div>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500 mb-1">Garages with Payments</p><p className="text-2xl font-black text-indigo-600">{payData.summary.length}</p></div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800">Breakdown per Garage</h2>
                                <p className="text-sm text-slate-500 mt-0.5">All commission shown here was deducted automatically at payment time</p>
                            </div>
                            {payLoading ? <div className="p-12 flex justify-center"><Loader size="md" /></div>
                                : !payData || payData.summary.length === 0
                                    ? <div className="p-12 text-center text-slate-400">No payments found for {MONTHS[selMonth - 1]} {selYear}</div>
                                    : <div className="divide-y divide-slate-50">
                                        {payData.summary.map(g => (
                                            <div key={g.garageId} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">🏠</div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{g.garageName}</p>
                                                            <p className="text-xs text-slate-400">{g.paymentCount} booking{g.paymentCount !== 1 ? 's' : ''} · Rate: {((g.commissionRate || 0) * 100).toFixed(1)}%</p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Collected
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-xs text-slate-400 mb-0.5">Total Revenue</p><p className="font-bold text-slate-700 text-sm">ETB {g.totalRevenue.toFixed(2)}</p></div>
                                                    <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-xs text-slate-400 mb-0.5">Commission ({((g.commissionRate || 0) * 100).toFixed(0)}%)</p><p className="font-bold text-emerald-600 text-sm">ETB {g.totalCommission.toFixed(2)}</p></div>
                                                    <div className="bg-indigo-50 rounded-xl p-3 text-center"><p className="text-xs text-slate-400 mb-0.5">Owner Earnings (90%)</p><p className="font-bold text-indigo-700 text-sm">ETB {g.totalGarageEarnings.toFixed(2)}</p></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            }
                        </div>
                    </>
                )}

                {tab === 'payouts' && (
                    <>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
                            <p className="text-sm font-bold text-amber-800 mb-2">💵 Cash Commission Tracking</p>
                            <p className="text-sm text-amber-700 mb-2">
                                Digital payments (Telebirr, CBE, Abyssinia) have commission <strong>auto-deducted</strong> instantly.
                                Cash payments do NOT — the Admin owner receives 100% cash physically and distribut the money to the comission and the garage owner wallet.
                            </p>
                            <p className="text-sm text-amber-700">
                                Mark as <strong>"distribute"</strong> It.
                            </p>
                        </div>
                        <div className="flex gap-3 mb-5 flex-wrap items-center">
                            <select value={poMonth} onChange={e => setPoMonth(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <select value={poYear} onChange={e => setPoYear(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <button onClick={fetchPayouts} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:from-indigo-500 hover:to-purple-500 transition">Refresh</button>
                            <div className="flex gap-1 ml-auto">
                                {(['all', 'pending', 'sent'] as const).map(f => (
                                    <button key={f} onClick={() => setPoFilter(f)} className={"px-4 py-1.5 rounded-lg text-sm font-semibold border transition " + (poFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300')}>
                                        {f === 'all' ? 'All' : f === 'pending' ? 'Owed' : 'Received'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {poLoading && <div className="text-center py-12 text-slate-400">Loading...</div>}
                        {!poLoading && poData && (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="rounded-2xl p-4 border shadow-sm bg-amber-50 border-amber-100"><p className="text-xs text-slate-500 mb-1">Cash Commission Owed</p><p className="text-xl font-black text-amber-600">ETB {poData.totalPending.toFixed(2)}</p></div>
                                    <div className="rounded-2xl p-4 border shadow-sm bg-emerald-50 border-emerald-100"><p className="text-xs text-slate-500 mb-1">Commission Received</p><p className="text-xl font-black text-emerald-600">ETB {poData.totalSent.toFixed(2)}</p></div>
                                    <div className="rounded-2xl p-4 border shadow-sm bg-indigo-50 border-indigo-100"><p className="text-xs text-slate-500 mb-1">Garages</p><p className="text-xl font-black text-indigo-600">{poData.payouts.length}</p></div>
                                </div>
                                {poFiltered.length === 0
                                    ? <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100">No cash payments found for {MONTHS_SHORT[poMonth - 1]} {poYear}.</div>
                                    : <div className="space-y-4">
                                        {poFiltered.map(row => (
                                            <div key={row.garageId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">🏠</div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{row.garageName}</p>
                                                            <p className="text-xs text-slate-400">{row.ownerName || '—'}{row.ownerPhone ? ' · ' + row.ownerPhone : ''} · {row.paymentCount} payment{row.paymentCount !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={"text-xs font-semibold px-3 py-1.5 rounded-full " + (row.payoutSent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{row.payoutSent ? '✓ Commission Received' : 'Commission Owed'}</span>
                                                        <button onClick={() => handleTogglePayout(row.garageId, row.payoutSent)} disabled={poActionId === row.garageId}
                                                            className={"text-sm font-semibold px-4 py-1.5 rounded-xl transition disabled:opacity-50 " + (row.payoutSent ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm')}>
                                                            {poActionId === row.garageId ? '...' : row.payoutSent ? 'Undo' : 'Mark Received'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 divide-x divide-slate-50">
                                                    <div className="p-4 text-center"><p className="text-xs text-slate-400 mb-1">Total Revenue</p><p className="font-bold text-blue-600">{row.totalRevenue.toFixed(2)} ETB</p></div>
                                                    <div className="p-4 text-center"><p className="text-xs text-slate-400 mb-1">Commission Owed (10%)</p><p className="font-bold text-amber-600">{row.totalCommission.toFixed(2)} ETB</p></div>
                                                    <div className="p-4 text-center"><p className="text-xs text-slate-400 mb-1">Garage Keeps (90%)</p><p className="font-bold text-emerald-600">{row.totalGarageEarnings.toFixed(2)} ETB</p></div>
                                                </div>
                                                {row.payoutSentAt && <div className="px-6 py-2 border-t border-slate-50"><p className="text-xs text-emerald-600">✓ Commission received on {new Date(row.payoutSentAt).toLocaleDateString()}</p></div>}
                                            </div>
                                        ))}
                                    </div>
                                }
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
