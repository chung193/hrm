import { Card, CardContent, Typography, Box } from '@mui/material';
import Breadcrumb from './Breadcrumb';

export default function MainCard({
    children = null,
    sx = {},
    breadcrumbs = [
        {
            label: 'Trang chủ',
            path: '#',
        },
        {
            label: 'Thống kê',
            path: '#',
        },
    ],
    showBreadcrumb = true,
    totalCount = null,
}) {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                p: 3,
                bgcolor: 'background.default',
                ...sx,
            }}
        >
            {showBreadcrumb && <Breadcrumb breadcrumbs={breadcrumbs} />}

            <Card
                sx={{
                    minWidth: '100%',
                    borderRadius: 2,
                }}
            >
                <CardContent>
                    {typeof totalCount === 'number' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Total matched records: <strong>{totalCount}</strong>
                        </Typography>
                    )}
                    {children}
                </CardContent>
            </Card>
        </Box>
    );
}
