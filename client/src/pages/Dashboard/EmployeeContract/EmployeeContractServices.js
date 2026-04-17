import { authInstance } from '@services/axios';

export const getAll = async (params = {}) => {
    const response = await authInstance.get('employee-contract', {
        params: {
            sort: params.sort || '-created_at',
            ...params,
        },
    });

    return response;
};

export const getAllSimple = async () => {
    const response = await authInstance.get('employee-contract/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('employee-contract', data);
    return response;
};

export const update = async (id, data) => {
    const response = await authInstance.put(`employee-contract/${id}`, data);
    return response;
};

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('employee-contracts', { data: { ids } });
    return response;
};

