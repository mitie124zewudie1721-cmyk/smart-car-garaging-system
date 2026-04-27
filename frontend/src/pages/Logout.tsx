// src/pages/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Loader from '@/components/common/Loader';

export default function Logout() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                // Optional: call backend logout endpoint if it exists
                // await api.post('/auth/logout');
            } catch {
                // Ignore backend logout errors (token may already be invalid)
            } finally {
                logout(); // clear store + localStorage
                navigate('/login', { replace: true });
            }
        };

        performLogout();
    }, [logout, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-center space-y-6">
                <Loader size="lg" />
                <h1 className="text-2xl font-bold text-white">Logging out...</h1>
                <p className="text-slate-400">Please wait a moment</p>
            </div>
        </div>
    );
}