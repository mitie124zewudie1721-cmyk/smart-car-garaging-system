// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';

// Version bump forces language reset when new translations are deployed
const I18N_VERSION = '3';
const storedVersion = localStorage.getItem('i18nVersion');
if (storedVersion !== I18N_VERSION) {
    // Reset to English on version change
    localStorage.removeItem('i18nextLng');
    localStorage.setItem('i18nVersion', I18N_VERSION);
}

const savedLang = localStorage.getItem('i18nextLng') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            am: { translation: am },
            om: { translation: om },
        },
        lng: savedLang,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
});

export default i18n;
