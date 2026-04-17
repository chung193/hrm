import { authInstance } from '@services/axios';

export const getAllSimple = async () => {
    const response = await authInstance.get('organization/all', { skipOrganizationScope: true });
    return response;
};
