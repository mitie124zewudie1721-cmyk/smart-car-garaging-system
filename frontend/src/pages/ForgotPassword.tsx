// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { toast.error('Please enter your email'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Please enter a valid email address'); return; }
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (data.success) { setSent(true); }
            else { toast.error(data.message || 'Failed to send reset email'); }
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
                    {sent ? (
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">📧</div>
                            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                If <span className="text-indigo-300 font-medium">{email}</span> is registered, we've sent a password reset link. Check your inbox (and spam folder).
                            </p>
                            <p className="text-slate-500 text-xs">The link expires in 1 hour.</p>
                            <Link to="/login" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-center transition">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="text-4xl mb-3">🔑</div>
                                <h2 className="text-3xl font-bold text-white">Forgot Password?</h2>
                                <p className="mt-2 text-slate-400 text-sm">Enter your email and we'll send you a reset link</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="text" required autoFocus
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className={cn('w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition')}
                                    />
                                </div>
                                <button type="submit" disabled={isLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-60 transition-all duration-200">
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Sending…
                                        </span>
                                    ) : 'Send Reset Link'}
                                </button>
                                <p className="text-center text-sm text-slate-400">
                                    Remember your password?{' '}
                                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Back to login</Link>
                                </p>
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
