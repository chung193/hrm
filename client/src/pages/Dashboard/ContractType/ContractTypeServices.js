import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('contract-type', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('contract-type/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('contract-type', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`contract-type/${id}`, data);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('contract-types', { data: { ids } });
    return response;
};

