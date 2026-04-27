// src/components/common/Card.tsx
import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils'; // assuming you have cn utility from shadcn/ui or similar

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    title?: string;
    description?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
    noPadding?: boolean;
    hoverable?: boolean;
    bordered?: boolean;
}

/**
 * Reusable Card component with variants for different use cases
 * Supports header, body, footer, hover effects, borders, etc.
 */
export function Card({
    children,
    className = '',
    title,
    description,
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    noPadding = false,
    hoverable = false,
    bordered = true,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                // Base styles
                'bg-white dark:bg-slate-800',
                'rounded-xl',
                'shadow-sm',
                bordered && 'border border-slate-200 dark:border-slate-700',
                hoverable && 'transition-all hover:scale-105 hover:shadow-lg',
                'overflow-hidden',
                className
            )}
            {...props}
        >
            {/* Header (optional) */}
            {(title || description) && (
                <div className={cn('px-6 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700', headerClassName)}>
                    {title && (
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* Body */}
            <div
                className={cn(
                    noPadding ? 'p-0' : 'p-6',
                    bodyClassName
                )}
            >
                {children}
            </div>

            {/* Footer (optional) — rendered only if footerClassName is explicitly provided */}
            {footerClassName && (
                <div
                    className={cn(
                        'px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50',
                        footerClassName
                    )}
                >
                    {/* Footer content goes here if needed */}
                </div>
            )}
        </div>
    );
}

// Optional: Simple variants as named exports
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700', className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50', className)}>
            {children}
        </div>
    );
}

// Default export (can be used as <Card> or imported named)
export default Card;