// src/components/common/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
    { code: 'om', label: 'Afaan Oromoo', flag: '🇪🇹' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition"
                title="Change language"
            >
                <Globe size={15} />
                <span className="hidden sm:inline">{current.flag} {current.label}</span>
                <span className="sm:hidden">{current.flag}</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition hover:bg-slate-50 dark:hover:bg-slate-700 ${i18n.language?.startsWith(lang.code)
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.label}</span>
                            {i18n.language === lang.code && <span className="ml-auto text-indigo-500">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
