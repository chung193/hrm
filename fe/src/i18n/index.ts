import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enDashboard from './locales/en/dashboard.json';
import viDashboard from './locales/vi/dashboard.json';
import { DEFAULT_LANG, normalizeLanguage, persistLanguage } from './language';
import { setDayjsLocale } from '../theme/dateLocale';

const initialLang = normalizeLanguage(localStorage.getItem('lang') || document.documentElement.lang || DEFAULT_LANG);

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: enCommon, dashboard: enDashboard },
            vi: { common: viCommon, dashboard: viDashboard }
        },
        lng: initialLang,
        fallbackLng: 'en',
        supportedLngs: ['vi', 'en'],
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        interpolation: { escapeValue: false }
    });

persistLanguage(initialLang);
setDayjsLocale(initialLang);

export default i18n;
