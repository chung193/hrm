import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginApi, register as registerApi } from '@services/auth'
import { useGlobalContext } from './GlobalProvider';
import { applyAuthToken, instance } from "@services/axios";
import { ORGANIZATION_SCOPE_STORAGE_KEY } from '@services/axios';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const decodeJwtPayload = (token) => {
    try {
        const [, payload] = String(token || '').split('.');
        if (!payload) {
            return null;
        }

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
        return JSON.parse(window.atob(padded));
    } catch (error) {
        return null;
    }
};

export function AuthProvider({ children }) {
    const { showLoading, hideLoading, showNotification } = useGlobalContext();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    });

    const clearAuthState = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
        applyAuthToken(null);
    };

    const forgot = async (email = {}) => {
        const response = await instance.post(`auth/forgot`, { email })
        return response
    };

    const verifyEmail = async (url = '') => {
        const response = await instance.get(`${url}`)
        return response
    };

    const resetPassword = async (data = {}) => {
        const response = await instance.post(`auth/reset-password`, data)
        return response
    };

    const login = async (username, password) => {
        showLoading();
        clearAuthState();

        loginApi({ email: username, password })
            .then(res => {
                const token = res?.data?.data?.token;
                const tokenType = res?.data?.data?.token_type || 'Bearer';
                const userId = res?.data?.data?.user?.id;
                const userName = res?.data?.data?.user?.name;
                const payload = decodeJwtPayload(token);
                const tokenSubject = Number(payload?.sub || 0);

                if (!token || !userId) {
                    throw new Error('Login response is missing authentication token.');
                }

                if (tokenSubject > 0 && tokenSubject !== Number(userId)) {
                    throw new Error('Login token does not match the authenticated user.');
                }

                const u = {
                    id: userId,
                    name: userName,
                    token,
                    token_type: tokenType
                };
                setUser(u);
                localStorage.setItem('user', JSON.stringify(u));
                applyAuthToken(u);
                window.dispatchEvent(new Event('auth-user-changed'));
                window.location.replace(from);
                hideLoading();
            })
            .catch(err => {
                hideLoading();
                clearAuthState();
                showNotification(err?.response?.data?.message || err?.message || 'Login failed', 'error');
                console.log("error", err)
            })
    };

    const register = async ({ name, password, password_confirmation, email }) => {
        showLoading();
        registerApi({ name, password, password_confirmation, email })
            .then(res => {
                console.log(res)
                showNotification("Đăng ký thành công", "success");
                hideLoading();
            })
            .catch(err => {
                hideLoading();
                console.log("error", err)
            });
    };

    const logout = () => {
        clearAuthState();
        window.dispatchEvent(new Event('auth-user-changed'));
        navigate('/auth/login', { replace: true });
    };

    const value = useMemo(() => ({ user, login, register, logout, forgot, verifyEmail, resetPassword }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
