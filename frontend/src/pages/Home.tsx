// src/pages/Home.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Car, Clock, Shield, MapPin, Zap, LogOut, ChevronRight, Star } from 'lucide-react';
import FlipCard from '@/components/FlipCard';
import { useAuthStore } from '@/store/authStore';

/* ── tiny hook: count up animation ── */
function useCountUp(target: number, duration = 1800) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            start += step;
            if (start >= target) { setVal(target); clearInterval(t); }
            else setVal(Math.floor(start));
        }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return val;
}

function StatCard({ value, suffix, label, live }: { value: number | null; suffix: string; label: string; live?: boolean }) {
    const v = useCountUp(value ?? 0);
    return (
        <div className="text-center group">
            <p className="text-5xl font-black text-white mb-1 tabular-nums flex items-center justify-center gap-1">
                {value === null
                    ? <span className="text-slate-500 text-3xl">—</span>
                    : <>{v.toLocaleString()}<span className="text-indigo-400">{suffix}</span></>
                }
                {live && value !== null && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" title="Live" />}
            </p>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
        </div>
    );
}

/* ── real-time stats from backend ── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
function useStats() {
    const [stats, setStats] = useState<{ garages: number; drivers: number; reservations: number } | null>(null);
    useEffect(() => {
        const fetch_ = () => {
            fetch(`${API}/garages/public-stats`)
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d?.data) setStats(d.data); })
                .catch(() => { });
        };
        fetch_();
        const t = setInterval(fetch_, 30000);
        return () => clearInterval(t);
    }, []);
    return stats;
}

/* ── real reviews from backend ── */
interface Review { _id: string; rating: number; comment: string; user?: { name: string; profilePicture?: string }; garage?: { name: string }; }
function useReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    useEffect(() => {
        fetch(`${API}/feedbacks/public/recent`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.data?.length) setReviews(d.data); })
            .catch(() => { });
    }, []);
    return reviews;
}

/* ── floating particle dots ── */
function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(18)].map((_, i) => (
                <div key={i}
                    className="absolute rounded-full bg-indigo-500/20 animate-pulse"
                    style={{
                        width: `${4 + (i % 5) * 3}px`,
                        height: `${4 + (i % 5) * 3}px`,
                        top: `${(i * 17 + 5) % 90}%`,
                        left: `${(i * 23 + 3) % 95}%`,
                        animationDelay: `${(i * 0.4) % 3}s`,
                        animationDuration: `${2 + (i % 3)}s`,
                    }}
                />
            ))}
        </div>
    );
}

