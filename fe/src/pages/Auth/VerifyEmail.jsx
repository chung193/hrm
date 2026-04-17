import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CircularProgress, Typography, Box, Button, Stack } from "@mui/material";
import { CheckCircle, Error } from "@mui/icons-material";
import { useAuth } from '@providers/AuthProvider';
import FormLayout from './layout/FormLayout';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { verifyEmail } = useAuth();
    const { t } = useTranslation('common');
    const url = params.get("url");
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

    useEffect(() => {
        if (!url) {
            setStatus('error');
            return;
        }

        verifyEmail(decodeURIComponent(url))
            .then(() => {
                setStatus('success');
            })
            .catch(() => {
                setStatus('error');
            });
    }, []);

    if (status === 'verifying') {
        const content = (
            <Stack spacing={3} sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={60} />
                </Box>
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: 'text.primary',
                        }}
                    >
                        {t('auth.verifyingEmail')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('auth.verifyingEmailSubtitle')}
                    </Typography>
                </Box>
            </Stack>
        );

        return <FormLayout children={content} />;
    }

    if (status === 'success') {
        const content = (
            <Stack spacing={3} sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
                </Box>
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: 'success.main',
                        }}
                    >
                        {t('auth.emailVerified')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('auth.emailVerifiedSubtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/auth/login')}
                    sx={{
                        py: 1.5,
                        fontSize: 15,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 1,
                    }}
                >
                    {t('auth.goToLogin')}
                </Button>
            </Stack>
        );

        return <FormLayout children={content} />;
    }

    const content = (
        <Stack spacing={3} sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Error sx={{ fontSize: 80, color: 'error.main' }} />
            </Box>
            <Box>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: 'error.main',
                    }}
                >
                    {t('auth.verificationFailed')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('auth.verificationFailedSubtitle')}
                </Typography>
            </Box>
            <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth/login')}
                sx={{
                    py: 1.5,
                    fontSize: 15,
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 1,
                }}
            >
                {t('auth.backToLogin')}
            </Button>
        </Stack>
    );

    return <FormLayout children={content} />;
}
