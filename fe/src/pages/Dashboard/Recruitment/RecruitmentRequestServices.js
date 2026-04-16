import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('recruitment-request', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('recruitment-request/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('recruitment-request', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`recruitment-request/${id}`, data);
    return response;
};

export const receive = async (id) => {
    const response = await authInstance.patch(`recruitment-request/${id}/receive`);
    return response;
};

export const updateStatus = async (id, data) => {
    const response = await authInstance.patch(`recruitment-request/${id}/status`, data);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('recruitment-requests', { data: { ids } });
    return response;
};

