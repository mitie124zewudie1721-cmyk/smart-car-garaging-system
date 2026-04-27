// src/components/garage-owner/GarageForm.tsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useState } from 'react';
import WorkingHoursEditor, { DEFAULT_SCHEDULE } from '@/components/garage-owner/WorkingHoursEditor';
import { useTranslation } from 'react-i18next';
type WeeklySchedule = Record<string, { open: boolean; start: string; end: string }>;

const garageSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    address: z.string().min(5, 'Address is required'),
    // Restricted to Jimma city bounds
    latitude: z.number()
        .min(7.55, 'Location must be within Jimma city')
        .max(7.80, 'Location must be within Jimma city'),
    longitude: z.number()
        .min(36.75, 'Location must be within Jimma city')
        .max(36.95, 'Location must be within Jimma city'),
    capacity: z.number().min(1, 'Capacity must be at least 1'),
    pricePerHour: z.number().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    description: z.string().max(1000, 'Description too long').optional(),

    // Commission / fee
    commissionRate: z.number().min(0, 'Rate cannot be negative').max(100, 'Rate must be ≤100').optional(),

    // Deposit
    depositPercent: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%').optional(),
    arrivalLimitMinutes: z.number().min(0).max(120).optional(),

    // Contact Information
    contactPhone: z.string().min(10, 'Phone number is required'),
    contactEmail: z.string().email('Invalid email address'),

    // Services
    services: z.array(z.object({
        name: z.string().min(1, 'Service name is required'),
        price: z.number().min(0, 'Price must be positive'),
        description: z.string().optional(),
        subOptions: z.array(z.object({
            name: z.string().min(1, 'Variant name required'),
            price: z.number().min(0, 'Price must be positive'),
            description: z.string().optional(),
        })).optional(),
    })).min(1, 'At least one service is required'),

    // Operating Hours (legacy fields optional — weekly schedule is primary)
    operatingHours: z.object({
        start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional().or(z.literal('')),
        end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional().or(z.literal('')),
    }).optional(),

    // Payment Methods
    paymentMethods: z.array(z.string()).optional(),

    // Bank Accounts (optional)
    cbeAccountNumber: z.string().optional(),
    cbeAccountName: z.string().optional(),
    cbeBranch: z.string().optional(),
    abyssiniaAccountNumber: z.string().optional(),
    abyssiniaAccountName: z.string().optional(),
    abyssiniaBranch: z.string().optional(),
    telebirrPhone: z.string().optional(),
    telebirrAccountNumber: z.string().optional(),
    telebirrAccountName: z.string().optional(),
});

type GarageFormData = z.infer<typeof garageSchema>;

interface GarageFormProps {
    initialData?: Partial<GarageFormData>;
    onSuccess?: () => void;
    isEdit?: boolean;
    garageId?: string;
}

