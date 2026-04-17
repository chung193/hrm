import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AuthBackground from '../pages/Auth/layout/AuthBackground';

export default function AuthLayout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <AuthBackground />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: { xs: 2, sm: 3, md: 4 },
                    gap: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Main Card Container */}
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        maxWidth: '1060px',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: isMobile ? 'none' : theme.shadows[10],
                        backgroundColor: theme.palette.background.paper,
                        minHeight: { xs: 'auto', md: '400px' },
                        flex: 1,
                    }}
                >
                    {/* Left Side - Cover/Image Section */}
                    {!isMobile && (
                        <Box
                            sx={{
                                flex: 1,
                                background: 'linear-gradient(155deg, #0f3d2e 0%, #14532d 38%, #1f6f4a 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                color: 'white',
                                padding: 2.75,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    width: '420px',
                                    height: '420px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: '38% 62% 54% 46% / 45% 39% 61% 55%',
                                    top: '-140px',
                                    left: '-120px',
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    width: '320px',
                                    height: '320px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    borderRadius: '57% 43% 38% 62% / 37% 56% 44% 63%',
                                    bottom: '-90px',
                                    right: '-90px',
                                },
                            }}
                        >
                            <Box sx={{ zIndex: 1, maxWidth: 360 }}>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 88,
                                        px: 1.75,
                                        py: 0.75,
                                        borderRadius: 999,
                                        backgroundColor: 'rgba(255,255,255,0.14)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        mb: 1.5,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    HRM Platform
                                </Box>
                                <Box
                                    component="h1"
                                    sx={{
                                        fontSize: { xs: 24, sm: 32 },
                                        fontWeight: 700,
                                        mb: 1.25,
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.03em',
                                    }}
                                >
                                    Vận hành nhân sự gọn hơn, rõ hơn, đúng theo từng tổ chức
                                </Box>
                                <Box
                                    sx={{
                                        fontSize: 14,
                                        opacity: 0.92,
                                        lineHeight: 1.5,
                                        fontWeight: 400,
                                        maxWidth: 300,
                                        mb: 1.5,
                                    }}
                                >
                                    Theo dõi nhân sự, nghỉ phép, tuyển dụng và tài sản trên một hệ thống thống nhất. Mỗi tài khoản chỉ truy cập đúng công ty và đúng phạm vi được cấp.
                                </Box>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                        gap: 1,
                                        maxWidth: 290,
                                    }}
                                >
                                    {[
                                        'Quản lý hồ sơ',
                                        'Nghỉ phép minh bạch',
                                        'Phân quyền theo org',
                                        'Tài sản tập trung',
                                    ].map((item) => (
                                        <Box
                                            key={item}
                                            sx={{
                                                px: 1.25,
                                                py: 0.8,
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.14)',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                backdropFilter: 'blur(6px)',
                                            }}
                                        >
                                            {item}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Right Side - Form Section */}
                    <Box
                        sx={{
                            flex: isMobile ? 1 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: { xs: 2.5, sm: 3, md: 2.25 },
                            minHeight: { xs: 'auto', md: '400px' },
                        }}
                    >
                        <Box sx={{ width: '100%', maxWidth: '380px' }}>
                            <Outlet />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
