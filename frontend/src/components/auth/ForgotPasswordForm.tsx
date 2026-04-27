// src/components/auth/ForgotPasswordForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Link } from 'react-router-dom';

// Forgot password schema – username only
const forgotPasswordSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .trim()
        .refine((val) => !val.includes(' '), 'Username cannot contain spaces'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            username: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        if (isLoading) return; // prevent double submit

        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', {
                username: data.username.trim(),
            });

            toast.success(
                'Password reset link sent! Check your registered email.',
                { duration: 6000 }
            );

            reset(); // clear form after success
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Failed to send reset link. Username may not exist.';

            toast.error(message, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900/70 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
                Forgot Password
            </h2>
            <p className="text-slate-400 text-center text-sm mb-8">
                Enter your username to receive a reset link
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* Username field */}
                <Input
                    label="Username"
                    type="text"
                    autoComplete="username"
                    placeholder="demeku / yourusername"
                    {...register('username')}
                    error={errors.username?.message}
                    disabled={isLoading}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
                </Button>
            </form>

            {/* Back to login */}
            <div className="mt-8 text-center text-sm">
                <Link
                    to="/login"
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                    ← Back to login
                </Link>
            </div>
        </div>
    );
}