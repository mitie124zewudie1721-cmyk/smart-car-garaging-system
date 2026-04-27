// Registration Fee Payment Page — Chapa only
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function RegistrationFee() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [status, setStatus] = useState<'unpaid' | 'pending' | 'rejected' | 'paid'>('unpaid');
    const [feeAmount, setFeeAmount] = useState(600);
    const [userEmail, setUserEmail] = useState('');
    const [hasEmail, setHasEmail] = useState(true);

    useEffect(() => {
        // Handle Chapa return
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');
        const txRef = params.get('txRef');
        if (payment === 'success' && txRef) {
            api.get(`/users/registration-fee/chapa-verify/${txRef}`)
                .then(() => {
                    toast.success('✅ Payment verified! Account activated.');
                    navigate('/add-garage', { replace: true });
                })
                .catch(() => {
                    toast.success('Payment received! Checking status...');
                    window.history.replaceState({}, '', '/registration-fee');
                    setChecking(false);
                });
            return;
        } else if (payment === 'failed') {
            toast.error('Payment was not completed. Please try again.');
            window.history.replaceState({}, '', '/registration-fee');
        }

        api.get('/users/registration-fee/status').then(r => {
            const d = r.data.data;
            if (d?.isPaid) { navigate('/add-garage', { replace: true }); return; }
            if (d?.submission?.status === 'pending' && d?.submission?.submittedAt) setStatus('pending');
            else if (d?.submission?.status === 'rejected') setStatus('rejected');
            else setStatus('unpaid');
        }).catch(() => setStatus('unpaid')).finally(() => setChecking(false));

        // Check if user has email
        api.get('/auth/profile').then(r => {
            if (!r.data.data?.email) setHasEmail(false);
        }).catch(() => { });

        api.get('/admin/platform-accounts').then(r => {
            if (r.data.data?.registrationFee) setFeeAmount(r.data.data.registrationFee);
        }).catch(() => { });
    }, []);

    const handlePay = async () => {
        // If no email, save it first
        if (!hasEmail && userEmail.trim()) {
            try {
                await api.put('/users/profile', { email: userEmail.trim() });
                setHasEmail(true);
            } catch { /* continue anyway — backend will use fallback email */ }
        }
        if (!hasEmail && !userEmail.trim()) {
            toast.error('Please enter your email address to proceed with Chapa payment');
            return;
        }
        if (!hasEmail && userEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }
        setLoading(true);
        try {
            const r = await api.post('/users/registration-fee/chapa-initiate');
            if (r.data?.checkoutUrl) {
                window.location.href = r.data.checkoutUrl;
            } else {
                toast.error('Could not get payment link. Please try again.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Payment failed. Please try again.');
        } finally { setLoading(false); }
    };

    if (checking) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (status === 'pending') return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #eef2ff 100%)' }}>
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⏳</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-3">Payment Under Review</h1>
                <p className="text-slate-500 mb-6">Your registration fee payment has been submitted and is being reviewed by the admin.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
                    <p className="font-semibold mb-1">What happens next?</p>
                    <p>• Admin will verify your payment within 24 hours</p>
                    <p>• You'll get a notification when approved</p>
                    <p>• Once approved, you can add your garage</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #eef2ff 100%)' }}>
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-3xl"
                        style={{ background: 'linear-gradient(135deg, #00c9b1, #0a7a8f)' }}>
                        🏢
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Platform Registration Fee</h1>
                    <p className="text-slate-500 mt-2 text-sm">Pay once to activate your garage owner account and start adding garages.</p>
                </div>

                {/* Fee card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-6">
                    <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #00c9b1, #0a7a8f)' }}>
                        <p className="text-sm font-medium opacity-80">One-time Registration Fee</p>
                        <p className="text-4xl font-black mt-1">{feeAmount.toLocaleString()} <span className="text-xl font-semibold">ETB</span></p>
                        <p className="text-xs opacity-70 mt-1">Non-refundable · Paid once · Lifetime access</p>
                    </div>
                    <div className="px-6 py-4 space-y-2 text-sm text-slate-600">
                        {['Add unlimited garages', 'Access to all garage management tools', 'Receive bookings from car owners', 'Analytics & earnings dashboard'].map(f => (
                            <div key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {f}</div>
                        ))}
                    </div>
                </div>

                {/* Chapa payment card */}
                <div className="bg-white rounded-2xl shadow-lg border border-teal-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: 'linear-gradient(135deg, #00c9b1, #0a7a8f)' }}>
                            ⚡
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">Pay via Chapa</p>
                            <p className="text-xs text-slate-400">Secure online payment — instant activation</p>
                        </div>
                        <span className="text-xs bg-teal-500 text-white px-2.5 py-1 rounded-full font-semibold">Recommended</span>
                    </div>

                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-2">
                        <p className="text-xs font-semibold text-teal-700 mb-2">Accepted payment methods:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['📱 Telebirr', '📱 M-PESA', '🏦 CBE Birr', '💳 Card'].map(m => (
                                <span key={m} className="bg-white border border-teal-200 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-center">{m}</span>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-teal-600">✅ Your account activates automatically after payment.</p>
                    </div>
                </div>

                {/* Email input if user has no email */}
                {!hasEmail && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <p className="text-sm font-semibold text-amber-800 mb-1">📧 Email required for Chapa</p>
                        <p className="text-xs text-amber-600 mb-3">Chapa needs your email to send a payment receipt.</p>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={e => setUserEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full border border-amber-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        />
                        {userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) && (
                            <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                        )}
                    </div>
                )}

                {/* Pay button */}
                <button onClick={handlePay} disabled={loading}
                    className="w-full py-4 font-bold rounded-2xl shadow-lg disabled:opacity-60 transition-all text-base text-white"
                    style={{
                        background: 'linear-gradient(135deg, #00c9b1 0%, #0a7a8f 100%)',
                        boxShadow: '0 8px 24px rgba(0,201,177,0.35)',
                    }}>
                    {loading ? '⏳ Opening Chapa...' : `⚡ Pay ${feeAmount.toLocaleString()} ETB via Chapa`}
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                    You will be redirected to Chapa's secure checkout page.
                </p>
            </div>
        </div>
    );
}
