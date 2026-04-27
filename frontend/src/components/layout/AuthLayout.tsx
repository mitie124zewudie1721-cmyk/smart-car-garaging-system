// src/components/layout/AuthLayout.tsx
import { type ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-12">
            <div className="max-w-md w-full space-y-8">
                {/* Logo / App Name */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                        Smart Garaging
                    </h1>
                    <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Card with children (login/register form) */}
                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
                    {children}
                </div>

                {/* Footer / Links */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Smart Garaging System. All rights reserved.
                </p>
            </div>
        </div>
    );
}