import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getAllSimple as getDepartments } from '../Department/DepartmentServices';
import { getBreadcrumbs } from './RecruitmentSettingsBreadcrumb';
import { getSettings, updateSettings } from './RecruitmentSettingsServices';

const RecruitmentSettings = () => {
    const { showLoading, hideLoading, showNotification, organizationScope } = useGlobalContext();
    const [departments, setDepartments] = useState([]);
    const [leadershipDepartmentId, setLeadershipDepartmentId] = useState('');
    const [hrDepartmentId, setHrDepartmentId] = useState('');
    const breadcrumbs = getBreadcrumbs();

    const loadData = async () => {
        const selectedOrganizationId = organizationScope?.selectedOrganizationId || null;
        const needsScope = !!organizationScope?.canSwitchOrganization;
        if (needsScope && !selectedOrganizationId) {
            return;
        }

        showLoading();
        try {
            const [depRes, settingRes] = await Promise.all([
                getDepartments(),
                getSettings(selectedOrganizationId),
            ]);
            const deps = depRes.data?.data || [];
            const settings = settingRes.data?.data || {};

            setDepartments(deps);
            setLeadershipDepartmentId(settings.leadership_department_id || '');
            setHrDepartmentId(settings.hr_department_id || '');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load recruitment settings', 'error');
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        loadData();
    }, [organizationScope?.selectedOrganizationId, organizationScope?.canSwitchOrganization]);

    const handleSave = async () => {
        const selectedOrganizationId = organizationScope?.selectedOrganizationId || null;
        const needsScope = !!organizationScope?.canSwitchOrganization;
        if (needsScope && !selectedOrganizationId) {
            showNotification('Please select organization scope first', 'warning');
            return;
        }

        showLoading();
        try {
            await updateSettings({
                leadership_department_id: leadershipDepartmentId || null,
                hr_department_id: hrDepartmentId || null,
            }, selectedOrganizationId);
            showNotification('Recruitment settings updated', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update recruitment settings', 'error');
        } finally {
            hideLoading();
        }
    };

    return (
        <MainCard breadcrumbs={breadcrumbs}>
            <MetaData title='Recruitment Settings' description='Recruitment settings' />

            <Box sx={{ maxWidth: 640 }}>
                <Stack spacing={2}>
                    <TextField
                        select
                        fullWidth
                        size='small'
                        label='Leadership Department'
                        value={leadershipDepartmentId}
                        onChange={(event) => setLeadershipDepartmentId(event.target.value)}
                    >
                        <MenuItem value=''>None</MenuItem>
                        {departments.map((dep) => (
                            <MenuItem key={dep.id} value={dep.id}>
                                {dep.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        size='small'
                        label='HR Department'
                        value={hrDepartmentId}
                        onChange={(event) => setHrDepartmentId(event.target.value)}
                    >
                        <MenuItem value=''>None</MenuItem>
                        {departments.map((dep) => (
                            <MenuItem key={dep.id} value={dep.id}>
                                {dep.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Stack direction='row' justifyContent='flex-end'>
                        <Button variant='contained' onClick={handleSave}>
                            Save Settings
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </MainCard>
    );
};

export default RecruitmentSettings;
