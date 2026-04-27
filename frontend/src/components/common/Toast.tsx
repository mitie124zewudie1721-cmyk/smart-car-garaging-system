// src/components/common/Toast.tsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: () => void;
}

const variants = {
    success: {
        bg: 'bg-green-600',
        border: 'border-green-700',
        icon: 'text-green-200',
    },
    error: {
        bg: 'bg-red-600',
        border: 'border-red-700',
        icon: 'text-red-200',
    },
    info: {
        bg: 'bg-blue-600',
        border: 'border-blue-700',
        icon: 'text-blue-200',
    },
    warning: {
        bg: 'bg-yellow-600',
        border: 'border-yellow-700',
        icon: 'text-yellow-200',
    },
};

export default function Toast({
    message,
    type = 'info',
    duration = 4000,
    onClose,
}: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const style = variants[type];

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={cn(
                'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-4 text-white shadow-xl border',
                style.bg,
                style.border,
                'animate-in fade-in slide-in-from-bottom-5 duration-300',
                'max-w-sm'
            )}
        >
            {/* Icon */}
            <div className={cn('flex-shrink-0', style.icon)}>
                {type === 'success' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
                {type === 'error' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                )}
                {type === 'warning' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                )}
                {type === 'info' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                )}
            </div>

            {/* Message */}
            <span className="font-medium flex-1">{message}</span>

            {/* Close button */}
            <button
                onClick={onClose}
                className="ml-2 rounded-full p-1 hover:bg-black/20 transition"
                aria-label="Close toast"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}