// src/components/common/LoadingSpinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    size = 'md',
    className,
    fullScreen = false,
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'h-6 w-6 border-2',
        md: 'h-10 w-10 border-4',
        lg: 'h-16 w-16 border-4',
    };

    const spinner = (
        <div
            className={cn(
                'animate-spin rounded-full border-t-transparent border-indigo-600',
                sizes[size],
                className
            )}
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}