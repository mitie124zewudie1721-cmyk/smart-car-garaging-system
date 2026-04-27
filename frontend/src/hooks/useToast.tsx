// src/hooks/useToast.ts
import { toast, type ToastOptions } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    loading: <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />,
};

const defaultOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
        borderRadius: '10px',
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid #334155',
    },
};

export const useToast = () => {
    const success = (message: string, opts?: ToastOptions) =>
        toast.success(message, {
            ...defaultOptions,
            icon: icons.success,
            ...opts,
        });

    const error = (message: string, opts?: ToastOptions) =>
        toast.error(message, {
            ...defaultOptions,
            icon: icons.error,
            duration: 6000,
            ...opts,
        });

    const info = (message: string, opts?: ToastOptions) =>
        toast(message, {
            ...defaultOptions,
            icon: icons.info,
            ...opts,
        });

    const warning = (message: string, opts?: ToastOptions) =>
        toast(message, {
            ...defaultOptions,
            icon: icons.warning,
            ...opts,
        });

    const loading = (message: string, opts?: ToastOptions) =>
        toast.loading(message, {
            ...defaultOptions,
            icon: icons.loading,
            ...opts,
        });

    const promise = function <T>(
        promiseFn: Promise<T>,
        messages: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) },
        opts?: ToastOptions
    ) {
        return toast.promise(
            promiseFn,
            {
                loading: messages.loading,
                success: messages.success,
                error: messages.error,
            },
            {
                ...defaultOptions,
                ...opts,
            }
        );
    };

    const dismiss = (toastId?: string) => toast.dismiss(toastId);

    return {
        success,
        error,
        info,
        warning,
        loading,
        promise,
        dismiss,
    };
};