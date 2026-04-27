// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { ReactElement } from 'react';

interface ProtectedRouteProps {
    children: ReactElement;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}