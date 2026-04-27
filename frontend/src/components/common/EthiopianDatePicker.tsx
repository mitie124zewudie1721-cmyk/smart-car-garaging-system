// Ethiopian Calendar Date Picker
import { useState, useRef, useEffect } from 'react';

const ET_MONTHS = [
    'September','October','November','December','January','February',
    'March','April','May','June','July','August','Pagume',
];
const ET_MONTHS_AM = [
    'መስከረም','ጥቅምት','ህዳር','ታህሳስ','ጥር','የካቲት',
    'መጋቢት','ሚያዚያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜ',
];

// GC to JDN
function gcToJDN(y: number, m: number, d: number): number {
    const a = Math.floor((14 - m) / 12);
    const yr = y + 4800 - a;
    const mo = m + 12 * a - 3;
    return d + Math.floor((153 * mo + 2) / 5) + 365 * yr
        + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

// JDN to GC
function jdnToGc(jdn: number) {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor(146097 * b / 4);
    const d2 = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor(1461 * d2 / 4);
    const mo = Math.floor((5 * e + 2) / 153);
    return {
        day: e - Math.floor((153 * mo + 2) / 5) + 1,
        month: mo + 3 - 12 * Math.floor(mo / 10),
        year: 100 * b + d2 - 4800 + Math.floor(mo / 10),
    };
}

// ET epoch: Meskerem 1, 1 EC = JDN 1724221
const ET_EPOCH = 1723860; // Meskerem 1, 1 EC (calibrated)

function jdnToEt(jdn: number) {
    const r = jdn - ET_EPOCH;
    const n4 = Math.floor(r / 1461);
    const rem = r % 1461;
    const n1 = Math.min(Math.floor(rem / 365), 3);
    const year = n4 * 4 + n1;
    const dayOfYear = rem - n1 * 365;
    const month = Math.floor(dayOfYear / 30) + 1;
    const day = (dayOfYear % 30) + 1;
    return { year, month: Math.min(month, 13), day };
}

function etToJDN(y: number, m: number, d: number): number {
    const n4 = Math.floor(y / 4);
    const n1 = y % 4;
    return ET_EPOCH + n4 * 1461 + n1 * 365 + (m - 1) * 30 + (d - 1);
}

function gcToEt(date: Date) {
    return jdnToEt(gcToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

function etToGc(y: number, m: number, d: number): Date {
    const g = jdnToGc(etToJDN(y, m, d));
    return new Date(g.year, g.month - 1, g.day);
}

function etDaysInMonth(m: number, y: number) {
    return m < 13 ? 30 : (y % 4 === 3 ? 6 : 5);
}

interface Props {
    label: string;
    value: string;
    onChange: (v: string) => void;
    min?: string;
    disabled?: boolean;
    error?: string;
}

export default function EthiopianDatePicker({ label, value, onChange, min, disabled, error }: Props) {
    const todayEt = gcToEt(new Date());
    const [calType, setCalType] = useState<'GC' | 'EC'>('GC');
    const [showPicker, setShowPicker] = useState(false);
    const [time, setTime] = useState('08:00');
    const [ecYear, setEcYear] = useState(todayEt.year);
    const [ecMonth, setEcMonth] = useState(todayEt.month);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
            const et = gcToEt(d);
            setEcYear(et.year); setEcMonth(et.month);
        }
    }, [value]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setShowPicker(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const minEt = min ? gcToEt(new Date(min)) : gcToEt(new Date());

    const isPast = (y: number, m: number, d: number) => {
        if (y < minEt.year) return true;
        if (y === minEt.year && m < minEt.month) return true;
        if (y === minEt.year && m === minEt.month && d < minEt.day) return true;
        return false;
    };

    const canGoBack = () =>
        ecYear > minEt.year || (ecYear === minEt.year && ecMonth > minEt.month);

    const prevMonth = () => {
        if (!canGoBack()) return;
        if (ecMonth === 1) { setEcMonth(13); setEcYear(y => y - 1); }
        else setEcMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (ecMonth === 13) { setEcMonth(1); setEcYear(y => y + 1); }
        else setEcMonth(m => m + 1);
    };

    const toLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const applyDay = (d: number) => {
        if (isPast(ecYear, ecMonth, d)) return;
        const gc = etToGc(ecYear, ecMonth, d);
        const [hh, mm] = time.split(':');
        gc.setHours(Number(hh), Number(mm), 0, 0);
        onChange(toLocalISO(gc));
    };

    const handleGcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        if (e.target.value) {
            const et = gcToEt(new Date(e.target.value));
            setEcYear(et.year); setEcMonth(et.month);
            setTime(e.target.value.slice(11, 16) || '08:00');
        }
    };

    const handleTimeChange = (t: string) => {
        setTime(t);
        if (value) {
            const d = new Date(value);
            const [hh, mm] = t.split(':');
            d.setHours(Number(hh), Number(mm), 0, 0);
            onChange(toLocalISO(d));
        }
    };

    const selectedEt = value ? gcToEt(new Date(value)) : null;

    // Ethiopian clock: 6 AM GC = 1:00 ET morning
    const toEtTime = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        const etHour = ((hh + 6) % 12) || 12;
        const period = hh >= 6 && hh < 12 ? 'morning' : hh >= 12 && hh < 18 ? 'afternoon' : 'night';
        return `${etHour}:${String(mm).padStart(2,'0')} ${period}`;
    };

    const displayValue = () => {
        if (!value || !selectedEt) return '';
        if (calType === 'EC') {
            return `${ET_MONTHS[selectedEt.month - 1]} (${ET_MONTHS_AM[selectedEt.month - 1]}) ${selectedEt.day}, ${selectedEt.year} — ${toEtTime(time)}`;
        }
        return value.replace('T', ' ');
    };

    const days = etDaysInMonth(ecMonth, ecYear);

    return (
        <div className="relative" ref={ref}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            <div className="flex gap-1 mb-2">
                {(['GC', 'EC'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setCalType(t)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${calType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {t === 'GC' ? '🌍 Gregorian' : '🇪🇹 Ethiopian'}
                    </button>
                ))}
            </div>

            {calType === 'GC' ? (
                <input type="datetime-local" value={value}
                    min={min || new Date().toISOString().slice(0, 16)}
                    disabled={disabled} onChange={handleGcChange}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${error ? 'border-red-400' : 'border-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            ) : (
                <div>
                    <button type="button" disabled={disabled} onClick={() => setShowPicker(v => !v)}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-left transition ${error ? 'border-red-400' : 'border-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400'} ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                        {displayValue() || 'Select Ethiopian date...'}
                    </button>

                    {showPicker && (
                        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-72">
                            <div className="flex items-center justify-between mb-3">
                                <button type="button" onClick={prevMonth}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition ${canGoBack() ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-200 cursor-not-allowed'}`}>&#8249;</button>
                                <div className="text-center">
                                    <p className="font-bold text-slate-800 text-sm">{ET_MONTHS[ecMonth - 1]}</p>
                                    <p className="text-xs text-slate-500">{ET_MONTHS_AM[ecMonth - 1]} {ecYear} EC</p>
                                </div>
                                <button type="button" onClick={nextMonth}
                                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 text-lg">&#8250;</button>
                            </div>

                            <div className="grid grid-cols-6 gap-1 mb-3">
                                {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                                    const past = isPast(ecYear, ecMonth, d);
                                    const isToday = ecYear === todayEt.year && ecMonth === todayEt.month && d === todayEt.day;
                                    const isSel = selectedEt?.year === ecYear && selectedEt?.month === ecMonth && selectedEt?.day === d;
                                    return (
                                        <button key={d} type="button" disabled={past}
                                            onClick={() => applyDay(d)}
                                            className={`h-8 w-full rounded-lg text-xs font-medium transition-all ${past ? 'text-slate-300 cursor-not-allowed line-through' : isSel ? 'bg-indigo-600 text-white shadow' : isToday ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-400' : 'hover:bg-indigo-50 text-slate-700'}`}>
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs text-slate-500">Time (GC 24h)</label>
                                    {time && <span className="text-xs font-semibold text-indigo-600">ET: {toEtTime(time)}</span>}
                                </div>
                                <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                            </div>

                            {value && (
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    GC: {new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}

                            <button type="button" onClick={() => setShowPicker(false)}
                                className="mt-3 w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
                                Done
                            </button>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}