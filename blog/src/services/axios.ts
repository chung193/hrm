import axios from 'axios'
import type { AxiosResponse } from 'axios'

export const apiUrl = import.meta.env.VITE_APP_API_URL;
export const backendUrl = import.meta.env.VITE_APP_BACKEND_URL;
export const uploadUrl = import.meta.env.VITE_APP_BACKEND_UPLOAD_URL;

export const authInstance = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const instance = axios.create({
    baseURL: apiUrl,
    headers: { 'Content-Type': 'application/json' }
})

type UserStorageShape = {
    token?: string;
    access_token?: string;
    token_type?: string;
    data?: { token?: string; access_token?: string; token_type?: string };
    user?: { token?: string; access_token?: string; token_type?: string };
}

const readHeader = (headers: unknown, key: string): string | undefined => {
    if (!headers) return undefined

    const direct = headers as Record<string, unknown>
    const directValue = direct[key] ?? direct[key.toLowerCase()] ?? direct[key.toUpperCase()]
    if (typeof directValue === 'string' && directValue.trim()) {
        return directValue.trim()
    }

    const maybeGet = headers as { get?: (name: string) => unknown }
    if (typeof maybeGet.get === 'function') {
        const value = maybeGet.get(key) ?? maybeGet.get(key.toLowerCase())
        if (typeof value === 'string' && value.trim()) {
            return value.trim()
        }
    }

    return undefined
}

const setAuthorizationHeader = (config: { headers?: unknown }, tokenType: string, token: string): void => {
    if (!config.headers) {
        config.headers = {}
    }

    const maybeSet = config.headers as { set?: (name: string, value: string) => void }
    if (typeof maybeSet.set === 'function') {
        maybeSet.set('Authorization', `${tokenType} ${token}`)
        return
    }

    ; (config.headers as Record<string, string>).Authorization = `${tokenType} ${token}`
}

const extractTokenFromAuthHeader = (authorization: string | undefined): { tokenType: string; token: string } | null => {
    if (!authorization) return null

    const [rawType, ...rest] = authorization.split(' ')
    const token = rest.join(' ').trim()
    const tokenType = (rawType || 'Bearer').trim()
    if (!token) return null

    return { tokenType, token }
}

const persistTokenFromHeaders = (headers: unknown): void => {
    const authHeader = readHeader(headers, 'authorization')
    const parsedAuth = extractTokenFromAuthHeader(authHeader)

    const tokenFromCustomHeader =
        readHeader(headers, 'x-access-token') ||
        readHeader(headers, 'access-token') ||
        readHeader(headers, 'token')

    const tokenTypeFromHeader =
        readHeader(headers, 'x-token-type') ||
        readHeader(headers, 'token-type') ||
        parsedAuth?.tokenType ||
        'Bearer'

    const token = parsedAuth?.token || tokenFromCustomHeader
    if (!token) return

    const rawUser = localStorage.getItem('user')
    let user: UserStorageShape = {}
    if (rawUser) {
        try {
            user = JSON.parse(rawUser) as UserStorageShape
        } catch {
            user = {}
        }
    }

    const nextUser: UserStorageShape = {
        ...user,
        token,
        access_token: token,
        token_type: tokenTypeFromHeader
    }
    localStorage.setItem('user', JSON.stringify(nextUser))
}

authInstance.interceptors.request.use(
    (config) => {
        const rawUser = localStorage.getItem('user')
        if (!rawUser) {
            return config
        }

        let user: UserStorageShape | null = null
        try {
            user = JSON.parse(rawUser)
        } catch {
            return config
        }

        const token =
            user?.token ||
            user?.access_token ||
            user?.data?.token ||
            user?.data?.access_token ||
            user?.user?.token ||
            user?.user?.access_token
        const token_type =
            (user?.token_type || user?.data?.token_type || user?.user?.token_type || 'Bearer').trim()
        if (token) {
            setAuthorizationHeader(config, token_type, token)
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

const syncResponseHeaders = (response: AxiosResponse) => {
    persistTokenFromHeaders(response?.headers)
    return response
}

authInstance.interceptors.response.use(
    syncResponseHeaders,
    (error) => Promise.reject(error)
)

instance.interceptors.response.use(
    syncResponseHeaders,
    (error) => Promise.reject(error)
)
