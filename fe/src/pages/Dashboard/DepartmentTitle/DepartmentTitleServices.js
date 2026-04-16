import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('department-title', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('department-title/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('department-title', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`department-title/${id}`, data);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('department-titles', { data: { ids } });
    return response;
};
