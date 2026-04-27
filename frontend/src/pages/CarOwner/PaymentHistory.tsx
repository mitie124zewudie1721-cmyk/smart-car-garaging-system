// src/pages/CarOwner/PaymentHistory.tsx
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
    transactionId?: string;
    createdAt: string;
    reservation?: {
        _id: string;
        serviceType: string;
        garage?: { name: string };
    };
    metadata?: { isDeposit?: boolean };
}

const statusColor: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-700',
};

export default function CarOwnerPaymentHistory() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/payments/my')
            .then(r => setPayments(r.data.data || []))
            .catch(() => toast.error('Failed to load payment history'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>
                <p className="text-gray-500 text-sm mt-1">All your payments via Chapa and other methods</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader size="lg" /></div>
            ) : payments.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-3">💳</p>
                    <p className="font-medium">No payments yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payments.map(p => (
                        <div key={p._id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-4 shadow-sm">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        {p.reservation?.garage?.name || 'Payment'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {p.status}
                                    </span>
                                    {p.metadata?.isDeposit && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                            Deposit
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {p.reservation?.serviceType || '—'} · {p.paymentProvider || p.paymentMethod}
                                </p>
                                {p.transactionId && (
                                    <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                                        Ref: {p.transactionId}
                                    </p>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-lg font-black text-slate-800 dark:text-white">
                                    {p.amount.toLocaleString()} ETB
                                </p>
                                <p className="text-xs text-slate-400">
                                    {new Date(p.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
