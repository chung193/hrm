import { Box, Button, CircularProgress, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '@providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import FormLayout from './layout/FormLayout';

/* ===== ZOD SCHEMA ===== */
const loginSchema = z.object({
    username: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export default function Login() {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
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
                Forgot password?
            </Link>
        </Box>
    );

    const formContent = (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                <Box>
                    <TextField
                        fullWidth
                        label="Email"
                        placeholder="Enter your email"
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
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        size="medium"
                        {...register('password')}
                        error={!!errors.password}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            edge="end"
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
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
                        'Đăng nhập'
                    )}
                </Button>
            </Stack>
        </form>
    );

    return (
        <FormLayout
            title="Welcome to HRM app"
            subtitle="Đăng nhập vào hệ thống quản trị nhân sự của doanh nghiệp bạn."
            headerChildren={headerChildren}
            children={formContent}
        />
    );
}
