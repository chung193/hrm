import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('organization', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('organization/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('organization', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`organization/${id}`, data);
    return response;
};

export const destroy = async (id) => {
    const response = await authInstance.delete(`organization/${id}`);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('organizations', { data: { ids } });
    return response;
};
