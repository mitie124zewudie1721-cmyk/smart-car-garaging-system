// Agreement page — garage owner must read and accept before paying
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const DEFAULT_AGREEMENT = `SMART GARAGING PLATFORM — GARAGE OWNER AGREEMENT

By registering as a garage owner on the Smart Garaging Platform, you agree to the following terms:

1. REGISTRATION FEE
   • A one-time non-refundable registration fee is required before adding a garage.
   • This fee activates your account and grants lifetime access to all platform features.

2. COMMISSION
   • The platform charges a commission on each successful reservation made through the system.
   • The commission rate is set by the platform administrator and may vary per garage.
   • Commission is calculated as a percentage of the total reservation amount.

3. COMMISSION PAYMENT DEADLINE
   • Monthly commission must be paid by the due date specified in your earnings dashboard.
   • A grace period may be granted at the administrator's discretion.

4. LATE PAYMENT PENALTY
   • Failure to pay commission by the due date will result in a penalty fee.
   • Penalties are calculated daily on the outstanding commission amount.
   • Continued non-payment may result in suspension of your garage listing.

5. GARAGE VERIFICATION
   • All garages must be approved by the platform administrator before going live.
   • You must provide accurate information and a valid business license.
   • The platform reserves the right to reject or remove any garage listing.

6. RESPONSIBILITIES
   • You are responsible for maintaining accurate garage information (capacity, hours, pricing).
   • You must honor all confirmed reservations made through the platform.
   • You must maintain a safe and accessible parking environment.

7. ACCOUNT SUSPENSION
   • Violation of these terms may result in account suspension or permanent removal.
   • Suspended accounts lose access to all platform features until the issue is resolved.

8. AMENDMENTS
   • The platform reserves the right to update these terms at any time.
   • You will be notified of significant changes and may be required to re-accept.

By clicking "I Accept & Continue", you confirm that you have read, understood, and agree to all the terms above.`;

export default function Agreement() {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [checked, setChecked] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get('/users/agreement').then(r => {
            const d = r.data.data;
            if (d?.userAccepted) {
                navigate('/add-garage', { replace: true });
                return;
            }
            setContent(d?.content || DEFAULT_AGREEMENT);
        }).catch(() => {
            setContent(DEFAULT_AGREEMENT);
        }).finally(() => setLoading(false));
    }, []);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
        if (atBottom) setScrolled(true);
    };

    const handleAccept = async () => {
        if (!checked) { toast.error('Please check the agreement box'); return; }
        setAccepting(true);
        try {
            await api.post('/users/agreement/accept');
            toast.success('Agreement accepted');
            navigate('/registration-fee', { replace: true });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to accept');
        } finally { setAccepting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #eef2ff 100%)' }}>
            <div className="w-full max-w-2xl">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-2xl">📋</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Garage Owner Agreement</h1>
                    <p className="text-slate-500 text-sm mt-1">Please read the full agreement before proceeding to payment.</p>
                </div>

                {/* Agreement text */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-4">
                    <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">Terms & Conditions</span>
                        {!scrolled && <span className="text-indigo-200 text-xs animate-bounce">↓ Scroll to read all</span>}
                        {scrolled && <span className="text-emerald-300 text-xs font-semibold">✓ Fully read</span>}
                    </div>
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="h-80 overflow-y-auto p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50"
                        style={{ fontSize: 13 }}
                    >
                        {content}
                    </div>
                </div>

                {/* Checkbox */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => setChecked(e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                        />
                        <span className="text-sm text-slate-700">
                            I have read and understood the full agreement. I agree to the registration fee, commission structure, penalty policy, and all other terms stated above.
                        </span>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold hover:bg-slate-50 transition text-sm">
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!checked || accepting}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 transition-all text-sm">
                        {accepting ? 'Processing…' : 'I Accept & Continue →'}
                    </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-3">
                    Declining will return you to the dashboard without activating your account.
                </p>
            </div>
        </div>
    );
}
