// src/lib/api.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ── Sanitize output to prevent XSS from API responses ──
function sanitizeString(str: string): string {
    return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 30000,
});

// ── Request interceptor ──
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Basic JWT format validation before sending
            const parts = token.split('.');
            if (parts.length === 3) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // Malformed token — clear it
                localStorage.removeItem('token');
            }
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        // Add request timestamp for debugging
        (config as any).metadata = { startTime: Date.now() };
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor ──
let isRedirecting = false; // prevent multiple 401 redirects

api.interceptors.response.use(
    (response) => {
        // Sanitize string fields in response to prevent stored XSS
        if (response.data && typeof response.data === 'object') {
            const sanitize = (obj: any): any => {
                if (typeof obj === 'string') return sanitizeString(obj);
                if (Array.isArray(obj)) return obj.map(sanitize);
                if (obj && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
                    );
                }
                return obj;
            };
            response.data = sanitize(response.data);
        }
        return response;
    },

    (error) => {
        const status = error.response?.status;
        const rawMessage = error.response?.data?.message;
        let message = 'Something went wrong. Please try again.';

        if (status === 400) {
            message = typeof rawMessage === 'string' ? rawMessage : 'Bad request – check your input';
        } else if (status === 401) {
            if (!isRedirecting) {
                isRedirecting = true;
                message = 'Session expired. Please login again.';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Delay redirect to allow toast to show
                setTimeout(() => {
                    isRedirecting = false;
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }, 1500);
            }
            return Promise.reject(error);
        } else if (status === 403) {
            message = 'You do not have permission to do this.';
        } else if (status === 404) {
            message = typeof rawMessage === 'string' ? rawMessage : 'Resource not found.';
        } else if (status === 409) {
            message = typeof rawMessage === 'string' ? rawMessage : 'Conflict – resource already exists.';
        } else if (status === 429) {
            message = 'Too many requests. Please slow down and try again later.';
        } else if (status === 422) {
            message = typeof rawMessage === 'string' ? rawMessage : 'Validation failed.';
        } else if (status >= 500) {
            message = 'Server error – please try again later.';
        } else if (error.code === 'ECONNABORTED') {
            message = 'Request timed out – check your internet connection.';
        } else if (!error.response) {
            message = 'Network error – cannot reach the server.';
        } else if (typeof rawMessage === 'string') {
            message = rawMessage;
        } else if (error.response?.data?.errors?.length) {
            message = error.response.data.errors[0]?.message || message;
        }

        // Sanitize error message before showing
        const safeMessage = sanitizeString(message);

        toast.error(safeMessage, { duration: 5000, position: 'top-right' });

        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status,
            message: safeMessage,
            responseData: error.response?.data,
        });

        return Promise.reject(error);
    }
);

export default api;
