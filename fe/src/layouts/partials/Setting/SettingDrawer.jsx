import ThemeSwitcher from '@components/ThemeSwitcher'
import LanguageSwitcher from '@components/LanguageSwitcher'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const SettingDrawer = () => {
    const { t } = useTranslation('common');

    return (
        <Box sx={{
            minWidth: 300
        }}>
            <Typography variant='h6'>{t('settings')}</Typography>
            <Stack spacing={2} sx={{ py: 2 }}>
                <Typography variant='body1'>{t('colors')}</Typography>
                <ThemeSwitcher />
                <Divider />
                <Typography variant='body1'>{t('languages')}</Typography>
                <LanguageSwitcher />
                <Divider />
            </Stack>
        </Box>
    )
}

export default SettingDrawer
