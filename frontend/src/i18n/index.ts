// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';

// Always default to English — only use saved preference if it's a valid non-default choice
const savedLang = localStorage.getItem('i18nextLng');
const validLangs = ['en', 'am', 'om'];
// If saved lang is missing or was 'am' set by old default, reset to 'en'
const lng = (savedLang && validLangs.includes(savedLang) && savedLang !== 'am')
    ? savedLang
    : 'en';

// Ensure localStorage reflects the actual language being used
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
