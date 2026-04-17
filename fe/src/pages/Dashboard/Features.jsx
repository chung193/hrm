import { Typography, Button, Stack } from '@mui/material';
import MainCard from '@components/MainCard';
import { useGlobalContext } from '../../providers/GlobalProvider';
import { useTranslation } from 'react-i18next';

export default function Features() {
    const { t } = useTranslation(['dashboard', 'common']);
    const {
        showNotification,
        showLoading,
        hideLoading,
        openModal,
        closeModal,
        openDrawer,
        closeDrawer,
        showConfirm,
        closeConfirm
    } = useGlobalContext();

    return <MainCard
        pageTitle={t('pages.features.title')}
        pageDescription={t('pages.features.description')}
    >
        <Typography variant="h4" sx={{ my: 2 }}>{t('pages.features.title')}</Typography>
        <Stack spacing={2} direction={'row'}>
            <Button onClick={showLoading} variant='outlined'>{t('pages.features.loading')}</Button>
            <Button onClick={hideLoading} variant='outlined'>{t('pages.features.hideLoading')}</Button>
            <Button onClick={() => showNotification(t('pages.features.sampleNotification'), 'info')} variant='outlined'>
                {t('pages.features.showNotification')}
            </Button>
            <Button onClick={() => openModal(
                t('pages.features.sampleNotification')
            )} variant='outlined'>{t('pages.features.openModal')}</Button>
            <Button onClick={closeModal} variant='outlined'>{t('pages.features.closeModal')}</Button>
            <Button onClick={() => openDrawer({ content: t('pages.features.sampleContent') })} variant='outlined'>{t('pages.features.openDrawer')}</Button>
            <Button onClick={closeDrawer} variant='outlined'>{t('pages.features.closeDrawer')}</Button>

            <Button onClick={
                () => showConfirm({
                    title: t('messages.confirmDeletion', { ns: 'common' }),
                    content: t('messages.deleteItems', { ns: 'common', count: 1 }),
                    onConfirm: async () => { },
                    onCancel: () => { closeConfirm() }
                })
            }
                variant='outlined'>
                {t('pages.features.showConfirm')}
            </Button>

            <Button onClick={closeConfirm} variant='outlined'>{t('pages.features.closeConfirm')}</Button>

        </Stack>

    </MainCard>;
}
