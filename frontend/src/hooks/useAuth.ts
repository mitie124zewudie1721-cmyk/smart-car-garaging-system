// src/hooks/useAuth.ts
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterData {
    name: string;
    username: string;
    password: string;
    role: 'car_owner' | 'garage_owner';
    phone?: string;
    carType?: string;
}

export const useAuth = () => {
    const { user, token, isAuthenticated, login, logout, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const signIn = async (credentials: LoginCredentials) => {
        try {
            const response = await api.post('/auth/login', {
                username: credentials.username.trim(),
                password: credentials.password.trim(),
            });

            const { token, user } = response.data;

            login(token, user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success('Login successful!', { duration: 4000 });

            // Role-based redirect
            switch (user.role) {
                case 'admin':
                    navigate('/admin/system-overview', { replace: true });
                    break;
                case 'garage_owner':
                    navigate('/my-garages', { replace: true });
                    break;
                case 'car_owner':
                default:
                    navigate('/dashboard', { replace: true });
                    break;
            }

            return true;
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Login failed. Please check your username and password.';
            toast.error(message, { duration: 5000 });
            console.error('Login error:', err);
            throw err;
        }
    };

    const signUp = async (data: RegisterData) => {
        try {
            const response = await api.post('/auth/register', {
                name: data.name.trim(),
                username: data.username.trim(),
                password: data.password.trim(),
                role: data.role,
                phone: data.phone?.trim() || undefined,
                carType: data.carType?.trim() || undefined,
            });

            const { token, user } = response.data;

            login(token, user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success('Registration successful! Welcome aboard.', { duration: 5000 });

            // Same role-based redirect as login
            switch (user.role) {
                case 'admin':
                    navigate('/admin/system-overview', { replace: true });
                    break;
                case 'garage_owner':
                    navigate('/my-garages', { replace: true });
                    break;
                case 'car_owner':
                default:
                    navigate('/dashboard', { replace: true });
                    break;
            }

            return true;
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Registration failed. Username may already be taken.';
            toast.error(message, { duration: 5000 });
            console.error('Register error:', err);
            throw err;
        }
    };

    const signOut = async () => {
        try {
            // Optional: call logout endpoint if your backend invalidates tokens
            await api.post('/auth/logout');
        } catch {
            // Ignore logout endpoint errors (token already invalid or expired)
        } finally {
            logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.success('Logged out successfully', { duration: 3000 });
            navigate('/login', { replace: true });
        }
    };

    // Token refresh (call this on 401 errors or periodically)
    const refreshToken = async () => {
        try {
            const response = await api.post('/auth/refresh');
            const { token, user } = response.data;
            login(token, user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        } catch (err) {
            console.error('Token refresh failed:', err);
            signOut();
            return false;
        }
    };

    // Optional: interceptor for 401 → refresh token → retry (add to api.ts if needed)
    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshToken,
    };
};