import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginApi, register as registerApi } from '@services/auth'
import { useGlobalContext } from './GlobalProvider';
import { instance } from "@services/axios";
import { ORGANIZATION_SCOPE_STORAGE_KEY } from '@services/axios';
import { disconnectEcho } from '@services/echo';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { showLoading, hideLoading, showNotification } = useGlobalContext();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    });

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

    const login = async (username, password, organizationId = null) => {
        showLoading();
        try {
            disconnectEcho();
            const payload = { email: username, password };
            if (organizationId) {
                payload.organization_id = Number(organizationId);
            }

            const res = await loginApi(payload);
            const authenticatedUser = {
                id: res.data.data.user.id,
                name: res.data.data.user.name,
                token: res.data.data.token,
                token_type: res.data.data.token_type
            };
            setUser(authenticatedUser);
            localStorage.setItem('user', JSON.stringify(authenticatedUser));
            if (organizationId) {
                localStorage.setItem(ORGANIZATION_SCOPE_STORAGE_KEY, String(Number(organizationId)));
            } else {
                localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
            }
            window.dispatchEvent(new Event('auth-user-changed'));
            navigate(from, { replace: true });
        } catch (err) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Đăng nhập thất bại';
            showNotification(message, 'error');
        } finally {
            hideLoading();
        }
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
        disconnectEcho();
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem(ORGANIZATION_SCOPE_STORAGE_KEY);
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
