// src/components/common/Select.tsx
import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
    fullWidth?: boolean;
    required?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            options,
            placeholder = 'Select option',
            fullWidth = true,
            required = false,
            id: providedId,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const selectId = providedId || `select-${generatedId}`;

        const describedBy = [
            error ? `${selectId}-error` : null,
            helperText ? `${selectId}-helper` : null,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                {/* Select field */}
                <select
                    id={selectId}
                    ref={ref}
                    disabled={disabled}
                    aria-invalid={!!error}
                    aria-describedby={describedBy || undefined}
                    required={required}
                    className={cn(
                        // Base
                        'block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition-all duration-200',
                        'bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500',
                        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
                        // Error state
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        // Disabled state
                        disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900',
                        className
                    )}
                    {...props}
                >
                    {!props.defaultValue && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Error message */}
                {error && (
                    <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                {/* Helper text */}
                {helperText && !error && (
                    <p id={`${selectId}-helper`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;