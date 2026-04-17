import { Stack, IconButton, Badge, Menu, MenuItem, Typography, Avatar, Box, Link, CircularProgress } from '@mui/material';
import { NotificationsNone, AssignmentTurnedIn, Campaign, WorkHistory } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { green } from '@mui/material/colors';
import { useAuth } from '@providers/AuthProvider';
import { useGlobalContext } from '@providers/GlobalProvider';
import { subscribeToUserChannel } from '@services/echo';
import { ensureBrowserNotificationPermission, showBrowserNotification } from '@services/browserNotification';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '@pages/Dashboard/Notification/NotificationServices';

const iconByKind = {
    leave_request: <AssignmentTurnedIn />,
    recruitment_request: <WorkHistory />,
    asset_recall: <AssignmentTurnedIn />,
    announcement: <Campaign />,
};

const NotificationMenu = () => {
    const { user } = useAuth();
    const { setNotificationUnreadCount } = useGlobalContext();
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const initializedRef = useRef(false);
    const seenIdsRef = useRef(new Set());
    const navigate = useNavigate();

    const loadNotifications = async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        }

        try {
            const [listRes, unreadRes] = await Promise.all([
                getNotifications({ per_page: 6 }),
                getUnreadNotificationCount(),
            ]);

            const nextItems = listRes?.data?.data?.data || [];
            const nextUnread = unreadRes?.data?.data?.count || 0;
            const nextUnreadItems = nextItems.filter((item) => !item.is_read);

            if (!initializedRef.current) {
                initializedRef.current = true;
                seenIdsRef.current = new Set(nextUnreadItems.map((item) => item.id));
            } else {
                const previousIds = seenIdsRef.current;
                const freshItems = nextUnreadItems.filter((item) => !previousIds.has(item.id));

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().catch(() => null);
                }

                if (typeof document !== 'undefined' && document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    freshItems.forEach((item) => {
                        new Notification(item.title, {
                            body: item.message,
                        });
                    });
                }

                seenIdsRef.current = new Set(nextUnreadItems.map((item) => item.id));
            }

            setItems(nextItems);
            setUnreadCount(nextUnread);
            setNotificationUnreadCount(nextUnread);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const timer = window.setInterval(() => loadNotifications({ silent: true }), 30000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        ensureBrowserNotificationPermission().catch(() => null);
    }, []);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        return subscribeToUserChannel(user.id, {
            onNotification: (payload) => {
                setItems((prev) => {
                    const nextItems = [payload, ...prev.filter((item) => item.id !== payload.id)];
                    return nextItems.slice(0, 6);
                });
                setUnreadCount((prev) => {
                    const nextUnread = prev + 1;
                    setNotificationUnreadCount(nextUnread);
                    return nextUnread;
                });

                if (typeof document !== 'undefined' && document.hidden) {
                    showBrowserNotification({
                        title: payload.title,
                        body: payload.message,
                    }).catch(() => null);
                }
            },
        });
    }, [setNotificationUnreadCount, user?.id]);

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleOpenItem = async (item) => {
        if (!item.is_read) {
            await markNotificationRead(item.id).catch(() => null);
        }

        await loadNotifications({ silent: true });
        handleCloseNavMenu();

        if (item.action_url) {
            navigate(item.action_url);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsRead().catch(() => null);
        setNotificationUnreadCount(0);
        await loadNotifications({ silent: true });
    };

    return (
        <>
            <IconButton onClick={handleOpenNavMenu} sx={{ p: 0, color: 'text.primary' }}>
                <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: '20px' } }}>
                    <NotificationsNone />
                </Badge>
            </IconButton>

            <Menu
                sx={{
                    '& .MuiMenu-paper': {
                        mt: 1,
                        minWidth: '360px',
                        boxShadow: '0 5px 25px rgba(0, 0, 0, 0.1)',
                        borderRadius: 1.5
                    }
                }}
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Notifications</Typography>
                    <Typography variant="caption" onClick={handleMarkAllAsRead} sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Mark all as read</Typography>
                </Box>

                {loading ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : items.map((notification) => (
                    <MenuItem key={notification.id} onClick={() => handleOpenItem(notification)} sx={{ py: 1.5, px: 2, '&:hover': { backgroundColor: 'action.hover' }, bgcolor: notification.is_read ? 'transparent' : 'action.hover' }}>
                        <Stack direction={'row'} spacing={2} sx={{ width: '100%' }}>
                            <Avatar sx={{ bgcolor: green[500], width: 40, height: 40, flexShrink: 0 }}>
                                {iconByKind[notification.kind] || <NotificationsNone />}
                            </Avatar>
                            <Stack sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{notification.title}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{notification.message}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                    {new Date(notification.created_at).toLocaleString('vi-VN')}
                                </Typography>
                            </Stack>
                        </Stack>
                    </MenuItem>
                ))}

                {!loading && !items.length && (
                    <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Chua co thong bao nao.</Typography>
                    </Box>
                )}

                <Box sx={{ p: 1.5, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Link
                        component="button"
                        onClick={() => {
                            handleCloseNavMenu();
                            navigate('/dashboard/notifications');
                        }}
                        sx={{ fontSize: '0.875rem', fontWeight: 500, '&:hover': { textDecoration: 'none' } }}
                    >
                        View all notifications
                    </Link>
                </Box>
            </Menu>
        </>
    )
}

export default NotificationMenu
