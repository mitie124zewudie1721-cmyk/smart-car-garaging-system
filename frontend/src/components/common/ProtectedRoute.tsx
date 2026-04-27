// src/components/common/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Loader from './Loader';

interface Props {
    children?: React.ReactNode;
    roles?: ('admin' | 'garage_owner' | 'car_owner')[];
}

export default function ProtectedRoute({ children, roles }: Props) {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const location = useLocation();

    // Still verifying token with backend — show loader
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader size="lg" />
                    <p className="text-slate-400 text-sm">Verifying session...</p>
                </div>
            </div>
        );
    }

    // Not authenticated — redirect to login, remember where they wanted to go
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Wrong role — redirect to their own dashboard
    if (roles && user && !roles.includes(user.role as any)) {
        const dashMap: Record<string, string> = {
            admin: '/admin/system-overview',
            garage_owner: '/my-garages',
            car_owner: '/dashboard',
        };
        return <Navigate to={dashMap[user.role] || '/dashboard'} replace />;
    }

    return <>{children ?? <Outlet />}</>;
}
