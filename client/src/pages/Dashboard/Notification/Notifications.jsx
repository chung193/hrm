import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import MainCard from '@components/MainCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@providers/AuthProvider';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getAllSimple as getUsersSimple } from '@pages/Dashboard/User/UserServices';
import { getAllSimple as getOrganizationsSimple } from '@pages/Dashboard/Organization/OrganizationServices';
import { ensureBrowserNotificationPermission, getBrowserNotificationPermission, isBrowserNotificationSupported } from '@services/browserNotification';
import { subscribeToUserChannel } from '@services/echo';
import {
    broadcastNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from './NotificationServices';

const initialBroadcastForm = {
    audience_type: 'organization',
    organization_id: '',
    user_ids: [],
    kind: 'announcement',
    title: '',
    message: '',
    action_url: '',
};

export default function Notifications() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification, organizationScope } = useGlobalContext();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [form, setForm] = useState(initialBroadcastForm);
    const [browserPermission, setBrowserPermission] = useState(getBrowserNotificationPermission());

    const roleNames = useMemo(
        () => (Array.isArray(organizationScope?.profile?.roles)
            ? organizationScope.profile.roles.map((role) => String(role?.name || '').toLowerCase())
            : []),
        [organizationScope?.profile?.roles]
    );
    const isAdmin = roleNames.some((name) => ['admin', 'super-admin', 'super admin'].includes(name));

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await getNotifications({ per_page: 50 });
            setItems(response?.data?.data?.data || []);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadBroadcastOptions = async () => {
        if (!isAdmin) return;

        try {
            const [userRes, orgRes] = await Promise.all([
                getUsersSimple(),
                getOrganizationsSimple(),
            ]);
            setUsers(userRes?.data?.data || []);
            setOrganizations(orgRes?.data?.data || []);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to load notification options', 'error');
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        return subscribeToUserChannel(user.id, {
            onNotification: (payload) => {
                setItems((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)]);
            },
        });
    }, [user?.id]);

    useEffect(() => {
        setBrowserPermission(getBrowserNotificationPermission());
    }, []);

    useEffect(() => {
        loadBroadcastOptions();
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin) return;

        setForm((prev) => ({
            ...prev,
            organization_id: prev.organization_id || organizationScope?.selectedOrganizationId || '',
        }));
    }, [isAdmin, organizationScope?.selectedOrganizationId]);

    const handleOpen = async (item) => {
        if (!item.is_read) {
            await markNotificationRead(item.id).catch(() => null);
            setItems((prev) => prev.map((current) => current.id === item.id ? { ...current, is_read: true } : current));
        }

        if (item.action_url) {
            navigate(item.action_url);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
            showNotification('Marked all notifications as read', 'success');
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to update notifications', 'error');
        }
    };

    const handleBroadcast = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            showNotification('Title and message are required', 'error');
            return;
        }

        if (form.audience_type === 'organization' && !form.organization_id) {
            showNotification('Please choose an organization', 'error');
            return;
        }

        if (form.audience_type === 'users' && form.user_ids.length === 0) {
            showNotification('Please choose at least one user', 'error');
            return;
        }

        setSending(true);
        try {
            await broadcastNotification({
                ...form,
                organization_id: form.organization_id || null,
                user_ids: form.user_ids,
                action_url: form.action_url || null,
            });
            setForm((prev) => ({
                ...initialBroadcastForm,
                audience_type: prev.audience_type,
                organization_id: organizationScope?.selectedOrganizationId || '',
            }));
            showNotification('Notification sent successfully', 'success');
            loadNotifications();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to broadcast notification', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleEnableBrowserNotifications = async () => {
        const permission = await ensureBrowserNotificationPermission();
        setBrowserPermission(permission);

        if (permission === 'granted') {
            showNotification('Browser notifications enabled', 'success');
            return;
        }

        if (permission === 'denied') {
            showNotification('Browser notifications are blocked in this browser', 'warning');
            return;
        }

        showNotification('Browser notifications are not available', 'warning');
    };

    return (
        <Stack spacing={2.5}>
            {isAdmin && (
                <MainCard>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Broadcast Notification</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Gui thong bao cho mot nhom nguoi dung, mot organization hoac toan he thong.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                select
                                fullWidth
                                label="Audience"
                                value={form.audience_type}
                                onChange={(event) => setForm((prev) => ({
                                    ...prev,
                                    audience_type: event.target.value,
                                    user_ids: [],
                                }))}
                            >
                                <MenuItem value="users">Users</MenuItem>
                                <MenuItem value="organization">Organization</MenuItem>
                                <MenuItem value="system">System</MenuItem>
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label="Kind"
                                value={form.kind}
                                onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}
                            >
                                <MenuItem value="announcement">Announcement</MenuItem>
                                <MenuItem value="leave_request">Leave</MenuItem>
                                <MenuItem value="recruitment_request">Recruitment</MenuItem>
                                <MenuItem value="asset_recall">Asset recall</MenuItem>
                            </TextField>
                        </Stack>

                        {form.audience_type === 'organization' && (
                            <TextField
                                select
                                fullWidth
                                label="Organization"
                                value={form.organization_id}
                                onChange={(event) => setForm((prev) => ({ ...prev, organization_id: event.target.value }))}
                            >
                                {organizations.map((organization) => (
                                    <MenuItem key={organization.id} value={organization.id}>
                                        {organization.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        {form.audience_type === 'users' && (
                            <Autocomplete
                                multiple
                                options={users}
                                value={users.filter((user) => form.user_ids.includes(Number(user.id)))}
                                onChange={(_, nextValue) => setForm((prev) => ({
                                    ...prev,
                                    user_ids: nextValue.map((user) => Number(user.id)),
                                }))}
                                getOptionLabel={(option) => option?.name || option?.email || ''}
                                renderInput={(params) => <TextField {...params} label="Users" placeholder="Choose users" />}
                            />
                        )}

                        <TextField
                            fullWidth
                            label="Title"
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        />
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Message"
                            value={form.message}
                            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                        />
                        <TextField
                            fullWidth
                            label="Action URL"
                            placeholder="/dashboard/leave-request"
                            value={form.action_url}
                            onChange={(event) => setForm((prev) => ({ ...prev, action_url: event.target.value }))}
                        />

                        <Stack direction="row" justifyContent="flex-end">
                            <Button variant="contained" onClick={handleBroadcast} disabled={sending}>
                                {sending ? 'Sending...' : 'Send notification'}
                            </Button>
                        </Stack>
                    </Stack>
                </MainCard>
            )}

            <MainCard>
                <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Notifications</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Theo doi cac cap nhat ve nghi phep, tuyen dung, tai san va thong bao he thong.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            {isBrowserNotificationSupported() && browserPermission !== 'granted' && (
                                <Button variant="contained" onClick={handleEnableBrowserNotifications}>
                                    Enable browser alerts
                                </Button>
                            )}
                            <Button variant="outlined" onClick={handleMarkAllRead}>
                                Mark all read
                            </Button>
                        </Stack>
                    </Stack>

                    <Divider />

                    {loading ? (
                        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {items.map((item) => (
                                <ListItemButton
                                    key={item.id}
                                    onClick={() => handleOpen(item)}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: item.is_read ? 'divider' : 'primary.light',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <ListItemText
                                        primary={(
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                                                <Typography sx={{ fontWeight: item.is_read ? 600 : 700 }}>
                                                    {item.title}
                                                </Typography>
                                                {!item.is_read && <Chip size="small" color="primary" label="New" />}
                                                {item.kind && <Chip size="small" variant="outlined" label={item.kind} />}
                                            </Stack>
                                        )}
                                        secondary={(
                                            <Stack spacing={0.75}>
                                                <Typography variant="body2" color="text.primary">
                                                    {item.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(item.created_at).toLocaleString('vi-VN')}
                                                </Typography>
                                            </Stack>
                                        )}
                                    />
                                </ListItemButton>
                            ))}
                            {!items.length && (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography color="text.secondary">Chua co thong bao nao.</Typography>
                                </Box>
                            )}
                        </List>
                    )}
                </Stack>
            </MainCard>
        </Stack>
    );
}
