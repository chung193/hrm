import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    Typography,
} from '@mui/material';

import { assignRoles, getAllRole, show } from './UserServices';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getMediaUrl } from '@utils/mediaUrl';
import { getLeaveBalance } from '@pages/Dashboard/LeaveRequest/LeaveRequestServices';

const UserInfo = ({ id }) => {
    const [user, setUser] = useState({});
    const [roles, setRoles] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [savingRoles, setSavingRoles] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const { showNotification } = useGlobalContext();

    const loadUser = () => {
        return show(id).then((res) => {
            const nextUser = res.data.data || {};
            setUser(nextUser);
            setSelectedRoleIds(Array.isArray(nextUser.roles) ? nextUser.roles.map((role) => role.id) : []);
        });
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        Promise.all([loadUser(), getAllRole({ per_page: 100 })])
            .then(([, roleRes]) => {
                setRoles(roleRes.data.data || []);
            })
            .catch((err) => {
                showNotification(err.response?.data?.message || 'Cannot load user data', 'error');
            });
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        getLeaveBalance(null, id)
            .then((res) => setLeaveBalance(res.data?.data || null))
            .catch(() => setLeaveBalance(null));
    }, [id]);

    const selectedRoleNames = useMemo(() => {
        if (!Array.isArray(user.roles)) {
            return [];
        }

        return user.roles.map((role) => role.name).filter(Boolean);
    }, [user.roles]);

    const handleSaveRoles = () => {
        setSavingRoles(true);

        assignRoles(id, selectedRoleIds)
            .then((res) => {
                const nextUser = res.data.data || {};
                setUser((prev) => ({ ...prev, ...nextUser }));
                setSelectedRoleIds(Array.isArray(nextUser.roles) ? nextUser.roles.map((role) => role.id) : []);
                showNotification(res.data.message || 'Updated roles successfully', 'success');
            })
            .catch((err) => {
                showNotification(err.response?.data?.message || 'Cannot update roles', 'error');
            })
            .finally(() => setSavingRoles(false));
    };

    return (
        <Box>
            <Stack direction="column" spacing={2} alignItems="center">
                <Box sx={{ p: 2 }}>
                    <Avatar
                        alt={user.name}
                        src={getMediaUrl(user.avatar)}
                        sx={{
                            width: 100,
                            height: 100,
                            border: '4px solid #2c3e50',
                        }}
                    />
                </Box>

                <Typography>
                    <strong>{user.name}</strong>
                </Typography>
                <Typography sx={{ color: '#7f8c8d' }}>
                    <span>{user.detail?.position || '-'}</span>
                </Typography>
            </Stack>

            <Typography sx={{ mb: 2, mt: 3 }} variant="h6">
                <strong>Role</strong>
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="user-role-select-label">Roles</InputLabel>
                    <Select
                        labelId="user-role-select-label"
                        multiple
                        value={selectedRoleIds}
                        onChange={(event) => setSelectedRoleIds(event.target.value)}
                        input={<OutlinedInput label="Roles" />}
                        renderValue={(selected) =>
                            roles
                                .filter((role) => selected.includes(role.id))
                                .map((role) => role.name)
                                .join(', ')
                        }
                    >
                        {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                                {role.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {selectedRoleNames.length > 0 ? (
                        selectedRoleNames.map((roleName) => (
                            <Chip key={roleName} label={roleName} size="small" color="primary" variant="outlined" />
                        ))
                    ) : (
                        <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                            No role assigned
                        </Typography>
                    )}
                </Stack>

                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveRoles}
                    disabled={savingRoles}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    {savingRoles ? 'Saving...' : 'Save roles'}
                </Button>
            </Stack>

            <Typography sx={{ mb: 2 }} variant="h6">
                <strong>Profile</strong>
            </Typography>

            <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Email</strong>
                    </Typography>
                    <Typography>{user.email || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Employee Code</strong>
                    </Typography>
                    <Typography>{user.detail?.employee_code || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Organization</strong>
                    </Typography>
                    <Typography>{user.detail?.organization?.name || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Department</strong>
                    </Typography>
                    <Typography>{user.detail?.department?.name || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Title</strong>
                    </Typography>
                    <Typography>{user.detail?.department_title?.name || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Github</strong>
                    </Typography>
                    <Typography>{user.detail?.github || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Website</strong>
                    </Typography>
                    <Typography>{user.detail?.website || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Phone</strong>
                    </Typography>
                    <Typography>{user.detail?.phone || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Address</strong>
                    </Typography>
                    <Typography>{user.detail?.address || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>City</strong>
                    </Typography>
                    <Typography>{user.detail?.city || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Join Date</strong>
                    </Typography>
                    <Typography>{user.detail?.join_date || '-'}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                    <Typography sx={{ width: 140 }}>
                        <strong>Hired At</strong>
                    </Typography>
                    <Typography>{user.detail?.hired_at || '-'}</Typography>
                </Stack>
            </Stack>

            <Typography sx={{ mb: 2, mt: 3 }} variant="h6">
                <strong>Leave Balance</strong>
            </Typography>
            {leaveBalance ? (
                <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2}>
                        <Typography sx={{ width: 140 }}>
                            <strong>As Of</strong>
                        </Typography>
                        <Typography>{leaveBalance.as_of_date || '-'}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Typography sx={{ width: 140 }}>
                            <strong>Total Available</strong>
                        </Typography>
                        <Typography>{leaveBalance.available_total ?? '-'}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Typography sx={{ width: 140 }}>
                            <strong>Current Remaining</strong>
                        </Typography>
                        <Typography>{leaveBalance.remaining_current_year ?? '-'}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Typography sx={{ width: 140 }}>
                            <strong>Prev Year Available</strong>
                        </Typography>
                        <Typography>{leaveBalance.available_previous_year ?? '-'}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Typography sx={{ width: 140 }}>
                            <strong>Prev Year Expired</strong>
                        </Typography>
                        <Typography>{leaveBalance.expired_previous_year ?? '-'}</Typography>
                    </Stack>
                </Stack>
            ) : (
                <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 2 }}>
                    No leave balance data
                </Typography>
            )}
        </Box>
    );
};

export default UserInfo;
