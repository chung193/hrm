import axios from 'axios'
import { getItem } from "@utils/localStorage"

export const apiUrl = import.meta.env.VITE_APP_API_URL;
export const backendUrl = import.meta.env.VITE_APP_BACKEND_URL;
export const uploadUrl = import.meta.env.VITE_APP_BACKEND_UPLOAD_URL;
export const ORGANIZATION_SCOPE_STORAGE_KEY = 'organization_scope_id';

export const authInstance = axios.create({
    baseURL: apiUrl,
})

export const instance = axios.create({
    baseURL: apiUrl,
})

authInstance.interceptors.request.use(
    (config) => {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            user = null;
        }

        const token = user?.token;
        const token_type = (user?.token_type || 'Bearer').trim();
        if (token) {
            config.headers.Authorization = `${token_type} ${token}`
        }

        const url = String(config.url || '').replace(/^\//, '');
        const isAuthEndpoint = url.startsWith('auth/');
        const isOrganizationEndpoint = url === 'organization' || url.startsWith('organization/');

        const scopeId = Number(localStorage.getItem(ORGANIZATION_SCOPE_STORAGE_KEY) || 0);
        if (!isAuthEndpoint && !isOrganizationEndpoint && scopeId > 0) {
            config.params = config.params || {};
            if (config.params.organization_id === undefined || config.params.organization_id === null || config.params.organization_id === '') {
                config.params.organization_id = scopeId;
            }

            const method = String(config.method || 'get').toLowerCase();
            if (['post', 'put', 'patch'].includes(method)) {
                if (config.data instanceof FormData) {
                    if (!config.data.has('organization_id')) {
                        config.data.append('organization_id', String(scopeId));
                    }
                } else if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
                    if (config.data.organization_id === undefined || config.data.organization_id === null || config.data.organization_id === '') {
                        config.data.organization_id = scopeId;
                    }
                }
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)
