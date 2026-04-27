// src/components/common/Input.tsx
import { type InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    showPasswordToggle?: boolean; // optional eye icon for password fields
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            fullWidth = true,
            id: providedId,
            disabled,
            type = 'text',
            showPasswordToggle = false,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = providedId || `input-${generatedId}`;

        const [showPassword, setShowPassword] = useState(false);

        const isPassword = type === 'password' && showPasswordToggle;

        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const describedBy = [
            error ? `${inputId}-error` : null,
            helperText ? `${inputId}-helper` : null,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative">
                    <input
                        id={inputId}
                        ref={ref}
                        type={inputType}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={describedBy || undefined}
                        className={cn(
                            // Base
                            'block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm',
                            'placeholder:text-slate-400 transition-all duration-200',
                            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
                            'dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500',
                            // Error state
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            // Disabled state
                            disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900',
                            // Password toggle padding
                            isPassword && 'pr-10',
                            className
                        )}
                        {...props}
                    />

                    {/* Password toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                {/* Helper text (shown even with error as secondary info) */}
                {helperText && (
                    <p id={`${inputId}-helper`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;