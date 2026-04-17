import { authInstance } from '@services/axios';

export const getSettings = async (organizationId = null) => {
    const response = await authInstance.get('recruitment-setting', {
        params: organizationId ? { organization_id: organizationId } : {},
    });
    return response;
};

export const updateSettings = async (data, organizationId = null) => {
    const payload = {
        ...data,
        ...(organizationId ? { organization_id: organizationId } : {}),
    };

    const response = await authInstance.put('recruitment-setting', payload);
    return response;
};
