export type AppLang = 'vi' | 'en';

export const DEFAULT_LANG: AppLang = 'vi';

export const normalizeLanguage = (lang?: string | null): AppLang => {
    const value = String(lang || '').toLowerCase();
    if (value.startsWith('en')) return 'en';
    return 'vi';
};

export const persistLanguage = (lang: AppLang) => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr';
};
