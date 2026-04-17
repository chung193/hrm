import { authInstance } from '@services/axios';

export const getNotifications = async (params = {}) => {
    const response = await authInstance.get('notifications', { params });
    return response;
};

export const getUnreadNotificationCount = async () => {
    const response = await authInstance.get('notifications/unread-count');
    return response;
};

export const markNotificationRead = async (id) => {
    const response = await authInstance.patch(`notifications/${id}/read`);
    return response;
};

export const markAllNotificationsRead = async () => {
    const response = await authInstance.patch('notifications/read-all');
    return response;
};

export const broadcastNotification = async (data) => {
    const response = await authInstance.post('notifications/broadcast', data);
    return response;
};
