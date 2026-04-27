// src/hooks/useRole.ts
import { useAuthStore } from '@/store/authStore';

// Define roles as const union type (prevents typos)
export type UserRole = 'car_owner' | 'garage_owner' | 'admin';

export const useRole = () => {
    const { user, isLoading } = useAuthStore();

    // Early return during auth loading
    if (isLoading) {
        return {
            isCarOwner: false,
            isGarageOwner: false,
            isAdmin: false,
            hasRole: () => false,
            canAccess: () => false,
            isLoading: true,
        };
    }

    const role = user?.role as UserRole | undefined;

    const isCarOwner = role === 'car_owner';
    const isGarageOwner = role === 'garage_owner';
    const isAdmin = role === 'admin';

    // Check if user has exact role
    const hasRole = (required: UserRole) => role === required;

    // Check if user has permission for a feature (hierarchical)
    const canAccess = (required: UserRole | 'any') => {
        if (!role) return false;
        if (required === 'any') return true; // for public or unauthenticated routes
        if (required === 'admin') return isAdmin;
        if (required === 'garage_owner') return isGarageOwner || isAdmin;
        // car_owner level or higher
        return isCarOwner || isGarageOwner || isAdmin;
    };

    return {
        isCarOwner,
        isGarageOwner,
        isAdmin,
        hasRole,
        canAccess,
        isLoading: false,
        currentRole: role,
    };
};