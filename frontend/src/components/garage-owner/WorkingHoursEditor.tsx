import { useTranslation } from 'react-i18next';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export interface DaySchedule { open: boolean; start: string; end: string; }
export type WeeklySchedule = Record<string, DaySchedule>;

export const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday:    { open: false, start: '', end: '' },
    tuesday:   { open: false, start: '', end: '' },
    wednesday: { open: false, start: '', end: '' },
    thursday:  { open: false, start: '', end: '' },
    friday:    { open: false, start: '', end: '' },
    saturday:  { open: false, start: '', end: '' },
    sunday:    { open: false, start: '', end: '' },
};

function to12h(time: string): string {
    if (!time || !time.includes(':')) return '';
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + mStr + ' ' + period;
}

function cx(...args: string[]) { return args.filter(Boolean).join(' '); }

interface Props { value: WeeklySchedule; onChange: (s: WeeklySchedule) => void; }

export default function WorkingHoursEditor({ value, onChange }: Props) {
    const { t } = useTranslation();

    const DAY_KEYS: Record<string, string> = {
        monday:    'workingHours.monday',
        tuesday:   'workingHours.tuesday',
        wednesday: 'workingHours.wednesday',
        thursday:  'workingHours.thursday',
        friday:    'workingHours.friday',
        saturday:  'workingHours.saturday',
        sunday:    'workingHours.sunday',
    };

    const update = (day: string, field: string, val: boolean | string) =>
        onChange({ ...value, [day]: { ...value[day], [field]: val } });

    const copyToAll = (day: string) => {
        const src = value[day];
        const u = { ...value };
        DAYS.forEach(d => { if (u[d].open) u[d] = { ...u[d], start: src.start, end: src.end }; });
        onChange(u);
    };

    const openCount = DAYS.filter(d => value[d]?.open).length;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">{t('workingHours.weeklySchedule')}</p>
                <p className="text-xs text-slate-400">
                    {openCount === 1 ? t('workingHours.daysOpen', { count: openCount }) : t('workingHours.daysOpenPlural', { count: openCount })}
                </p>
            </div>
            {DAYS.map(day => {
                const s = value[day] || { open: false, start: '', end: '' };
                const isInvalid = Boolean(s.open && s.start && s.end && s.end <= s.start);
                const rowCls = cx('flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all', s.open ? 'bg-white border-indigo-200' : 'bg-slate-50 border-slate-200');
                const btnCls = cx('relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0', s.open ? 'bg-indigo-600' : 'bg-slate-300');
                const dotCls = cx('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', s.open ? 'translate-x-4' : 'translate-x-1');
                const lblCls = cx('text-sm font-semibold w-24', s.open ? 'text-slate-800' : 'text-slate-400');
                return (
                    <div key={day} className={rowCls}>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => update(day, 'open', !s.open)} className={btnCls}>
                                <span className={dotCls} />
                            </button>
                            <span className={lblCls}>{t(DAY_KEYS[day])}</span>
                        </div>
                        {s.open ? (
                            <div className="flex items-center gap-3 flex-1 flex-wrap">
                                <div className="flex flex-col items-start">
                                    <label className="text-xs text-slate-500 mb-0.5">{t('workingHours.open')}</label>
                                    <input type="time" value={s.start} onChange={e => update(day, 'start', e.target.value)}
                                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    {s.start ? <span className="text-xs text-indigo-600 font-medium mt-0.5">{to12h(s.start)}</span> : null}
                                </div>
                                <span className="text-slate-400 text-xs mt-3">{t('workingHours.to')}</span>
                                <div className="flex flex-col items-start">
                                    <label className="text-xs text-slate-500 mb-0.5">{t('workingHours.close')}</label>
                                    <input type="time" value={s.end} onChange={e => update(day, 'end', e.target.value)}
                                        className={cx('border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400', isInvalid ? 'border-red-400 bg-red-50' : 'border-slate-200')} />
                                    {s.end ? <span className="text-xs text-indigo-600 font-medium mt-0.5">{to12h(s.end)}</span> : null}
                                    {isInvalid ? <span className="text-xs text-red-500 font-medium">{t('workingHours.mustBeAfter')}</span> : null}
                                </div>
                                <button type="button" onClick={() => copyToAll(day)}
                                    className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition whitespace-nowrap self-center">
                                    {t('workingHours.copyToAll')}
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 italic">{t('workingHours.closed')}</span>
                        )}
                    </div>
                );
            })}
            {openCount === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    {t('workingHours.toggleAtLeastOne')}
                </p>
            )}
        </div>
    );
}
