// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';

// Always start with English — clear any old Amharic default
const saved = localStorage.getItem('i18nextLng');
// Only keep saved preference if user explicitly chose 'om' (Oromo)
// Reset 'am' (old default) and anything else back to 'en'
const lng = saved === 'om' ? 'om' : 'en';
localStorage.setItem('i18nextLng', lng);

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            am: { translation: am },
            om: { translation: om },
        },
        lng,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

i18n.on('languageChanged', (lang) => {
    localStorage.setItem('i18nextLng', lang);
});

export default i18n;
