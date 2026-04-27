// src/components/common/Alert.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react'; // for close icon (optional, install lucide-react if not already)

interface AlertProps {
    variant?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    children: ReactNode;
    onClose?: () => void;
    className?: string;
    dismissible?: boolean; // new prop to control close button visibility
}

const variants = {
    success: {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-400 dark:border-green-700',
        text: 'text-green-800 dark:text-green-200',
        icon: 'text-green-600 dark:text-green-400',
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-400 dark:border-red-700',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-400 dark:border-yellow-700',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-400 dark:border-blue-700',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'text-blue-600 dark:text-blue-400',
    },
} as const;

const icons = {
    success: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    ),
    error: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    ),
    warning: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    ),
    info: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    ),
} as const;

export default function Alert({
    variant = 'info',
    title,
    children,
    onClose,
    className = '',
    dismissible = true,
}: AlertProps) {
    const style = variants[variant];
    const icon = icons[variant];

    return (
        <div
            role="alert"
            className={cn(
                'relative rounded-lg border p-4 shadow-sm transition-all duration-200',
                style.bg,
                style.border,
                style.text,
                className
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn('mt-0.5 flex-shrink-0', style.icon)}>{icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className="text-base font-semibold mb-1">{title}</h3>
                    )}
                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        {children}
                    </div>
                </div>

                {/* Close button */}
                {onClose && dismissible && (
                    <button
                        type="button"
                        onClick={onClose}
                        className={cn(
                            'ml-3 rounded-full p-1.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
                            style.icon
                        )}
                        aria-label="Close alert"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}