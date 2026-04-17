import { Button, Stack, TextField, Checkbox, FormControlLabel, Typography, Link, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import FormLayout from './layout/FormLayout';
import { useTranslation } from 'react-i18next';

/* ===== ZOD SCHEMA ===== */
const createLoginSchema = (t) => z.object({
    username: z.string().email(t('messages.emailInvalid')),
    password: z.string().min(6, t('messages.min', { field: t('labels.password'), count: 6 })),
    remember: z.boolean().optional(),
});

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createLoginSchema(t)),
        defaultValues: {
            username: '',
            password: '',
            remember: false,
        },
    });

    const onSubmit = async (data) => {
        await login(data.username, data.password)
    };

    const headerChildren = (
        <Box sx={{ textAlign: 'right', mb: -2, mt: -1 }}>
            <Link
                href="/auth/forgot"
                sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                }}
            >
                {t('auth.forgotPassword')}
            </Link>
        </Box>
    );

    const formContent = (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                <Box>
                    <TextField
                        fullWidth
                        label={t('labels.email')}
                        placeholder={t('auth.emailPlaceholder')}
                        size="medium"
                        {...register('username')}
                        error={!!errors.username}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.username && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            {errors.username?.message}
                        </Typography>
                    )}
                </Box>

                {/* Password Field */}
                <Box>
                    <TextField
                        fullWidth
                        label={t('labels.password')}
                        type="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        size="medium"
                        {...register('password')}
                        error={!!errors.password}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.password && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            {errors.password?.message}
                        </Typography>
                    )}
                </Box>

                {/* Remember Me */}
                <FormControlLabel
                    control={
                        <Checkbox
                            {...register('remember')}
                            sx={{
                                '&.Mui-checked': {
                                    color: 'primary.main',
                                },
                            }}
                        />
                    }
                    label={t('auth.rememberMe')}
                    sx={{
                        mb: 0.5,
                        '& .MuiFormControlLabel-label': {
                            fontSize: 14,
                            color: 'text.secondary',
                        },
                    }}
                />

                {/* Sign In Button */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                        py: 1.5,
                        fontSize: 15,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 1,
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        boxShadow: theme => `0 4px 12px rgba(${theme.palette.mode === 'dark' ? '59, 130, 246' : '59, 130, 246'}, 0.3)`,
                        '&:hover': {
                            boxShadow: theme => `0 6px 16px rgba(${theme.palette.mode === 'dark' ? '59, 130, 246' : '59, 130, 246'}, 0.4)`,
                        },
                        '&:disabled': {
                            background: 'rgba(128, 128, 128, 0.5)',
                        },
                    }}
                >
                    {isSubmitting ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                        t('auth.signIn')
                    )}
                </Button>
            </Stack>
        </form>
    );

    const footerText = (
        <>
            {t('auth.dontHaveAccount')}{' '}
            <Link
                href="/auth/register"
                sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                }}
            >
                {t('auth.signUp')}
            </Link>
        </>
    );

    return (
        <FormLayout
            title={t('auth.welcomeBack')}
            subtitle={t('auth.signInSubtitle')}
            headerChildren={headerChildren}
            children={formContent}
            showDivider
            showSocialButtons
            footer={footerText}
        />
    );
}