export default function Home() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const stats = useStats();
    const reviews = useReviews();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const roleLabel: Record<string, string> = {
        car_owner: 'Car Owner', garage_owner: 'Garage Owner', admin: 'Admin',
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

            {/* ══════════════════════════════════════
                NAVBAR
            ══════════════════════════════════════ */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl border-b border-slate-800/60 ${scrolled ? 'shadow-lg shadow-black/20' : ''}`} style={{ backgroundColor: 'rgba(10, 10, 26, 0.88)' }}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Left — Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight whitespace-nowrap text-white">
                            Car <span className="text-indigo-400">Garaging</span>
                        </span>
                    </Link>

                    {/* Center — Nav Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#features" className="text-slate-300 hover:text-indigo-400 transition-colors">Features</a>
                        <a href="#how" className="text-slate-300 hover:text-indigo-400 transition-colors">How It Works</a>
                        <a href="#stats" className="text-slate-300 hover:text-indigo-400 transition-colors">Stats</a>
                    </div>

                    {/* Right — Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-4 py-2">
                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white">
                                        {(user.name || user.username || 'U').charAt(0)}
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-white text-xs font-semibold">{user.name || user.username}</p>
                                        <p className="text-indigo-400 text-[10px]">{roleLabel[user.role] || user.role}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-red-600/20 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-400 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200">
                                    <LogOut className="w-3.5 h-3.5" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors px-4 py-2">
                                    Login
                                </Link>
                                <Link to="/register"
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════
                HERO
            ══════════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden hero-section">
                {/* Garage background image with dark overlay */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1920&q=90"
                        alt="Smart parking garage"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.20) 100%)' }} />
                </div>

                {/* Glowing orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full orb-1 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full orb-2 blur-3xl" />
                <div className="absolute top-[40%] left-[55%] w-[350px] h-[350px] rounded-full orb-3 blur-3xl" />

                {/* Grid overlay */}
                <div className="absolute inset-0 grid-overlay opacity-[0.06]" />

                {/* Floating particles */}
                <Particles />

                {/* Bottom fade into next section */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-8 md:px-16 w-full">
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-cyan-300 text-sm font-medium mb-8 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

                        </div>

                        {/* Heading */}
                        <h1 className="text-6xl md:text-8xl font-black leading-[1.05] mb-6 tracking-tight">
                            <span className="block text-white drop-shadow-2xl"></span>
                            <span className="block hero-gradient-text">

                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">

                        </p>

                        {/* CTA Buttons */}
                        <div className="flex gap-4 flex-wrap">
                            <Link to="/find-garage"
                                className="group flex items-center gap-2 hero-btn-primary px-8 py-4 rounded-full font-bold text-base hover:-translate-y-1 transition-all duration-300">
                                <MapPin className="w-5 h-5" />
                                Find Booking Now
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login"
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-white px-8 py-4 rounded-full font-bold text-base backdrop-blur-sm hover:-translate-y-1 transition-all duration-300">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 text-xs animate-bounce">
                    <span>Scroll</span>
                    <div className="w-px h-8 bg-gradient-to-b from-slate-400 to-transparent" />
                </div>
            </section>

            <style>{`
                .hero-bg {
                    background: linear-gradient(135deg,
                        #0a0a1a 0%,
                        #0d1b3e 20%,
                        #0f2460 35%,
                        #1a1060 50%,
                        #2d0a6e 65%,
                        #1e0a4a 80%,
                        #050510 100%
                    );
                    animation: heroBgShift 12s ease-in-out infinite alternate;
                }
                @keyframes heroBgShift {
                    0%   { filter: hue-rotate(0deg) brightness(1); }
                    50%  { filter: hue-rotate(15deg) brightness(1.1); }
                    100% { filter: hue-rotate(-10deg) brightness(0.95); }
                }
                .orb-1 {
                    background: radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.2) 50%, transparent 70%);
                    animation: orbFloat1 8s ease-in-out infinite;
                }
                .orb-2 {
                    background: radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%);
                    animation: orbFloat2 10s ease-in-out infinite;
                }
                .orb-3 {
                    background: radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(99,102,241,0.15) 50%, transparent 70%);
                    animation: orbFloat3 7s ease-in-out infinite;
                }
                @keyframes orbFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50%      { transform: translate(40px, 60px) scale(1.1); }
                }
                @keyframes orbFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50%      { transform: translate(-50px, -40px) scale(1.15); }
                }
                @keyframes orbFloat3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50%      { transform: translate(30px, -50px) scale(0.9); }
                }
                .grid-overlay {
                    background-image:
                        linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
                .hero-gradient-text {
                    background: linear-gradient(90deg, #818cf8, #a78bfa, #22d3ee);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hero-btn-primary {
                    background: linear-gradient(135deg, #4f46e5, #7c3aed, #0891b2);
                    color: white;
                    box-shadow: 0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2);
                }
                .hero-btn-primary:hover {
                    box-shadow: 0 0 40px rgba(99,102,241,0.7), 0 0 80px rgba(99,102,241,0.3);
                }
            `}</style>

            {/* ══════════════════════════════════════
                STATS BAR
            ══════════════════════════════════════ */}
            <section id="stats" className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30" />
                <div className="absolute inset-0 border-y border-slate-800" />
                <div className="relative max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        <StatCard value={stats?.garages ?? null} suffix="+" label="Active Garages" live />
                        <StatCard value={stats?.drivers ?? null} suffix="+" label="Registered Users" live />
                        <StatCard value={stats?.reservations ?? null} suffix="+" label="Total Reservations" live />
                        <StatCard value={12} suffix="/7" label="Live Monitoring" />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                FEATURES — FLIP CARDS
            ══════════════════════════════════════ */}
            <section id="features" className="py-32 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/10 to-slate-950" />
                <div className="relative max-w-6xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" /> Why Choose Us
                        </div>
                        <h2 className="text-5xl font-black text-white mb-5 tracking-tight">
                            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Smart Garaging?</span>
                        </h2>
                        <p className="text-slate-400 text-xl max-w-xl mx-auto"></p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FlipCard
                            icon={<Clock className="w-7 h-7 text-indigo-400" />}
                            title="Real-Time Availability"
                            description="See available spots instantly with live updates from smart sensors across all garages."
                            backTitle="Always Up to Date"
                            backDetails={[
                                'Live sensor data every 30 seconds',
                                'Interactive map with spot availability',
                                'Instant alerts when spots open up',
                            ]}
                        />
                        <FlipCard
                            icon={<Shield className="w-7 h-7 text-indigo-400" />}
                            title="Safe & Monitored"
                            description="CCTV, secure gates, and 24/7 monitoring for complete peace of mind."
                            backTitle="Your Safety First"
                            backDetails={[
                                '24/7 CCTV at every garage',
                                'Automated access-controlled gates',
                                'On-site security at premium locations',
                            ]}
                        />
                        <FlipCard
                            icon={<Zap className="w-7 h-7 text-indigo-400" />}
                            title="Instant Booking"
                            description="Reserve your spot in seconds. No queues, no hassle — just drive in."
                            backTitle="Seamless Experience"
                            backDetails={[
                                'Book in under 10 seconds',
                                'QR code entry — no tickets needed',
                                'Modify or cancel anytime',
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                WHAT DRIVERS SAY
            ══════════════════════════════════════ */}
            {reviews.length > 0 && (
                <section className="py-28 relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }} />
                    <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.2) 0%, transparent 55%)' }} />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                    <div className="relative max-w-6xl mx-auto px-6">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 text-amber-400 text-sm font-semibold mb-6">
                                <Star className="w-4 h-4 fill-amber-400" /> Verified Reviews
                            </div>
                            <h2 className="text-5xl font-black text-white mb-4 tracking-tight">What Drivers Say</h2>
                            <p className="text-slate-400 text-lg">Real experiences from real customers.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {reviews.slice(0, 3).map((r) => (
                                <div key={r._id}
                                    className="group relative rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:shadow-violet-500/30 cursor-default overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, rgba(30,27,75,0.9) 0%, rgba(15,23,42,0.95) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(135deg, rgba(79,70,229,0.35) 0%, rgba(109,40,217,0.25) 50%, rgba(15,23,42,0.95) 100%)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.7)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(135deg, rgba(30,27,75,0.9) 0%, rgba(15,23,42,0.95) 100%)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.2)'; }}
                                >
                                    <div className="absolute top-6 right-7 text-8xl font-black text-indigo-500/10 group-hover:text-indigo-400/20 transition-colors leading-none select-none">"</div>

                                    <div className="flex gap-1.5 mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-5 h-5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}`} />
                                        ))}
                                    </div>

                                    <p className="text-slate-200 text-base leading-relaxed mb-8 min-h-[80px]">
                                        "{r.comment}"
                                    </p>

                                    <div className="h-px bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-transparent mb-6" />

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-lg font-black overflow-hidden flex-shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                            {r.user?.profilePicture
                                                ? <img src={r.user.profilePicture} alt="" className="w-full h-full object-cover" />
                                                : (r.user?.name?.charAt(0)?.toUpperCase() || 'U')}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-base">{r.user?.name || 'Anonymous'}</p>
                                            {r.garage?.name && <p className="text-indigo-400 text-sm font-medium">{r.garage.name}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                FOOTER
            ══════════════════════════════════════ */}
            <footer className="bg-slate-900 border-t border-slate-800 py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Car className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-white">Smart Garaging</p>
                                <p className="text-slate-500 text-xs">Parking made simple</p>
                            </div>
                        </div>
                        <div className="flex gap-8 text-sm text-slate-400">
                            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
                            <a href="#how" className="hover:text-indigo-400 transition-colors">How It Works</a>
                            <Link to="/login" className="hover:text-indigo-400 transition-colors">Login</Link>
                            <Link to="/register" className="hover:text-indigo-400 transition-colors">Register</Link>
                        </div>
                        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Smart Garaging. All rights reserved.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
