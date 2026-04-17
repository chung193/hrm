import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Button } from '@mui/material';
import { setDayjsLocale } from '../theme/dateLocale';
import { AppLang, normalizeLanguage, persistLanguage } from '../i18n/language';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

    const setLang = useCallback((next: AppLang) => {
        if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) === next) return;
        i18n.changeLanguage(next);
        setDayjsLocale(next);                    // đồng bộ Dayjs
        persistLanguage(next);
    }, [i18n]);

    return (
        <Stack direction="row" spacing={1}>
            <Button
                variant={currentLang === 'vi' ? 'contained' : 'outlined'}
                onClick={() => setLang('vi')}
            >
                Tiếng Việt
            </Button>
            <Button
                variant={currentLang === 'en' ? 'contained' : 'outlined'}
                onClick={() => setLang('en')}
            >
                English
            </Button>
        </Stack>
    );
}
