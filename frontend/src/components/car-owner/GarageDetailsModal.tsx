// src/components/car-owner/GarageDetailsModal.tsx
import { X, MapPin, Phone, Mail, Clock, Star, Car, Wrench, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Loader from '@/components/common/Loader';
import { toast } from 'react-hot-toast';

interface Service { name: string; price: number; duration: number; description?: string; }
interface Contact { phone?: string; email?: string; }
interface GarageDetails {
    _id: string; name: string;
    location: { address?: string; coordinates: [number, number]; };
    capacity: number; availableSlots: number; pricePerHour: number;
    rating: number; totalReviews: number; amenities: string[];
    description?: string; contact?: Contact; services?: Service[];
    operatingHours?: { start?: string; end?: string; weekly?: Record<string, { open: boolean; start: string; end: string }>; };
    paymentMethods?: string[]; isActive?: boolean;
}

const AMENITY_ICONS: Record<string, string> = {
    covered: '🏠', secure: '🔒', '24h': '🕐', washing: '🚿', repair: '🔧',
    electric_charge: '⚡', air_pump: '💨', cctv: '📹', valet: '🎩',
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function StarRating({ rating, total }: { rating: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                ))}
            </div>
            <span className="text-sm font-semibold text-slate-700">{rating > 0 ? rating.toFixed(1) : '—'}</span>
            <span className="text-xs text-slate-400">({total})</span>
        </div>
    );
}

interface Props { garageId: string; isOpen: boolean; onClose: () => void; onReserve?: () => void; }

