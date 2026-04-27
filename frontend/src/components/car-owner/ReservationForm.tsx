// src/components/car-owner/ReservationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import EthiopianDatePicker from '@/components/common/EthiopianDatePicker';
import { useState } from 'react';

// Validation schema
const reservationSchema = z.object({
    garageId: z.string().min(1, 'Garage is required'),
    vehicleId: z.string().min(1, 'Please select a vehicle'),
    serviceType: z.string().min(1, 'Please select a service type'),
    serviceDescription: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine(
    (data) => {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return start < end;
    },
    {
        message: 'End time must be after start time',
        path: ['endTime'],
    }
).refine(
    (data) => {
        const start = new Date(data.startTime);
        const now = new Date();
        return start > now;
    },
    {
        message: 'Start time must be in the future',
        path: ['startTime'],
    }
);

type ReservationFormData = z.infer<typeof reservationSchema>;

// Common service types
const SERVICE_TYPES = [
    { value: 'Oil Change', label: 'Oil Change' },
    { value: 'Car Wash', label: 'Car Wash' },
    { value: 'Tire Service', label: 'Tire Service' },
    { value: 'Brake Service', label: 'Brake Service' },
    { value: 'Engine Repair', label: 'Engine Repair' },
    { value: 'Transmission Repair', label: 'Transmission Repair' },
    { value: 'Battery Service', label: 'Battery Service' },
    { value: 'AC Service', label: 'AC Service' },
    { value: 'General Inspection', label: 'General Inspection' },
    { value: 'Body Work', label: 'Body Work' },
    { value: 'Paint Service', label: 'Paint Service' },
    { value: 'Electrical Repair', label: 'Electrical Repair' },
    { value: 'Other', label: 'Other (Specify in description)' },
];

interface ReservationFormProps {
    garageId: string;
    garageName?: string;
    garageServices?: Array<{ name: string; price: number; description?: string }>;
    vehicles: Array<{
        _id: string;
        make?: string;
        model?: string;
        name?: string;
        plateNumber: string;
        type?: string;
    }>;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function ReservationForm({
    garageId,
    garageServices = [],
    vehicles,
    onSuccess,
    onClose,
}: ReservationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Build service options from garage's actual services
    const serviceOptions = garageServices.length > 0
        ? garageServices.map(s => ({ value: s.name, label: `${s.name} — ${s.price} ETB` }))
        : SERVICE_TYPES;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<ReservationFormData>({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            garageId,
            vehicleId: '',
            serviceType: '',
            serviceDescription: '',
            startTime: '',
            endTime: '',
            notes: '',
        },
    });

    const startTime = watch('startTime');
    const serviceType = watch('serviceType');

    // Auto-calculate end time when start time changes (handled by EthiopianDatePicker onChange)

    const onSubmit = async (data: ReservationFormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = {
                garageId: data.garageId,
                vehicleId: data.vehicleId,
                serviceType: data.serviceType,
                serviceDescription: data.serviceDescription?.trim() || undefined,
                startTime: new Date(data.startTime).toISOString(),
                endTime: new Date(data.endTime).toISOString(),
                notes: data.notes?.trim() || undefined,
            };

            await api.post('/reservations', payload);

            toast.success('Reservation created successfully!', {
                duration: 5000,
                position: 'top-right',
            });

            onSuccess?.();
            onClose?.();
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                'Failed to create reservation. Please try again.';
            toast.error(message, { duration: 6000 });
            console.error('Reservation error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Book Service Appointment
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Select your vehicle and preferred time slot
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* Hidden garage ID */}
                <input type="hidden" {...register('garageId')} />

                {/* Vehicle selection */}
                {vehicles.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                            No vehicles found
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Please add a vehicle in the "My Vehicles" page first before making a reservation.
                        </p>
                    </div>
                ) : (
                    <Select
                        label="Select Vehicle"
                        placeholder="Choose your vehicle"
                        {...register('vehicleId')}
                        error={errors.vehicleId?.message}
                        disabled={isSubmitting}
                        options={vehicles.map((v) => {
                            // Handle both make/model and name field
                            const vehicleName = v.make && v.model
                                ? `${v.make} ${v.model}`
                                : (v as any).name || 'Unknown Vehicle';
                            return {
                                value: v._id,
                                label: `${vehicleName} (${v.plateNumber})`,
                            };
                        })}
                    />
                )}

                {/* Service Type Selection */}
                <div>
                    <Select
                        label="Service Type"
                        placeholder="What service do you need?"
                        {...register('serviceType')}
                        error={errors.serviceType?.message}
                        disabled={isSubmitting}
                        options={serviceOptions}
                    />
                    {/* Show selected service price + sub-options */}
                    {serviceType && garageServices.length > 0 && (() => {
                        const svc = (garageServices as any[]).find((s: any) => s.name === serviceType);
                        if (!svc) return null;
                        return (
                            <div className="mt-2 space-y-2">
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                    <span className="text-sm text-emerald-700 font-medium">Base Price:</span>
                                    <span className="text-lg font-black text-emerald-700">{svc.price.toLocaleString()} ETB</span>
                                </div>
                                {/* Sub-options (e.g. oil types) */}
                                {svc.subOptions && svc.subOptions.length > 0 && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                            Select Variant (optional):
                                        </p>
                                        <div className="space-y-1.5">
                                            {svc.subOptions.map((opt: any, i: number) => (
                                                <label key={i} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="serviceVariant"
                                                            value={opt.name}
                                                            onChange={_e => {
                                                                // Append variant to service description
                                                                setValue('serviceDescription', `Variant: ${opt.name}`);
                                                            }}
                                                            className="text-blue-600"
                                                        />
                                                        <span className="text-sm text-slate-700 font-medium">{opt.name}</span>
                                                        {opt.description && <span className="text-xs text-slate-400">— {opt.description}</span>}
                                                    </div>
                                                    <span className="text-sm font-bold text-blue-600">{opt.price} ETB</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Service Description - shown when service type is selected */}
                {serviceType && (
                    <div className="space-y-1.5 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {serviceType === 'Other' ? 'Service Description (Required)' : 'Service Description (Optional)'}
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Describe the service you need in detail..."
                            {...register('serviceDescription')}
                            disabled={isSubmitting}
                            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                        />
                        {errors.serviceDescription && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.serviceDescription.message}</p>}
                    </div>
                )}

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EthiopianDatePicker
                        label="Start Time"
                        value={startTime}
                        min={new Date().toISOString().slice(0, 16)}
                        disabled={isSubmitting}
                        error={errors.startTime?.message}
                        onChange={(val) => {
                            setValue('startTime', val, { shouldValidate: true });
                            if (val) {
                                const end = new Date(new Date(val).getTime() + 2 * 60 * 60 * 1000);
                                setValue('endTime', end.toISOString().slice(0, 16), { shouldValidate: true });
                            }
                        }}
                    />
                    <EthiopianDatePicker
                        label="End Time"
                        value={watch('endTime')}
                        min={startTime || new Date().toISOString().slice(0, 16)}
                        disabled={isSubmitting || !startTime}
                        error={errors.endTime?.message}
                        onChange={(val) => setValue('endTime', val, { shouldValidate: true })}
                    />
                </div>

                {/* Notes */}
                <div className="space-y-1.5 w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes (optional)</label>
                    <textarea
                        rows={3}
                        placeholder="Any special requests or vehicle details..."
                        {...register('notes')}
                        disabled={isSubmitting}
                        className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                    />
                    {errors.notes && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notes.message}</p>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating reservation...' : 'Confirm Reservation'}
                    </Button>
                </div>
            </form>
        </div>
    );
}