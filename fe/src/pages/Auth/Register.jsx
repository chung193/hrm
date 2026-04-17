import { Button, Stack, TextField, Typography, Link, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormLayout from './layout/FormLayout';
import { useTranslation } from 'react-i18next';

/* ===== ZOD SCHEMA ===== */
const createRegisterSchema = (t) => z
    .object({
        name: z.string().min(2, t('messages.min', { field: t('labels.fullName'), count: 2 })),
        email: z.string().email(t('messages.emailInvalid')),
        password: z.string().min(8, t('messages.min', { field: t('labels.password'), count: 8 })),
        password_confirmation: z.string().min(8),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: t('messages.passwordMismatch'),
        path: ['password_confirmation'],
    });

export default function Register() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createRegisterSchema(t)),
        defaultValues: {
            name: 'new member',
            email: 'testbro@example.com',
            password: '12345678',
            password_confirmation: '12345678',
        },
    });

    const onSubmit = async (data) => {
        await registerUser(data);
        navigate('/dashboard', { replace: true });
    };

    const formContent = (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                {/* Name Field */}
                <Box>
                    <TextField
                        fullWidth
                        label={t('labels.fullName')}
                        placeholder={t('auth.fullNamePlaceholder')}
                        size="medium"
                        {...register('name')}
                        error={!!errors.name}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.name && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            {errors.name?.message}
                        </Typography>
                    )}
                </Box>

                {/* Email Field */}
                <Box>
                    <TextField
                        fullWidth
                        label={t('labels.email')}
                        placeholder={t('auth.emailPlaceholder')}
                        size="medium"
                        {...register('email')}
                        error={!!errors.email}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.email && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            {errors.email?.message}
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

                {/* Confirm Password Field */}
                <Box>
                    <TextField
                        fullWidth
                        label={t('labels.confirmPassword')}
                        type="password"
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        size="medium"
                        {...register('password_confirmation')}
                        error={!!errors.password_confirmation}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.password_confirmation && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            {errors.password_confirmation?.message}
                        </Typography>
                    )}
                </Box>

                {/* Sign Up Button */}
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
                        t('auth.createAccount')
                    )}
                </Button>
            </Stack>
        </form>
    );

    const footerText = (
        <>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
                href="/auth/login"
                sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                }}
            >
                {t('auth.signIn')}
            </Link>
        </>
    );

    return (
        <FormLayout
            title={t('auth.createAccount')}
            subtitle={t('auth.joinSubtitle')}
            children={formContent}
            showDivider
            showSocialButtons
            footer={footerText}
        />
    );
}
