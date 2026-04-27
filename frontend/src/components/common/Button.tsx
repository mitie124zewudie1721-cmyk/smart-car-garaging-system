// src/components/common/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react'; // for spinner (install lucide-react if not already)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    asChild?: boolean; // for composition (Radix, etc.)
    children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            disabled,
            children,
            leftIcon,
            rightIcon,
            type = 'button', // default to button, overridable
            asChild = false,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
            'disabled:opacity-60 disabled:pointer-events-none',
            'ring-offset-white dark:ring-offset-slate-950',
            fullWidth && 'w-full',
            isLoading && 'cursor-wait',
            className
        );

        const variants = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm focus-visible:ring-indigo-500',
            secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 dark:active:bg-slate-500',
            outline: 'border border-slate-300 bg-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            ghost: 'bg-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-500',
            success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm focus-visible:ring-green-500',
            link: 'bg-transparent text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 p-0 focus-visible:ring-0',
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-11 px-6 text-base',
            icon: 'h-10 w-10 p-0',
        };

        // If asChild is true, we render children directly
        if (asChild) {
            return <>{children}</>;
        }

        return (
            <button
                ref={ref}
                type={type} // now overridable (submit, button, reset)
                className={cn(baseStyles, variants[variant], sizes[size])}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                aria-disabled={disabled || isLoading}
                {...props}
            >
                {leftIcon && !isLoading && <span className="flex-shrink-0">{leftIcon}</span>}

                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                    </div>
                ) : (
                    <>
                        {children}
                    </>
                )}

                {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;