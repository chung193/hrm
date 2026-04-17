import { Typography } from '@mui/material';
import MainCard from '@components/MainCard';
import { useTranslation } from 'react-i18next';

export default function Reports() {
    const { t } = useTranslation('dashboard');

    return <MainCard
        pageTitle={t('pages.reports.title')}
        pageDescription={t('pages.reports.description')}
    >
        <Typography variant="h4">{t('pages.reports.title')}</Typography>
        <Typography variant="body1">975. Vệ tinh Hiệp sĩ Đen (tên tiếng Anh: Black Knight).
            Là một vật thể không gian bí ẩn quay quanh Trái Đất, tuổi đời của nó lên đến khoảng 13.000 năm và có nguồn gốc ngoài trái đất.</Typography>
    </MainCard>;
}
