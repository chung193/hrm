import { Box, Divider, Typography, Stack } from '@mui/material';
import SocialButtons from './SocialButtons';
import FormHeader from './FormHeader';
import { useTranslation } from 'react-i18next';

export default function FormLayout({
    title,
    subtitle,
    children,
    footer,
    headerChildren,
    showSocialButtons = false,
    showDivider = false,
}) {
    const { t } = useTranslation('common');

    return (
        <Stack spacing={3}>
            {/* Header Section */}
            {title && (
                <FormHeader title={title} subtitle={subtitle}>
                    {headerChildren}
                </FormHeader>
            )}

            {/* Form Children */}
            {children}

            {/* Divider */}
            {showDivider && (
                <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                        {t('signInWith')}
                    </Typography>
                </Divider>
            )}

            {/* Social Buttons */}
            {showSocialButtons && <SocialButtons />}

            {/* Footer Link */}
            {footer && (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>
                        {footer}
                    </Typography>
                </Box>
            )}
        </Stack>
    );
}
