// src/hooks/useSessionTimeout.ts
// Auto-logout after 30 minutes of inactivity
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 25 * 60 * 1000; // warn at 25 minutes

export function useSessionTimeout() {
    const { isAuthenticated, logout } = useAuthStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warnToastRef = useRef<string | null>(null);

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
        if (warnToastRef.current) toast.dismiss(warnToastRef.current);
    }, []);

    const resetTimer = useCallback(() => {
        if (!isAuthenticated) return;
        clearTimers();

        warnTimerRef.current = setTimeout(() => {
            warnToastRef.current = toast('⚠️ You will be logged out in 5 minutes due to inactivity.', {
                duration: 5 * 60 * 1000,
                icon: '⏰',
            });
        }, WARNING_MS);

        timerRef.current = setTimeout(() => {
            toast.dismiss();
            toast.error('Session expired due to inactivity.', { duration: 3000 });
            setTimeout(() => {
                logout();
                window.location.href = '/login';
            }, 1000);
        }, TIMEOUT_MS);
    }, [isAuthenticated, logout, clearTimers]);

    useEffect(() => {
        if (!isAuthenticated) { clearTimers(); return; }

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const handler = () => resetTimer();

        events.forEach(e => window.addEventListener(e, handler, { passive: true }));
        resetTimer();

        return () => {
            events.forEach(e => window.removeEventListener(e, handler));
            clearTimers();
        };
    }, [isAuthenticated, resetTimer, clearTimers]);
}
