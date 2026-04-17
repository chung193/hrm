import { useEffect, useState } from 'react';
import { Box, Card, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { People } from '@mui/icons-material';
import StatCard from './components/StatCard';
import { getStatisticsDashboard } from '@services/statistics';
import { useGlobalContext } from '@providers/GlobalProvider';
import UsersByRoleChart from './components/UsersByRoleChart';
import { useTranslation } from 'react-i18next';

const iconMap = {
    Users: People,
};

export default function Home() {
    const [stats, setStats] = useState(null);
    const { showLoading, hideLoading } = useGlobalContext();
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                showLoading();
                const dashboardData = await getStatisticsDashboard();
                setStats(dashboardData);
            } catch (error) {
                console.error('Error loading statistics:', error);
            } finally {
                hideLoading();
            }
        };

        fetchStatistics();
    }, []);

    const statData =
        stats?.summary?.map((stat) => ({
            ...stat,
            icon: iconMap[stat.icon],
            trendLabel: t('pages.home.trendPreviousMonth'),
        })) || [];

    return (
        <Box sx={{ bgcolor: 'background.default', py: 4 }}>
            <Container maxWidth="xl">
                <Grid container spacing={2} mb={3}>
                    {statData.map((stat, idx) => (
                        <Grid item xs={12} sm={6} lg={3} key={idx}>
                            <StatCard {...stat} />
                        </Grid>
                    ))}
                </Grid>

                {stats?.charts?.usersByRole?.length > 0 && (
                    <Box mb={3}>
                        <UsersByRoleChart data={stats.charts.usersByRole} />
                    </Box>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}>
                            <Stack spacing={1}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {t('pages.home.users')}
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">
                                            {t('pages.home.active')}
                                        </Typography>
                                        <Chip label={stats?.details?.users?.active ?? 0} size="small" color="success" variant="outlined" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">
                                            {t('pages.home.inactive')}
                                        </Typography>
                                        <Chip label={stats?.details?.users?.inactive ?? 0} size="small" color="error" variant="outlined" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">
                                            {t('pages.home.thisMonth')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {stats?.details?.users?.thisMonth ?? 0}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
