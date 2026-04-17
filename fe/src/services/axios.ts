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

export const applyAuthToken = (user: { token?: string; token_type?: string } | null) => {
    const token = user?.token;
    const tokenType = (user?.token_type || 'Bearer').trim();

    if (token) {
        const value = `${tokenType} ${token}`;
        authInstance.defaults.headers.common.Authorization = value;
        authInstance.defaults.headers.Authorization = value;
        return;
    }

    delete authInstance.defaults.headers.common.Authorization;
    delete authInstance.defaults.headers.Authorization;
}

try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    applyAuthToken(storedUser);
} catch (error) {
    applyAuthToken(null);
}

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
            const value = `${token_type} ${token}`;
            if (config.headers && typeof config.headers.set === 'function') {
                config.headers.set('Authorization', value);
            } else {
                config.headers = {
                    ...(config.headers || {}),
                    Authorization: value,
                };
            }
        }

        const url = String(config.url || '').replace(/^\//, '');
        const isAuthEndpoint = url.startsWith('auth/');
        const skipOrganizationScope = Boolean((config as any).skipOrganizationScope);

        const scopeId = Number(localStorage.getItem(ORGANIZATION_SCOPE_STORAGE_KEY) || 0);
        if (!isAuthEndpoint && !skipOrganizationScope && scopeId > 0) {
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
