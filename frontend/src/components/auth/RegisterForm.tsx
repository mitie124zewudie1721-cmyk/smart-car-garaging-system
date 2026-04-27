// src/components/auth/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

// Register schema – NO EMAIL
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscore')
        .trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must match'),
    role: z.enum(['car_owner', 'garage_owner'] as const, {
        error: 'Please select your account type',
    }),
    phone: z
        .string()
        .regex(/^\+?\d{9,15}$/, 'Invalid phone number format (e.g. +251912345678)')
        .trim()
        .optional(),
    carType: z.string().trim().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            username: '',
            password: '',
            confirmPassword: '',
            role: 'car_owner',
            phone: '',
            carType: '',
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const response = await api.post('/auth/register', {
                name: data.name.trim(),
                username: data.username.trim(),
                password: data.password,
                role: data.role,
                phone: data.phone?.trim() || undefined,
                carType: data.carType?.trim() || undefined,
            });

            const { token, user } = response.data;

            login(token, user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success('Registration successful! Welcome aboard.', { duration: 5000 });

            // Role-based redirect after register (same as login)
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

            reset(); // clear form
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Registration failed. Username may already be taken.';
            toast.error(message, { duration: 5000 });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900/70 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white text-center mb-2">
                Create Account
            </h2>
            <p className="text-slate-400 text-center text-sm mb-8">
                Join Smart Garaging today
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* Full Name */}
                <Input
                    label="Full Name"
                    type="text"
                    autoComplete="name"
                    placeholder="Mitiku Zewudie"
                    {...register('name')}
                    error={errors.name?.message}
                    disabled={isSubmitting}
                />

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

                {/* Password */}
                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-slate-400 hover:text-slate-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <Input
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••••"
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-10 text-slate-400 hover:text-slate-300"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Phone Number (optional) */}
                <Input
                    label="Phone Number (optional)"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+251912345678"
                    {...register('phone')}
                    error={errors.phone?.message}
                    disabled={isSubmitting}
                />

                {/* Account Type */}
                <Select
                    label="Account Type"
                    {...register('role')}
                    error={errors.role?.message}
                    disabled={isSubmitting}
                    options={[
                        { value: 'car_owner', label: 'Car Owner – Find & Reserve Parking' },
                        { value: 'garage_owner', label: 'Garage Owner – Manage Parking Spaces' },
                    ]}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
            </form>

            {/* Sign in link */}
            <div className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <a
                    href="/login"
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                    Sign in
                </a>
            </div>
        </div>
    );
}