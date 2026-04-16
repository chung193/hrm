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
import { useNavigate } from 'react-router-dom';

import { assignRoles, assignRolesSystem, destroySystem, getAllRole, show, showSystem, updateSystem } from './UserServices';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getMediaUrl } from '@utils/mediaUrl';
import { getLeaveBalance } from '@pages/Dashboard/LeaveRequest/LeaveRequestServices';

const infoRowSx = {
    display: 'grid',
    gridTemplateColumns: 'minmax(110px, 140px) minmax(0, 1fr)',
    columnGap: 2,
    alignItems: 'start',
};

const valueTextSx = {
    minWidth: 0,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
};

const UserInfo = ({ id, scopeMode = 'organization' }) => {
    const [user, setUser] = useState({});
    const [roles, setRoles] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [savingRoles, setSavingRoles] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [deletingUser, setDeletingUser] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const navigate = useNavigate();
    const { showNotification, showConfirm, closeConfirm } = useGlobalContext();
    const isSystemScope = scopeMode === 'system';
    const loadUserFn = isSystemScope ? showSystem : show;
    const assignRolesFn = isSystemScope ? assignRolesSystem : assignRoles;

    const loadUser = () => {
        return loadUserFn(id).then((res) => {
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
    }, [id, scopeMode]);

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

        assignRolesFn(id, selectedRoleIds)
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

    const handleToggleStatus = () => {
        if (!isSystemScope) {
            return;
        }

        setUpdatingStatus(true);

        updateSystem(id, { is_active: !user.is_active })
            .then(() => loadUser())
            .then(() => {
                showNotification(user.is_active ? 'Locked user successfully' : 'Unlocked user successfully', 'success');
            })
            .catch((err) => {
                showNotification(err.response?.data?.message || 'Cannot update user status', 'error');
            })
            .finally(() => setUpdatingStatus(false));
    };

    const handleDeleteUser = () => {
        if (!isSystemScope) {
            return;
        }

        showConfirm(
            'Delete user',
            `Delete user "${user.name || id}" permanently?`,
            async () => {
                setDeletingUser(true);

                try {
                    await destroySystem(id);
                    closeConfirm();
                    showNotification('Deleted user successfully', 'success');
                    navigate('/dashboard/system-user');
                } catch (err) {
                    showNotification(err.response?.data?.message || 'Cannot delete user', 'error');
                } finally {
                    setDeletingUser(false);
                }
            },
            closeConfirm
        );
    };

    const InfoRow = ({ label, value }) => (
        <Box sx={infoRowSx}>
            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
            <Typography sx={valueTextSx}>{value || '-'}</Typography>
        </Box>
    );

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

            {isSystemScope && (
                <>
                    <Typography sx={{ mb: 2, mt: 3 }} variant="h6">
                        <strong>Actions</strong>
                    </Typography>

                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                        <Button
                            variant="outlined"
                            color={user.is_active ? 'warning' : 'success'}
                            onClick={handleToggleStatus}
                            disabled={updatingStatus || deletingUser}
                        >
                            {user.is_active ? 'Lock account' : 'Unlock account'}
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteUser}
                            disabled={deletingUser || updatingStatus}
                        >
                            {deletingUser ? 'Deleting...' : 'Delete user'}
                        </Button>
                    </Stack>
                </>
            )}

            <Typography sx={{ mb: 2 }} variant="h6">
                <strong>Profile</strong>
            </Typography>

            <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}>
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Employee Code" value={user.detail?.employee_code} />
                <InfoRow label="Organization" value={user.detail?.organization?.name} />
                <InfoRow label="Department" value={user.detail?.department?.name} />
                <InfoRow label="Title" value={user.detail?.department_title?.name} />
                <InfoRow label="Github" value={user.detail?.github} />
                <InfoRow label="Website" value={user.detail?.website} />
                <InfoRow label="Phone" value={user.detail?.phone} />
                <InfoRow label="Address" value={user.detail?.address} />
                <InfoRow label="City" value={user.detail?.city} />
                <InfoRow label="Join Date" value={user.detail?.join_date} />
                <InfoRow label="Hired At" value={user.detail?.hired_at} />
            </Stack>

            <Typography sx={{ mb: 2, mt: 3 }} variant="h6">
                <strong>Leave Balance</strong>
            </Typography>
            {leaveBalance ? (
                <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}>
                    <InfoRow label="As Of" value={leaveBalance.as_of_date} />
                    <InfoRow label="Total Available" value={leaveBalance.available_total ?? '-'} />
                    <InfoRow label="Current Remaining" value={leaveBalance.remaining_current_year ?? '-'} />
                    <InfoRow label="Prev Year Available" value={leaveBalance.available_previous_year ?? '-'} />
                    <InfoRow label="Prev Year Expired" value={leaveBalance.expired_previous_year ?? '-'} />
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
