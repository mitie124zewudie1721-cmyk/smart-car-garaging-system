import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import GarageSearchMap from '@/components/car-owner/GarageSearchMap';
import Loader from '@/components/common/Loader';
import ReservationForm from '@/components/car-owner/ReservationForm';
import GarageDetailsModal from '@/components/car-owner/GarageDetailsModal';
import Modal from '@/components/common/Modal';
import { useTranslation } from 'react-i18next';

interface Garage {
    _id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    pricePerHour: number;
    availableSlots: number;
    rating: number;
    amenities: string[];
    distance?: number;
    isActive?: boolean;
    operatingHours?: {
        weekly?: Record<string, { open: boolean; start: string; end: string }>;
    };
}

interface Vehicle {
    _id: string;
    make: string;
    model: string;
    plateNumber: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function to12h(t: string): string {
    if (!t || !t.includes(':')) return t;
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${mStr} ${period}`;
}

function getTodayHours(garage: Garage): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const schedule = garage.operatingHours?.weekly?.[today];
    if (!schedule || !schedule.open || !schedule.start || !schedule.end) return 'Closed today';
    return `${to12h(schedule.start)} – ${to12h(schedule.end)}`;
}

/** Calculate if garage is currently open based on schedule (real-time, no DB needed) */
function isCurrentlyOpen(garage: Garage): boolean {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const schedule = garage.operatingHours?.weekly?.[today];
    if (!schedule || !schedule.open || !schedule.start || !schedule.end) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = schedule.start.split(':').map(Number);
    const [ch, cm] = schedule.end.split(':').map(Number);
    return currentMinutes >= (oh * 60 + om) && currentMinutes < (ch * 60 + cm);
}

export default function FindGarage() {
    const [garages, setGarages] = useState<Garage[]>([]);
    const [, setTick] = useState(0); // force re-render every minute for open/close status

    // Re-render every minute so open/close badge updates automatically
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [radius, setRadius] = useState(10);
    const [useRadius, setUseRadius] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        api.get('/vehicles/my').then(r => setVehicles(r.data.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        // Always default to Jimma city center
        const jimmaCenter = { lat: 7.6769, lng: 36.8344 };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    // Only use GPS if user is within Jimma bounds
                    const inJimma = loc.lat >= 7.55 && loc.lat <= 7.80 && loc.lng >= 36.75 && loc.lng <= 36.95;
                    const finalLoc = inJimma ? loc : jimmaCenter;
                    setUserLocation(finalLoc);
                    doSearch(finalLoc, 10, false);
                },
                () => { setUserLocation(jimmaCenter); doSearch(jimmaCenter, 10, false); }
            );
        } else {
            setUserLocation(jimmaCenter);
            doSearch(jimmaCenter, 10, false);
        }
    }, []);

    const doSearch = async (loc: { lat: number; lng: number }, km: number, byRadius = false) => {
        setLoading(true);
        setSearched(true);
        try {
            const searchRadius = byRadius ? km : 999; // 999 = show all
            const res = await api.post('/garages/search', { lat: loc.lat, lng: loc.lng, radius: searchRadius });
            const list: Garage[] = (res.data.data || []).map((g: any) => {
                const gLat = g.location?.coordinates?.[1];
                const gLng = g.location?.coordinates?.[0];
                const dist = (gLat && gLng) ? haversine(loc.lat, loc.lng, gLat, gLng) : undefined;
                return {
                    _id: g._id,
                    name: g.name,
                    address: g.location?.address || 'No address',
                    lat: gLat || 0,
                    lng: gLng || 0,
                    pricePerHour: g.pricePerHour || 0,
                    availableSlots: g.availableSlots || 0,
                    rating: g.rating || 0,
                    amenities: g.amenities || [],
                    distance: dist,
                    isActive: g.isActive !== false,
                    operatingHours: g.operatingHours,
                };
            });
            list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
            setGarages(list);
            if (list.length === 0) toast('No garages found' + (byRadius ? ` within ${km} km` : ''));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!userLocation) { toast.error('Location not available'); return; }
        doSearch(userLocation, radius, useRadius);
    };

    const handleReserve = (garage: Garage) => { setSelectedGarage(garage); setShowReserveModal(true); };
    const handleViewDetails = (id: string) => { setSelectedGarageId(id); setShowDetailsModal(true); };
    const handleReserveFromDetails = () => {
        if (selectedGarageId) {
            const g = garages.find(g => g._id === selectedGarageId);
            if (g) { setShowDetailsModal(false); handleReserve(g); }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">{t('garage.findGarage')}</h1>
                <p className="text-slate-500 mt-1">{t('garage.searchRadius')} — {t('common.search')}</p>
            </div>

            {/* Search Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 w-full">
                        {/* Radius toggle */}
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={() => setUseRadius(v => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${useRadius ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${useRadius ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <label className="text-sm font-semibold text-slate-600 cursor-pointer" onClick={() => setUseRadius(v => !v)}>
                                {t('garage.filterByDistance')}
                                {!useRadius && <span className="ml-1 text-xs text-slate-400">{t('garage.showingAll')}</span>}
                            </label>
                        </div>

                        {/* Radius slider — only shown when enabled */}
                        {useRadius && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-slate-500">{t('garage.searchRadius')}</label>
                                    <span className="text-lg font-bold text-indigo-600">{radius} km</span>
                                </div>
                                <input
                                    type="range" min={1} max={50} step={1} value={radius}
                                    onChange={e => setRadius(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>1 km</span><span>10 km</span><span>25 km</span><span>50 km</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-60 transition-all duration-200 whitespace-nowrap"
                    >
                        {loading ? `${t('common.search')}…` : `🔍 ${t('common.search')}`}
                    </button>
                </div>
                {userLocation && (
                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                        📍 {t('garage.yourLocation')}: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Garage List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader size="lg" /></div>
                    ) : garages.length === 0 && searched ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                            <div className="text-5xl mb-3">🅿️</div>
                            <p className="text-slate-600 font-medium">
                                {useRadius
                                    ? t('garage.noGaragesRadius', { radius })
                                    : t('garage.noGarages')}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                {useRadius ? t('garage.tryIncreasing') : 'No approved garages available yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {garages.length > 0 && (
                                <p className="text-sm text-slate-500 font-medium">
                                    {garages.length === 1 ? t('garage.garagesFound', { count: garages.length }) : t('garage.garagesFoundPlural', { count: garages.length })}
                                    {useRadius ? ` within ${radius} km` : ''}
                                </p>
                            )}
                            {garages.map(garage => (
                                <div key={garage._id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{garage.name}</h3>
                                                    {isCurrentlyOpen(garage)
                                                        ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">🟢 Open</span>
                                                        : <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">🔴 Closed</span>
                                                    }
                                                </div>
                                                <p className="text-slate-500 text-sm mt-0.5">📍 {garage.address}</p>
                                                <p className="text-slate-400 text-xs mt-0.5">
                                                    🕐 Today: <span className={isCurrentlyOpen(garage) ? 'text-emerald-600 font-medium' : 'text-slate-500 font-medium'}>
                                                        {getTodayHours(garage) === 'Closed today'
                                                            ? 'Closed today'
                                                            : isCurrentlyOpen(garage)
                                                                ? getTodayHours(garage)
                                                                : `Opens ${getTodayHours(garage).split(' – ')[0]}`}
                                                    </span>
                                                </p>
                                            </div>
                                            {/* Distance Badge */}
                                            {garage.distance !== undefined && (
                                                <div className="flex-shrink-0 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-center">
                                                    <p className="text-lg font-bold text-indigo-600 leading-none">
                                                        {garage.distance < 1
                                                            ? `${(garage.distance * 1000).toFixed(0)}m`
                                                            : `${garage.distance.toFixed(1)}km`}
                                                    </p>
                                                    <p className="text-xs text-indigo-400 mt-0.5">{t('garage.away')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-slate-400 mb-0.5">{t('garage.available')}</p>
                                                <p className={`font-bold text-sm ${garage.availableSlots > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {garage.availableSlots} {t('garage.slots')}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-slate-400 mb-0.5">{t('garage.score')}</p>
                                                <p className="font-bold text-slate-700 text-sm">
                                                    {garage.rating > 0 ? `${garage.rating.toFixed(1)} / 5` : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        {garage.amenities.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {garage.amenities.slice(0, 4).map(a => (
                                                    <span key={a} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">{a}</span>
                                                ))}
                                                {garage.amenities.length > 4 && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">+{garage.amenities.length - 4} more</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button onClick={() => handleViewDetails(garage._id)}
                                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
                                                {t('bookings.viewDetails')}
                                            </button>
                                            <button
                                                onClick={() => handleReserve(garage)}
                                                disabled={garage.availableSlots === 0 || !isCurrentlyOpen(garage)}
                                                className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl shadow transition-all duration-200 disabled:cursor-not-allowed
                                                    ${!isCurrentlyOpen(garage)
                                                        ? 'bg-slate-400 opacity-60 cursor-not-allowed'
                                                        : garage.availableSlots === 0
                                                            ? 'bg-slate-400 opacity-50 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-200'
                                                    }`}>
                                                {garage.availableSlots === 0
                                                    ? t('garage.fullyBooked')
                                                    : !isCurrentlyOpen(garage)
                                                        ? '🔴 Closed Now'
                                                        : t('garage.reserve')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-4" style={{ height: 500 }}>
                        <GarageSearchMap garages={garages as any} userLocation={userLocation} onSelectGarage={handleReserve as any} height="100%" />
                    </div>
                </div>
            </div>

            {/* Reserve Modal */}
            <Modal isOpen={showReserveModal} onClose={() => setShowReserveModal(false)} title={`Reserve at ${selectedGarage?.name}`} size="lg">
                {selectedGarage && (
                    <ReservationForm
                        garageId={selectedGarage._id}
                        garageName={selectedGarage.name}
                        garageServices={(selectedGarage as any).services || []}
                        vehicles={vehicles}
                        onSuccess={() => {
                            setShowReserveModal(false);
                            setSelectedGarage(null);
                            toast.success('Reservation created!');
                            if (userLocation) doSearch(userLocation, radius);
                        }}
                        onClose={() => setShowReserveModal(false)}
                    />
                )}
            </Modal>

            {/* Details Modal */}
            {selectedGarageId && (
                <GarageDetailsModal
                    garageId={selectedGarageId}
                    isOpen={showDetailsModal}
                    onClose={() => { setShowDetailsModal(false); setSelectedGarageId(null); }}
                    onReserve={handleReserveFromDetails}
                />
            )}
        </div>
    );
}
