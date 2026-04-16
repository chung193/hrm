import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('department', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('department/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('department', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`department/${id}`, data);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('departments', { data: { ids } });
    return response;
};