export default function GarageDetailsModal({ garageId, isOpen, onClose, onReserve }: Props) {
    const [garage, setGarage] = useState<GarageDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && garageId) {
            setLoading(true);
            api.get(`/garages/${garageId}`)
                .then(r => setGarage(r.data.data))
                .catch(() => toast.error('Failed to load garage details'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, garageId]);

    if (!isOpen) return null;

    const occupancy = garage ? Math.round(((garage.capacity - garage.availableSlots) / garage.capacity) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader size="lg" /></div>
                ) : garage ? (
                    <>
                        {/* ── Gradient Header ── */}
                        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-6 pt-6 pb-8 text-white flex-shrink-0">
                            <button onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                                <X size={16} />
                            </button>
                            <div className="flex items-start justify-between pr-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-bold">{garage.name}</h2>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${garage.isActive ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-400/50' : 'bg-red-400/30 text-red-100 border border-red-400/50'}`}>
                                            {garage.isActive ? '● Open Now' : (() => {
                                                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                                const today = days[new Date().getDay()];
                                                const s = garage.operatingHours?.weekly?.[today];
                                                return s?.open && s.start ? `● Opens ${s.start}` : '● Closed';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-indigo-200 text-sm">
                                        <MapPin size={13} />
                                        <span>{garage.location.address || 'Jimma, Ethiopia'}</span>
                                    </div>
                                    <div className="mt-2">
                                        <StarRating rating={garage.rating} total={garage.totalReviews} />
                                    </div>
                                </div>
                            </div>

                            {/* Slot bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-indigo-200 mb-1">
                                    <span>{garage.availableSlots} slots available</span>
                                    <span>{occupancy}% occupied</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${occupancy}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Scrollable Content ── */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                            {/* Description */}
                            {garage.description && (
                                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    {garage.description}
                                </p>
                            )}

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <Car size={18} className="text-indigo-500" />, label: 'Capacity', value: `${garage.capacity} vehicles` },
                                    { icon: <Shield size={18} className="text-emerald-500" />, label: 'Available', value: `${garage.availableSlots} slots`, color: garage.availableSlots > 0 ? 'text-emerald-600' : 'text-red-500' },
                                    { icon: <Star size={18} className="text-amber-500" />, label: 'Score', value: garage.rating > 0 ? `${garage.rating.toFixed(1)} / 5` : '—' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                                        <div className="flex justify-center mb-1">{s.icon}</div>
                                        <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                                        <p className={`text-sm font-bold ${(s as any).color || 'text-slate-700'}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Operating Hours */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock size={16} className="text-indigo-500" />
                                    <h3 className="font-semibold text-slate-800">Operating Hours</h3>
                                    {garage.isActive
                                        ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">🟢 Open Now</span>
                                        : <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">🔴 Closed</span>
                                    }
                                </div>
                                {garage.operatingHours?.weekly ? (
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                        {DAYS.map((day, i) => {
                                            const s = garage.operatingHours!.weekly![day];
                                            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                            const isToday = todayName === day;
                                            const to12h = (t: string) => {
                                                if (!t || !t.includes(':')) return t;
                                                const [h, m] = t.split(':').map(Number);
                                                return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                                            };
                                            return (
                                                <div key={day} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < DAYS.length - 1 ? 'border-b border-slate-100' : ''} ${isToday ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}>
                                                    <span className={`w-28 capitalize font-medium ${isToday ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>
                                                        {day.charAt(0).toUpperCase() + day.slice(1)}{isToday ? ' ★' : ''}
                                                    </span>
                                                    {s?.open && s.start && s.end
                                                        ? <span className={`font-semibold ${isToday ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                                            {to12h(s.start)} – {to12h(s.end)}
                                                        </span>
                                                        : <span className="text-red-400 text-xs italic">Closed</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 rounded-xl p-4 border border-slate-100">Working hours not set yet</p>
                                )}
                            </div>

                            {/* Services */}
                            {garage.services && garage.services.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wrench size={16} className="text-indigo-500" />
                                        <h3 className="font-semibold text-slate-800">Services ({garage.services.length})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {garage.services.map((s: any, i: number) => (
                                            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-indigo-200 transition">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                                                    <span className="text-indigo-600 font-bold text-sm">{s.price} ETB</span>
                                                </div>
                                                {s.duration && <p className="text-xs text-slate-400 mt-0.5">⏱ {s.duration} min</p>}
                                                {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                                                {/* Sub-options (e.g. oil types) */}
                                                {s.subOptions && s.subOptions.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Variants:</p>
                                                        <div className="space-y-1">
                                                            {s.subOptions.map((opt: any, oi: number) => (
                                                                <div key={oi} className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600">• {opt.name}</span>
                                                                    <span className="text-indigo-500 font-semibold">{opt.price} ETB</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amenities */}
                            {garage.amenities && garage.amenities.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-3">Amenities</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {garage.amenities.map(a => (
                                            <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                                                {AMENITY_ICONS[a] || '✓'} {a.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact */}
                            {garage.contact && (garage.contact.phone || garage.contact.email) && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm mb-2">Contact</h3>
                                    <div className="space-y-1.5">
                                        {garage.contact.phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone size={13} className="text-indigo-400" />
                                                <span>{garage.contact.phone}</span>
                                            </div>
                                        )}
                                        {garage.contact.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail size={13} className="text-indigo-400" />
                                                <span className="truncate">{garage.contact.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <MapPin size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{garage.location.address || 'Jimma, Ethiopia'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {garage.location.coordinates[1].toFixed(4)}°N, {garage.location.coordinates[0].toFixed(4)}°E
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 flex gap-3 bg-white">
                            <button onClick={onClose}
                                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition text-sm">
                                Close
                            </button>
                            {onReserve && garage.availableSlots > 0 && garage.isActive && (
                                <button onClick={() => { onClose(); onReserve(); }}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-200 transition-all text-sm">
                                    Reserve Now
                                </button>
                            )}
                            {onReserve && !garage.isActive && garage.availableSlots > 0 && (
                                <button onClick={() => { onClose(); onReserve(); }}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-200 transition-all text-sm">
                                    📅 Book in Advance
                                </button>
                            )}
                            {garage.availableSlots === 0 && garage.isActive && (
                                <div className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-semibold text-center text-sm cursor-not-allowed">
                                    Fully Booked
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-slate-400">Failed to load garage details</div>
                )}
            </div>
        </div>
    );
}
