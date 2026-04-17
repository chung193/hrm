// GlobalProvider.js
import React, { createContext, useEffect, useState, useContext } from 'react'
import Notification from './partials/Notification'
import Loading from './partials/Loading'
import CustomModal from './partials/Modal'
import Drawer from './partials/Drawer'
import Confirm from './partials/Confirm'
import { authInstance, ORGANIZATION_SCOPE_STORAGE_KEY } from '@services/axios'
import { subscribeToOrganizationPresence, subscribeToUserChannel } from '@services/echo'
import { getChatConversations } from '@pages/Dashboard/ChatServices'

const GlobalContext = createContext()

export const useGlobalContext = () => {
    return useContext(GlobalContext)
}

const GlobalProvider = ({ children }) => {
    const [notificationState, setNotificationState] = useState({
        unreadCount: 0,
    });
    const [chatState, setChatState] = useState({
        directUnread: 0,
        groupUnread: 0,
        onlineUserIds: [],
    });
    const [organizationScope, setOrganizationScope] = useState({
        profile: null,
        organizations: [],
        selectedOrganizationId: null,
        canSwitchOrganization: false
    });

    const [confirm, setConfirm] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => { },
        onCancel: () => { }
    })
    const showConfirm = (title, content, onConfirm, onCancel) => {
        setConfirm({ open: true, title, content, onConfirm, onCancel });
    };
    const closeConfirm = () => {
        setConfirm({ open: false, title: '', content: '', onConfirm: () => { }, onCancel: () => { } });
    };

    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info',
    })
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalTitle, setModalTitle] = useState(null)
    const [modalContent, setModalContent] = useState(null)

    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity })
    }

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false })
    }

    const showLoading = () => setLoading(true)
    const hideLoading = () => setLoading(false)

    const openModal = (title, content) => {
        setModalTitle(title)
        setModalContent(content)
        setModalOpen(true)
    }
    const closeModal = () => {
        setModalTitle(null)
        setModalContent(null)
        setModalOpen(false)
    }

    const [drawerTitle, setDrawerTitle] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerContent, setDrawerContent] = useState(null);
    const [drawerCloseCallback, setDrawerCloseCallback] = useState(null);

    const openDrawer = ({ title, content, onCloseCallback = null }) => {
        setDrawerTitle(title);
        setDrawerContent(content);
        setDrawerOpen(true);
        setDrawerCloseCallback(() => {
            closeDrawer
            onCloseCallback
        });
    };

    const closeDrawer = () => {
        setDrawerTitle('');
        setDrawerContent(null);
        setDrawerOpen(false);
        if (drawerCloseCallback) drawerCloseCallback();
    };

    const loadOrganizationScope = async () => {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            user = null;
        }

        if (!user?.id || !user?.token) {
            setOrganizationScope({
                profile: null,
                organizations: [],
                selectedOrganizationId: null,
                canSwitchOrganization: false
            });
            localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
            return;
        }

        try {
            const profileRes = await authInstance.get(`user/${user.id}`);
            const profile = profileRes?.data?.data || null;
            const roleNames = Array.isArray(profile?.roles)
                ? profile.roles.map((role) => String(role?.name || '').toLowerCase())
                : [];
            const canSwitchOrganization = roleNames.some((name) =>
                ['admin', 'super-admin', 'super admin'].includes(name)
            );
            const ownOrganizationId = profile?.detail?.organization_id ? Number(profile.detail.organization_id) : null;

            let organizations = [];
            let selectedOrganizationId = ownOrganizationId;

            if (canSwitchOrganization) {
                const orgRes = await authInstance.get('organization/all', { skipOrganizationScope: true });
                organizations = orgRes?.data?.data || [];

                const storedScopeId = Number(localStorage.getItem(ORGANIZATION_SCOPE_STORAGE_KEY) || 0);
                const hasStored = storedScopeId > 0 && organizations.some((org) => Number(org.id) === storedScopeId);
                const hasOwn = ownOrganizationId && organizations.some((org) => Number(org.id) === Number(ownOrganizationId));

                if (hasStored) {
                    selectedOrganizationId = storedScopeId;
                } else if (hasOwn) {
                    selectedOrganizationId = Number(ownOrganizationId);
                } else {
                    selectedOrganizationId = organizations[0]?.id ? Number(organizations[0].id) : null;
                }
            }

            if (selectedOrganizationId) {
                localStorage.setItem(ORGANIZATION_SCOPE_STORAGE_KEY, String(selectedOrganizationId));
            } else {
                localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
            }

            setOrganizationScope({
                profile,
                organizations,
                selectedOrganizationId,
                canSwitchOrganization
            });
        } catch {
            setOrganizationScope({
                profile: null,
                organizations: [],
                selectedOrganizationId: null,
                canSwitchOrganization: false
            });
            localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
        }
    };

    const setOrganizationScopeId = (organizationId) => {
        const nextId = organizationId ? Number(organizationId) : null;
        if (nextId) {
            localStorage.setItem(ORGANIZATION_SCOPE_STORAGE_KEY, String(nextId));
        } else {
            localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
        }

        setOrganizationScope((prev) => ({
            ...prev,
            selectedOrganizationId: nextId
        }));
    };

    const setNotificationUnreadCount = (count) => {
        setNotificationState({
            unreadCount: Number(count || 0),
        });
    };

    const loadChatState = async () => {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            user = null;
        }

        if (!user?.id || !user?.token) {
            setChatState((prev) => ({ ...prev, directUnread: 0, groupUnread: 0 }));
            return;
        }

        try {
            const response = await getChatConversations();
            const items = Array.isArray(response?.data?.data) ? response.data.data : [];
            setChatState((prev) => ({
                ...prev,
                directUnread: items
                    .filter((item) => item.type === 'direct')
                    .reduce((sum, item) => sum + Number(item.unread_count || 0), 0),
                groupUnread: items
                    .filter((item) => item.type === 'group')
                    .reduce((sum, item) => sum + Number(item.unread_count || 0), 0),
            }));
        } catch {
            setChatState((prev) => ({ ...prev, directUnread: 0, groupUnread: 0 }));
        }
    };

    useEffect(() => {
        loadOrganizationScope();

        const onAuthChange = () => {
            loadOrganizationScope();
        };

        window.addEventListener('auth-user-changed', onAuthChange);
        return () => {
            window.removeEventListener('auth-user-changed', onAuthChange);
        };
    }, []);

    useEffect(() => {
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            currentUser = null;
        }

        if (!currentUser?.id || !currentUser?.token) {
            setChatState({
                directUnread: 0,
                groupUnread: 0,
                onlineUserIds: [],
            });
            return undefined;
        }

        loadChatState();

        const unsubscribeUser = subscribeToUserChannel(currentUser.id, {
            onConversationCreated: () => {
                loadChatState();
            },
            onMessageCreated: ({ message }) => {
                if (Number(message?.user_id) !== Number(currentUser.id)) {
                    loadChatState();
                }
            },
        });

        const organizationId = organizationScope?.selectedOrganizationId || organizationScope?.profile?.detail?.organization_id || null;
        const unsubscribePresence = subscribeToOrganizationPresence(organizationId, {
            onHere: (members) => {
                setChatState((prev) => ({
                    ...prev,
                    onlineUserIds: members.map((member) => Number(member.id)),
                }));
            },
            onJoining: (member) => {
                setChatState((prev) => ({
                    ...prev,
                    onlineUserIds: [...new Set([...prev.onlineUserIds, Number(member.id)])],
                }));
            },
            onLeaving: (member) => {
                setChatState((prev) => ({
                    ...prev,
                    onlineUserIds: prev.onlineUserIds.filter((id) => Number(id) !== Number(member.id)),
                }));
            },
        });

        return () => {
            unsubscribeUser?.();
            unsubscribePresence?.();
        };
    }, [organizationScope?.selectedOrganizationId, organizationScope?.profile?.detail?.organization_id]);

    return (
        <GlobalContext.Provider
            value={{
                showNotification,
                showLoading,
                hideLoading,
                openModal,
                closeModal,
                openDrawer,
                closeDrawer,
                showConfirm,
                closeConfirm,
                organizationScope,
                setOrganizationScopeId,
                reloadOrganizationScope: loadOrganizationScope,
                notificationState,
                setNotificationUnreadCount,
                chatState,
                reloadChatState: loadChatState,
            }}
        >
            {children}
            <Notification
                open={notification.open}
                handleClose={handleCloseNotification}
                message={notification.message}
                severity={notification.severity}
            />
            {loading && <Loading />}

            <CustomModal
                title={modalTitle}
                open={modalOpen}
                handleClose={closeModal}>
                {modalContent}
            </CustomModal>

            <Drawer
                drawerTitle={drawerTitle}
                drawerOpen={drawerOpen}
                drawerCloseCallback={drawerCloseCallback}
                closeDrawer={closeDrawer}
                drawerContent={drawerContent}
            />
            <Confirm
                title={confirm.title}
                content={confirm.content}
                open={confirm.open}
                closeConfirm={confirm.onCancel}
                onConfirm={confirm.onConfirm}
                onCancel={confirm.onCancel}
                onClose={closeConfirm}
            />
        </GlobalContext.Provider>
    )
}

export default GlobalProvider
