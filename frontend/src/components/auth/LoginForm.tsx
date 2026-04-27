// src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

// Login schema – username + password only
const loginSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .trim()
        .refine((val) => !val.includes(' '), 'Username cannot contain spaces'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            // Extra trim (safety)
            const payload = {
                username: data.username.trim(),
                password: data.password.trim(),
            };

            console.log('Login payload sent:', payload); // DEBUG - remove later

            const response = await api.post('/auth/login', payload);

            const { token, user } = response.data;

            // Store in auth store
            login(token, user);

            // Optional: keep in localStorage if store doesn't persist
            localStorage.setItem('token', token);

            toast.success('Login successful!', { duration: 4000 });

            // Role-based redirect
            switch (user.role) {
                case 'admin':
                    navigate('/admin/system-overview');
                    break;
                case 'garage_owner':
                    navigate('/my-garages');
                    break;
                case 'car_owner':
                default:
                    navigate('/dashboard');
                    break;
            }
        } catch (err: any) {
            console.error('Login error:', err); // DEBUG - remove later

            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Login failed. Please check your username and password.';

            toast.error(message, { duration: 5000 });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900/70 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white text-center mb-2">
                Welcome Back
            </h2>
            <p className="text-slate-400 text-center text-sm mb-8">
                Sign in to continue
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* Username */}
                <Input
                    label="Username"
                    type="text"
                    autoComplete="username"
                    placeholder="demeku / yourusername"
                    {...register('username')}
                    error={errors.username?.message}
                    disabled={isSubmitting}
                />

                {/* Password with toggle */}
                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-slate-400 hover:text-slate-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={isSubmitting}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Forgot password & Remember me */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-400">
                        <input
                            type="checkbox"
                            className="accent-indigo-500 h-4 w-4"
                            disabled={isSubmitting}
                        />
                        Remember me
                    </label>
                    <a
                        href="/forgot-password"
                        className="font-medium text-indigo-400 hover:text-indigo-300 transition"
                    >
                        Forgot password?
                    </a>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            {/* Register link */}
            <div className="mt-8 text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <a
                    href="/register"
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                    Create one now
                </a>
            </div>
        </div>
    );
}