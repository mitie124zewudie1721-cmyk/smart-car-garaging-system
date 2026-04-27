// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface User {
    _id: string;
    name: string;
    username: string;
    role: 'car_owner' | 'garage_owner' | 'admin';
    phone?: string;
    carType?: string;
    profilePicture?: string;
    createdAt: string;
    lastLogin?: string;
    isActive?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (token: string, user: User) => void;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    checkAuth: () => Promise<boolean>;
    setError: (msg: string | null) => void;
}

const authStoreImpl = (set: any, get: any): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: (token, user) => {
        set({
            token,
            user,
            isAuthenticated: true,
            error: null,
            isLoading: false,
        });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // Mark this tab as actively authenticated
        sessionStorage.setItem('tabSessionActive', '1');
        // Toast is handled by the calling component (Login.tsx)
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await api.post('/auth/logout').catch(() => { }); // ignore failure
        } finally {
            set({
                token: null,
                user: null,
                isAuthenticated: false,
                error: null,
                isLoading: false,
            });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('tabSessionActive');
            // Toast is handled by the calling component
            window.location.href = '/login';
        }
    },

    refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) return false;

        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${currentToken}` },
            });

            const { token, user } = response.data;
            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            localStorage.setItem('token', token);
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Session expired. Please log in again.';
            set({ isLoading: false, error: message });
            await get().logout();
            toast.error(message);
            return false;
        }
    },

    checkAuth: async () => {
        const token = get().token || localStorage.getItem('token');
        if (!token) return false;

        set({ isLoading: true });
        try {
            const response = await api.get('/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const user = response.data.data || response.data.user || response.data;
            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            // Mark this tab as authenticated (page refresh in same tab)
            sessionStorage.setItem('tabSessionActive', '1');
            return true;
        } catch (err) {
            await get().logout();
            set({ isLoading: false });
            return false;
        }
    },

    setError: (msg) => set({ error: msg }),
});

export const useAuthStore = create<AuthState>()(
    persist(authStoreImpl, {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            token: state.token,
            // Do NOT persist isAuthenticated or user
            // They must be re-verified on every app load
        }),
    })
);

// Per-tab session enforcement using sessionStorage
// sessionStorage is cleared when tab is closed — new tab = must re-login
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const tabSessionActive = sessionStorage.getItem('tabSessionActive');

    if (!token) {
        // No token at all — not authenticated
        useAuthStore.setState({ isAuthenticated: false, user: null, isLoading: false });
    } else if (!tabSessionActive) {
        // Token exists but this is a NEW TAB (no sessionStorage flag)
        // Force re-authentication for this tab
        useAuthStore.setState({ isAuthenticated: false, user: null, isLoading: false });
        // Do NOT call checkAuth — user must manually log in
    } else {
        // Same tab that was already authenticated — verify token is still valid
        useAuthStore.setState({ isAuthenticated: false, user: null, isLoading: true });
        useAuthStore.getState().checkAuth();
    }
}