export default function GarageForm({ initialData = {}, onSuccess, isEdit = false, garageId }: GarageFormProps) {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<GarageFormData>({
        resolver: zodResolver(garageSchema),
        defaultValues: {
            ...initialData,
            commissionRate: initialData.commissionRate != null ? initialData.commissionRate * 100 : undefined,
            depositPercent: (initialData as any)?.depositPercent ?? 30,
            arrivalLimitMinutes: (initialData as any)?.arrivalLimitMinutes ?? 15,
            services: initialData.services || [{ name: '', price: 0, description: '' }],
            paymentMethods: initialData.paymentMethods || [],
            operatingHours: undefined,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'services',
    });

    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
        (initialData as any)?.operatingHours?.weekly || DEFAULT_SCHEDULE
    );
    const [amenitiesState, setAmenitiesState] = useState<string[]>(
        (initialData as any)?.amenities || []
    );
    const [customInput, setCustomInput] = useState('');

    const addCustomAmenity = () => {
        const val = customInput.trim();
        if (!val || amenitiesState.includes(val)) return;
        setAmenitiesState(prev => { const next = [...prev, val]; setValue('amenities', next); return next; });
        setCustomInput('');
    };

    const removeAmenity = (value: string) => {
        setAmenitiesState(prev => { const next = prev.filter(a => a !== value); setValue('amenities', next); return next; });
    };
    const [licenseNumber, setLicenseNumber] = useState((initialData as any)?.licenseNumber || '');
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [licensePreview, setLicensePreview] = useState<string | null>(null);

    const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            toast.error('Only JPG and PNG images are accepted'); return;
        }
        if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
        setLicenseFile(file);
        setLicensePreview(URL.createObjectURL(file));
    };

    const onSubmit = async (data: GarageFormData) => {
        try {
            const garageData = {
                name: data.name,
                location: { type: 'Point', coordinates: [data.longitude, data.latitude], address: data.address },
                capacity: data.capacity,
                pricePerHour: data.pricePerHour ?? 0,
                amenities: data.amenities || [],
                description: data.description,
                contact: { phone: data.contactPhone, email: data.contactEmail },
                services: data.services,
                operatingHours: { weekly: weeklySchedule },
                paymentMethods: data.paymentMethods,
                commissionRate: data.commissionRate != null ? data.commissionRate / 100 : undefined,
                depositPercent: data.depositPercent ?? 30,
                arrivalLimitMinutes: data.arrivalLimitMinutes ?? 15,
                bankAccounts: {
                    cbe: { accountNumber: data.cbeAccountNumber || '', accountName: data.cbeAccountName || '', branch: data.cbeBranch || '' },
                    abyssinia: { accountNumber: data.abyssiniaAccountNumber || '', accountName: data.abyssiniaAccountName || '', branch: data.abyssiniaBranch || '' },
                    telebirr: { phoneNumber: data.telebirrPhone || '', accountNumber: data.telebirrAccountNumber || '', accountName: data.telebirrAccountName || '' },
                },
                licenseNumber: licenseNumber.trim() || undefined,
            };

            if (licenseFile) {
                // Use FormData when there's a file
                const fd = new FormData();
                fd.append('license', licenseFile);
                // Append all other fields as JSON string
                Object.entries(garageData).forEach(([k, v]) => {
                    if (v !== undefined) fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
                });
                if (isEdit && garageId) {
                    await api.put(`/garages/${garageId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                } else {
                    await api.post('/garages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
            } else {
                if (isEdit && garageId) {
                    await api.put(`/garages/${garageId}`, garageData);
                } else {
                    await api.post('/garages', garageData);
                }
            }

            toast.success(isEdit ? 'Garage updated successfully!' : 'Garage registered! Pending admin approval.');
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save garage');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('garageForm.basicInfo')}</h2>

                <div className="space-y-4">
                    <Input
                        label={t('garageForm.garageName')}
                        placeholder="e.g. CarGarage Hermata"
                        {...register('name')}
                        error={errors.name?.message}
                    />

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('garageForm.description')}
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Describe your garage services and facilities..."
                            {...register('description')}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
                        />
                        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
                    </div>
                </div>
            </div>

            {/* Section 2: Contact */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('garageForm.contactInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={t('garageForm.phoneNumber')}
                        placeholder="+251 911 234567"
                        {...register('contactPhone')}
                        error={errors.contactPhone?.message}
                    />
                    <Input
                        label={t('garageForm.emailAddress')}
                        type="email"
                        placeholder="garage@example.com"
                        {...register('contactEmail')}
                        error={errors.contactEmail?.message}
                    />
                </div>
            </div>

            {/* Section 3: Location Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('garageForm.locationDetails')}</h2>

                <div className="space-y-4">
                    <Input
                        label={t('garageForm.streetAddress')}
                        placeholder="e.g. Near Hermata Market, Main Road to Agaro"
                        {...register('address')}
                        error={errors.address?.message}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Latitude (Jimma area: 7.55 – 7.80)"
                            type="number"
                            step="any"
                            placeholder="e.g. 7.6769"
                            {...register('latitude', { valueAsNumber: true })}
                            error={errors.latitude?.message}
                        />
                        <Input
                            label="Longitude (Jimma area: 36.75 – 36.95)"
                            type="number"
                            step="any"
                            placeholder="e.g. 36.8344"
                            {...register('longitude', { valueAsNumber: true })}
                            error={errors.longitude?.message}
                        />
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm text-indigo-800 font-medium mb-1">Jimma City Only</p>
                        <p className="text-sm text-indigo-700">
                            This system operates within Jimma city. Open{' '}
                            <a href="https://maps.google.com/?q=Jimma,Ethiopia" target="_blank" rel="noreferrer"
                                className="underline font-semibold hover:text-indigo-900">
                                Google Maps → Jimma
                            </a>
                            , right-click your garage location and copy the coordinates.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 4: Services & Pricing */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('garageForm.servicesPricing')}</h2>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Service {index + 1}</h3>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    label={t('garageForm.serviceName')}
                                    placeholder="e.g. Car Wash, Oil Change, Engine Repair"
                                    {...register(`services.${index}.name`)}
                                    error={errors.services?.[index]?.name?.message}
                                />

                                <Input
                                    label={t('garageForm.price')}
                                    type="number"
                                    placeholder="e.g. 300"
                                    {...register(`services.${index}.price`, { valueAsNumber: true })}
                                    error={errors.services?.[index]?.price?.message}
                                />
                            </div>

                            <div className="mt-3">
                                <Input
                                    label={t('garageForm.descriptionOptional')}
                                    placeholder="Brief description of the service"
                                    {...register(`services.${index}.description`)}
                                />
                            </div>

                            {/* Sub-options (e.g. oil types for oil change) */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Service Variants / Sub-options
                                        <span className="text-slate-400 font-normal ml-1">(optional — e.g. oil types)</span>
                                    </label>
                                </div>
                                {/* Watch sub-options for this service */}
                                {(watch(`services.${index}.subOptions`) || []).map((_: any, si: number) => (
                                    <div key={si} className="flex gap-2 mb-2 items-start">
                                        <input
                                            {...register(`services.${index}.subOptions.${si}.name`)}
                                            placeholder="e.g. Synthetic Oil"
                                            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:text-white"
                                        />
                                        <input
                                            {...register(`services.${index}.subOptions.${si}.price`, { valueAsNumber: true })}
                                            type="number"
                                            placeholder="Price ETB"
                                            className="w-28 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-700 dark:text-white"
                                        />
                                        <button type="button"
                                            onClick={() => {
                                                const current = watch(`services.${index}.subOptions`) || [];
                                                setValue(`services.${index}.subOptions`, current.filter((_: any, i: number) => i !== si));
                                            }}
                                            className="text-red-400 hover:text-red-600 text-lg leading-none mt-2">✕</button>
                                    </div>
                                ))}
                                <button type="button"
                                    onClick={() => {
                                        const current = watch(`services.${index}.subOptions`) || [];
                                        setValue(`services.${index}.subOptions`, [...current, { name: '', price: 0 }]);
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-1">
                                    + Add variant
                                </button>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => append({ name: '', price: 0, description: '' })}
                    >
                        {t('garageForm.addAnotherService')}
                    </Button>

                    {errors.services && typeof errors.services.message === 'string' && (
                        <p className="text-sm text-red-600">{errors.services.message}</p>
                    )}
                </div>
            </div>

            {/* Section 5: Operating Hours & Capacity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('garageForm.operatingHours')}</h2>

                <div className="space-y-4">
                    {/* Weekly schedule */}
                    <WorkingHoursEditor value={weeklySchedule} onChange={setWeeklySchedule} />

                    <div className="pt-2 border-t border-slate-100">
                        <Input
                            label={t('garageForm.totalSlots')}
                            type="number"
                            placeholder="8"
                            {...register('capacity', { valueAsNumber: true })}
                            error={errors.capacity?.message}
                        />
                    </div>

                    {/* Deposit percent */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('garageForm.bookingDeposit')}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Car owners must pay this percentage upfront to confirm their booking. If they don't show up, you keep the deposit.
                        </p>
                        <div className="relative max-w-xs">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={5}
                                placeholder="30"
                                {...register('depositPercent', { valueAsNumber: true })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                        </div>
                        {errors.depositPercent && <p className="text-xs text-red-600 mt-1">{errors.depositPercent.message}</p>}
                        <p className="text-xs text-indigo-600 mt-1">
                            Default is 30%. Set to 0 to disable deposits.
                        </p>
                    </div>

                    {/* Arrival limit */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Arrival Grace Period (minutes)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            How long after the booking start time the customer can arrive before being marked as no-show. If they arrive late, their deposit is forfeited and they pay the full price.
                        </p>
                        <div className="relative max-w-xs">
                            <input
                                type="number"
                                min={0}
                                max={120}
                                step={5}
                                placeholder="15"
                                {...register('arrivalLimitMinutes', { valueAsNumber: true })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">min</span>
                        </div>
                        <p className="text-xs text-indigo-600 mt-1">Default is 15 minutes.</p>
                    </div>
                </div>
            </div>

            {/* Section 6: Amenities */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('garageForm.amenities')}</h2>
                <p className="text-sm text-gray-500 mb-4">Type your garage amenities and press Enter or click "+ Add".</p>

                {/* Added amenities as tags */}
                {amenitiesState.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {amenitiesState.map(a => (
                            <span key={a}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium shadow-sm">
                                <span className="text-xs">✓</span>
                                <span>{a}</span>
                                <button type="button" onClick={() => removeAmenity(a)}
                                    className="ml-1 w-4 h-4 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-xs leading-none transition">
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Custom input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                        placeholder="e.g. Covered, Secure, Car Washing, CCTV..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                    <button type="button" onClick={addCustomAmenity}
                        className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition whitespace-nowrap">
                        + Add
                    </button>
                </div>
            </div>

            {/* Section: License Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🪪 License Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            License Number <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={licenseNumber}
                            onChange={e => setLicenseNumber(e.target.value)}
                            placeholder="e.g. ETH-GAR-2024-001"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            License Image <span className="text-gray-400 font-normal">(JPG or PNG, max 5MB)</span>
                        </label>
                        <div className="flex items-start gap-4">
                            <label className="flex flex-col items-center justify-center w-40 h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition bg-slate-50">
                                <span className="text-2xl mb-1">📄</span>
                                <span className="text-xs text-indigo-600 font-medium">Click to upload</span>
                                <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleLicenseFileChange} />
                            </label>
                            {licensePreview && (
                                <div className="relative">
                                    <img src={licensePreview} alt="License preview" className="w-40 h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                    <button type="button" onClick={() => { setLicenseFile(null); setLicensePreview(null); }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition">
                                        ✕
                                    </button>
                                    <p className="text-xs text-slate-500 mt-1 text-center">{licenseFile?.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isSubmitting}>
                    {isEdit ? t('garageForm.updateGarage') : t('garageForm.saveGarage')}
                </Button>

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                    Your garage will be reviewed by an administrator before appearing in search results
                </p>
            </div>
        </form>
    );
}