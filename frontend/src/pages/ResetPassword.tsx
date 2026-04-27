// src/pages/ResetPassword.tsx
import { useState, type FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (password !== confirm) { toast.error('Passwords do not match'); return; }
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Password reset successfully!');
                setDone(true);
                setTimeout(() => navigate('/login'), 2500);
            } else {
                toast.error(data.message || 'Failed to reset password');
            }
        } catch {
            toast.error('Cannot reach server. Is the backend running?');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-md">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
                    <Link to="/"><h1 className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition">Smart Garaging</h1></Link>
                    <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition">Back to Login</Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 md:p-10">
                    {done ? (
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl"></div>
                            <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
                            <p className="text-slate-400 text-sm">Your password has been updated. Redirecting to login…</p>
                            <Link to="/login" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-center transition">
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="text-4xl mb-3"></div>
                                <h2 className="text-3xl font-bold text-white">Set New Password</h2>
                                <p className="mt-2 text-slate-400 text-sm">Choose a strong password for your account</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPw ? 'text' : 'password'} required
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className={cn('w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition')}
                                        />
                                        <button type="button" onClick={() => setShowPw(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'} required
                                            value={confirm} onChange={e => setConfirm(e.target.value)}
                                            placeholder="Repeat new password"
                                            className={cn('w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition')}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60 transition-all duration-200">
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Resetting…
                                        </span>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>

            <footer className="text-center py-6 text-slate-500 text-sm border-t border-slate-800">
                © {new Date().getFullYear()} Smart Garaging System
            </footer>
        </div>
    );
}
