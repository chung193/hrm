import { authInstance } from "@services/axios";
import apiService from "@services/common";

export const getAll = async (params = {}) => {
    const sortParam = params.sort || '-created_at';
    const response = await authInstance.get(`user`, {
        params: {
            sort: sortParam,
            ...params
        }
    })
    return response
};

export const getAllRole = async (params = {}) => {
    const response = await authInstance.get(`role`, { params })
    return response
};

export const show = async (id) => {
    const response = await authInstance.get(`user/${id}`)
    return response
};

export const getAllSimple = async () => {
    const response = await authInstance.get('users/all');
    return response;
};

export const storage = async (data) => {
    const response = await authInstance.post('user', data)
    return response
}

export const update = async (id, data) => {
    const response = await authInstance.put(`user/${id}`, data)
    return response
}

export const resetPassword = async (id, data) => {
    const response = await authInstance.patch(`user/${id}/password`, data);
    return response;
}

export const assignRoles = async (id, roleIds = []) => {
    const response = await authInstance.post(`user/${id}/role`, { role_ids: roleIds })
    return response
}

export const destroy = async (id) => {
    const response = await authInstance.delete(`user/${id}`)
    return response
}

export const bulkDestroy = async (ids) => {
    const response = await authInstance.delete('users', { data: { ids } })
    return response
}

// 'file' => 'required|file|max:10240', // file size
// 'model' => 'required|string', // User, Product, etc.
// 'id' => 'required', // id of model
// 'collection' => 'nullable|string', // attachments, avatar, gallery
export const uploadAvatar = async (data = {}) => {
    const response = await apiService.postWithMedia('/media/upload', data);
    return response;
}

export const userExport = async () => {
    const response = await authInstance.post(`/user-export`, {}, {
        headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob'
    })
    return response
}

export const getAllSystem = async (params = {}) => {
    const sortParam = params.sort || '-created_at';
    const response = await authInstance.get('admin-user', {
        skipOrganizationScope: true,
        params: {
            sort: sortParam,
            ...params,
        },
    });
    return response;
};

export const showSystem = async (id) => {
    const response = await authInstance.get(`admin-user/${id}`, { skipOrganizationScope: true });
    return response;
};

export const getAllSimpleSystem = async () => {
    const response = await authInstance.get('admin-users/all', { skipOrganizationScope: true });
    return response;
};

export const storageSystem = async (data) => {
    const response = await authInstance.post('admin-user', data, { skipOrganizationScope: true });
    return response;
};

export const updateSystem = async (id, data) => {
    const response = await authInstance.put(`admin-user/${id}`, data, { skipOrganizationScope: true });
    return response;
};

export const assignRolesSystem = async (id, roleIds = []) => {
    const response = await authInstance.post(`admin-user/${id}/role`, { role_ids: roleIds }, { skipOrganizationScope: true });
    return response;
};

export const resetPasswordSystem = async (id, data) => {
    const response = await authInstance.patch(`admin-user/${id}/password`, data, { skipOrganizationScope: true });
    return response;
};

export const destroySystem = async (id) => {
    const response = await authInstance.delete(`admin-user/${id}`, { skipOrganizationScope: true });
    return response;
};

export const bulkDestroySystem = async (ids) => {
    const response = await authInstance.delete('admin-users', { data: { ids }, skipOrganizationScope: true });
    return response;
};

export const userExportSystem = async () => {
    const response = await authInstance.post('/admin-user-export', {}, {
        skipOrganizationScope: true,
        headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
    });
    return response;
};
