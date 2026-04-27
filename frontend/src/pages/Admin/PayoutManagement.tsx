// src/pages/Admin/PayoutManagement.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PayoutRow {
    garageId: string;
    garageName: string;
    ownerName: string;
    ownerPhone?: string;
    totalRevenue: number;
    totalCommission: number;
    totalGarageEarnings: number;
    paymentCount: number;
    payoutSent: boolean;
    payoutSentAt?: string;
}

interface PayoutData {
    month: number;
    year: number;
    payouts: PayoutRow[];
    totalPending: number;
    totalSent: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayoutManagement() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<PayoutData | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/payouts?month=${month}&year=${year}`);
            setData(res.data.data);
        } catch {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleTogglePayout = async (garageId: string, currentSent: boolean) => {
        setActionLoading(garageId);
        try {
            await api.patch(`/admin/payouts/${garageId}/mark-sent`, {
                month, year, sent: !currentSent
            });
            toast.success(!currentSent ? 'Payout marked as sent' : 'Payout marked as pending');
            fetchPayouts();
        } catch {
            toast.error('Failed to update payout status');
        } finally {
            setActionLoading(null);
        }
    };

    const fmt = (n: number) => `${n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

    const filtered = data?.payouts.filter(p =>
        filter === 'all' ? true : filter === 'pending' ? !p.payoutSent : p.payoutSent
    ) ?? [];

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Payout Management</h1>
                <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
                    Manage earnings payouts to garage owners. Mark payouts as sent after transferring funds.
                </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#fff' }}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#fff' }}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={fetchPayouts}
                    style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                    Refresh
                </button>
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                    {(['all', 'pending', 'sent'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: filter === f ? '#059669' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading payouts...</div>}

            {!loading && data && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { label: 'Pending Payouts', value: fmt(data.totalPending), color: '#f59e0b', bg: '#fffbeb' },
                            { label: 'Sent Payouts', value: fmt(data.totalSent), color: '#10b981', bg: '#ecfdf5' },
                            { label: 'Total Garages', value: String(data.payouts.length), color: '#6366f1', bg: '#eef2ff' },
                            { label: 'Pending Count', value: String(data.payouts.filter(p => !p.payoutSent).length), color: '#ef4444', bg: '#fef2f2' },
                        ].map(card => (
                            <div key={card.label} style={{ background: card.bg, borderRadius: '12px', padding: '20px', border: `1px solid ${card.color}30`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px' }}>{card.label}</p>
                                <p style={{ fontSize: '20px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Platform Bank Info */}
                    <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
                        <h3 style={{ margin: '0 0 10px', color: '#065f46', fontSize: '15px', fontWeight: 700 }}>Platform Bank Account (Send Earnings From Here)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px', color: '#374151' }}>
                            <div><strong>Bank:</strong> Commercial Bank of Ethiopia (CBE)</div>
                            <div><strong>Account Name:</strong> Smart Garaging Platform</div>
                            <div><strong>Account No:</strong> 1000XXXXXXXXXX</div>
                            <div><strong>Branch:</strong> Addis Ababa Main Branch</div>
                        </div>
                        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#6b7280' }}>
                            Transfer the garage owner's net earnings to their registered bank account, then mark as "Sent" here.
                        </p>
                    </div>

                    {/* Payout Table */}
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px' }}>
                            No {filter !== 'all' ? filter : ''} payouts for {MONTHS[month - 1]} {year}.
                        </div>
                    ) : (
                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            {/* Table Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1.2fr', gap: '8px', padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                                <span>Garage</span>
                                <span>Owner</span>
                                <span style={{ textAlign: 'right' }}>Revenue</span>
                                <span style={{ textAlign: 'right' }}>Commission</span>
                                <span style={{ textAlign: 'right' }}>Earnings</span>
                                <span style={{ textAlign: 'center' }}>Status</span>
                                <span style={{ textAlign: 'center' }}>Action</span>
                            </div>

                            {filtered.map((row, i) => (
                                <div key={row.garageId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1.2fr', gap: '8px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: '13px', color: '#374151', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'}
                                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#1e1b4b' }}>{row.garageName}</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{row.paymentCount} payment{row.paymentCount !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0 }}>{row.ownerName || '—'}</p>
                                        {row.ownerPhone && <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{row.ownerPhone}</p>}
                                    </div>
                                    <span style={{ textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>{row.totalRevenue.toFixed(2)}</span>
                                    <span style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{row.totalCommission.toFixed(2)}</span>
                                    <span style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{row.totalGarageEarnings.toFixed(2)}</span>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: row.payoutSent ? '#d1fae5' : '#fef3c7', color: row.payoutSent ? '#065f46' : '#92400e' }}>
                                            {row.payoutSent ? 'Sent' : 'Pending'}
                                        </span>
                                        {row.payoutSentAt && (
                                            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#9ca3af' }}>
                                                {new Date(row.payoutSentAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleTogglePayout(row.garageId, row.payoutSent)}
                                            disabled={actionLoading === row.garageId}
                                            style={{
                                                padding: '6px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px',
                                                background: row.payoutSent ? '#fee2e2' : 'linear-gradient(135deg, #059669, #047857)',
                                                color: row.payoutSent ? '#dc2626' : '#fff',
                                                opacity: actionLoading === row.garageId ? 0.6 : 1,
                                                transition: 'opacity 0.2s',
                                            }}
                                        >
                                            {actionLoading === row.garageId ? '...' : row.payoutSent ? 'Undo' : 'Mark Sent'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
