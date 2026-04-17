import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('leave-request', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('leave-request', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`leave-request/${id}`, data);
    return response;
};

export const approve = async (id) => {
    const response = await authInstance.patch(`leave-request/${id}/approve`);
    return response;
};

export const reject = async (id, rejection_reason) => {
    const response = await authInstance.patch(`leave-request/${id}/reject`, { rejection_reason });
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('leave-requests', { data: { ids } });
    return response;
};

export const getCalendar = async (month) => {
    const response = await authInstance.get('leave-request/calendar', {
        params: { month },
    });
    return response;
};

export const getLeaveBalance = async (month, userId = null) => {
    const params = {};
    if (month) {
        params.month = month;
    }
    if (userId) {
        params.user_id = userId;
    }

    const response = await authInstance.get('leave-request/balance', { params });
    return response;
};
