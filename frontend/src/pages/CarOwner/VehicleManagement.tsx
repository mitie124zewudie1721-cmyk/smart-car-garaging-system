// src/pages/CarOwner/VehicleManagement.tsx
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useForm } from 'react-hook-form';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Car } from 'lucide-react';

type ApiErr = { response?: { data?: { message?: string } } };

interface Vehicle {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
    year?: number;
    type: string;
    sizeCategory: string;
    color?: string;
    image?: { url?: string };
    updatedAt?: string;
}

interface Reservation {
    _id: string;
    status: 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed';
    totalPrice: number;
    serviceType?: string;
    serviceDescription?: string;
    startTime: string;
    endTime: string;
    garage: { name: string };
}

interface VehicleWithReservations extends Vehicle {
    reservations?: Reservation[];
}

interface VehicleFormData {
    plateNumber: string; make: string; model: string;
    year?: number; type: string; customType?: string;
    sizeCategory: string; color?: string;
}

const STATUS_CFG = {
    pending: { label: 'reservation.status.pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
    confirmed: { label: 'reservation.status.confirmed', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    active: { label: 'reservation.status.active', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
    completed: { label: 'reservation.status.completed', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
    cancelled: { label: 'reservation.status.cancelled', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
};

const VEHICLE_TYPES = [
    { value: 'sedan', label: 'Sedan' }, { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' }, { value: 'pickup', label: 'Pickup' },
    { value: 'van', label: 'Van' }, { value: 'truck', label: 'Truck' },
    { value: 'other', label: 'Other (Custom)' },
];
const SIZE_OPTS = [
    { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }, { value: 'extra_large', label: 'Extra Large' },
];

export default function VehicleManagement() {
    const [vehicles, setVehicles] = useState<VehicleWithReservations[]>([]);
    const { t } = useTranslation();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomType, setShowCustomType] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
        defaultValues: { plateNumber: '', make: '', model: '', year: undefined, type: 'sedan', customType: '', sizeCategory: 'medium', color: '' },
    });

    const selectedType = watch('type');
    useEffect(() => {
        if (selectedType === 'other') { setShowCustomType(true); }
        else { setShowCustomType(false); setValue('customType', ''); }
    }, [selectedType, setValue]);

    const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const toAbsUrl = (url?: string) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url;
        return `${backendBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const handleImageChange = (file: File | null) => {
        setSelectedImageFile(file);
        setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const [vRes, rRes] = await Promise.all([api.get('/vehicles/my'), api.get('/reservations/my')]);
            const resData: Reservation[] = rRes.data.data || [];
            setReservations(resData);
            setVehicles((vRes.data.data || []).map((v: Vehicle) => ({
                ...v,
                reservations: resData.filter((r: any) => r.vehicle && (r.vehicle._id || r.vehicle) === v._id),
            })));
        } catch (err: unknown) {
            const msg = (err as ApiErr).response?.data?.message || 'Failed to load vehicles';
            setError(msg); toast.error(msg);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data: VehicleFormData) => {
        setIsSubmitting(true);
        try {
            const vehicleType = data.type === 'other' ? data.customType : data.type;
            if (data.type === 'other' && !data.customType?.trim()) {
                toast.error('Please enter a custom vehicle type'); setIsSubmitting(false); return;
            }
            const payload = { plateNumber: data.plateNumber, make: data.make, model: data.model, year: data.year ? Number(data.year) : undefined, type: vehicleType, sizeCategory: data.sizeCategory, color: data.color };

            if (editingVehicle) {
                await api.put(`/vehicles/${editingVehicle._id}`, payload);
                if (selectedImageFile) {
                    const fd = new FormData(); fd.append('image', selectedImageFile);
                    await api.post(`/vehicles/${editingVehicle._id}/image`, fd);
                }
                toast.success('Vehicle updated!'); setShowEditModal(false); setEditingVehicle(null);
            } else {
                const created = await api.post('/vehicles', payload);
                const id = created.data?.data?._id;
                if (id && selectedImageFile) {
                    const fd = new FormData(); fd.append('image', selectedImageFile);
                    await api.post(`/vehicles/${id}/image`, fd);
                }
                toast.success('Vehicle added!'); setShowAddModal(false);
            }
            reset({ plateNumber: '', make: '', model: '', year: undefined, type: 'sedan', customType: '', sizeCategory: 'medium', color: '' });
            setShowCustomType(false); handleImageChange(null); fetchData();
        } catch (err: unknown) {
            toast.error((err as ApiErr).response?.data?.message || `Failed to ${editingVehicle ? 'update' : 'add'} vehicle`);
        } finally { setIsSubmitting(false); }
    };

    const handleCloseModal = () => {
        setShowAddModal(false); setShowEditModal(false); setEditingVehicle(null);
        setShowCustomType(false); handleImageChange(null);
        reset({ plateNumber: '', make: '', model: '', year: undefined, type: 'sedan', customType: '', sizeCategory: 'medium', color: '' });
    };

    const handleEdit = (v: Vehicle) => {
        setEditingVehicle(v);
        const predefined = ['sedan', 'suv', 'hatchback', 'pickup', 'van', 'truck'];
        const isCustom = !predefined.includes(v.type.toLowerCase());
        setValue('plateNumber', v.plateNumber); setValue('make', v.make); setValue('model', v.model);
        setValue('year', v.year); setValue('sizeCategory', v.sizeCategory); setValue('color', v.color || '');
        if (isCustom) { setValue('type', 'other'); setValue('customType', v.type); setShowCustomType(true); }
        else { setValue('type', v.type); setValue('customType', ''); setShowCustomType(false); }
        setSelectedImageFile(null); setImagePreviewUrl(toAbsUrl(v.image?.url));
        setShowEditModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this vehicle?')) return;
        try { await api.delete(`/vehicles/${id}`); toast.success('Deleted'); fetchData(); }
        catch (err: unknown) { toast.error((err as ApiErr).response?.data?.message || 'Failed to delete'); }
    };

    const stats = [
        { label: t('vehicle.totalBookings'), value: reservations.length, color: 'from-indigo-500 to-indigo-600', icon: '' },
        { label: t('reservation.status.pending'), value: reservations.filter(r => r.status === 'pending').length, color: 'from-amber-400 to-amber-500', icon: '' },
        { label: t('reservation.status.active'), value: reservations.filter(r => ['active', 'confirmed'].includes(r.status)).length, color: 'from-emerald-500 to-emerald-600', icon: '' },
        { label: t('reservation.status.completed'), value: reservations.filter(r => r.status === 'completed').length, color: 'from-sky-500 to-blue-600', icon: '' },
    ];

    const VehicleForm = ({ isEdit }: { isEdit: boolean }) => (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image upload */}
            <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Vehicle Image (optional)</label>
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border-2 border-dashed border-slate-300">
                        {imagePreviewUrl ? <img src={imagePreviewUrl} alt="preview" className="w-full h-full object-cover" /> : <Car size={28} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 space-y-2">
                        <input type="file" accept="image/*" disabled={isSubmitting}
                            onChange={e => handleImageChange(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
                        {imagePreviewUrl && (
                            <button type="button" onClick={() => handleImageChange(null)} className="text-xs text-red-500 hover:text-red-700">Remove image</button>
                        )}
                        <p className="text-xs text-slate-400">JPG, PNG, WEBP, AVIF, GIF, BMP — max 5MB</p>
                    </div>
                </div>
            </div>
            <Input label="Plate Number" placeholder="e.g., AA-12345" {...register('plateNumber', { required: 'Required' })} error={errors.plateNumber?.message} disabled={isSubmitting} />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Make" placeholder="e.g., Toyota" {...register('make', { required: 'Required' })} error={errors.make?.message} disabled={isSubmitting} />
                <Input label="Model" placeholder="e.g., Corolla" {...register('model', { required: 'Required' })} error={errors.model?.message} disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Year (optional)" type="number" placeholder="e.g., 2020" {...register('year')} disabled={isSubmitting} />
                <Input label="Color (optional)" placeholder="e.g., White" {...register('color')} disabled={isSubmitting} />
            </div>
            <Select label="Vehicle Type" {...register('type', { required: 'Required' })} error={errors.type?.message} disabled={isSubmitting} defaultValue="sedan" options={VEHICLE_TYPES} />
            {showCustomType && <Input label="Custom Type" placeholder="e.g., Motorcycle, Bus" {...register('customType')} disabled={isSubmitting} />}
            <Select label="Size Category" {...register('sizeCategory', { required: 'Required' })} error={errors.sizeCategory?.message} disabled={isSubmitting} defaultValue="medium" options={SIZE_OPTS} />
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-200 disabled:opacity-60 transition-all duration-200">
                    {isSubmitting ? t('vehicle.saving') : isEdit ? t('vehicle.updateVehicle') : t('vehicle.addVehicle')}
                </button>
            </div>
        </form>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center"><Loader size="lg" /><p className="mt-4 text-slate-500">Loading vehicles…</p></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 40%, #f5f3ff 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{t('vehicle.myVehicles')}</h1>
                        <p className="text-slate-500 mt-1">{t('vehicle.manageVehicles')}</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200">
                        <span className="text-lg">+</span> {t('vehicle.addVehicle')}
                    </button>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{s.icon}</span>
                                <span className="text-3xl font-bold">{s.value}</span>
                            </div>
                            <p className="text-white/80 text-sm font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">{error}</div>
                ) : vehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
                        <div className="text-6xl mb-4"></div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('vehicle.noVehicles')}</h3>
                        <p className="text-slate-500 mb-6">{t('vehicle.noVehiclesDesc')}</p>
                        <button onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
                            {t('vehicle.addFirstVehicle')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {vehicles.map(vehicle => {
                            const imgSrc = toAbsUrl(vehicle.image?.url) || DEFAULT_AVATAR;
                            const vReservations = vehicle.reservations || [];
                            const latest = vReservations[0];
                            const sCfg = latest ? (STATUS_CFG[latest.status] || STATUS_CFG.pending) : null;

                            return (
                                <div key={vehicle._id}
                                    className="bg-white rounded-2xl shadow-sm border border-indigo-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                                    <div className="p-6" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)' }}>
                                        {/* Vehicle Header */}
                                        <div className="flex flex-col sm:flex-row gap-5 mb-5">
                                            {/* Image */}
                                            <div className="w-full sm:w-40 h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                <img src={imgSrc === DEFAULT_AVATAR ? imgSrc : `${imgSrc}?t=${vehicle.updatedAt}`}
                                                    alt={`${vehicle.make} ${vehicle.model}`}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }} />
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-800">{vehicle.make} {vehicle.model}</h3>
                                                        <p className="text-slate-500 text-sm">{vehicle.plateNumber} • {vehicle.type}</p>
                                                    </div>
                                                    <span className="text-2xl"></span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {[
                                                        { label: t('vehicle.year'), value: vehicle.year || 'N/A', icon: '' },
                                                        { label: t('vehicle.color'), value: vehicle.color || 'N/A', icon: '' },
                                                        { label: t('vehicle.size'), value: vehicle.sizeCategory, icon: '' },
                                                        { label: t('vehicle.bookings'), value: vReservations.length, icon: '' },
                                                    ].map(d => (
                                                        <div key={d.label} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                                                            <p className="text-xs text-indigo-400 mb-0.5">{d.icon} {d.label}</p>
                                                            <p className="font-semibold text-slate-700 text-sm">{d.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Latest Reservation */}
                                        {latest && sCfg && (
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-semibold text-indigo-700">{t('vehicle.latestReservation')} — {latest.garage.name}</p>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sCfg.bg} ${sCfg.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`}></span>
                                                        {t(sCfg.label)}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {[
                                                        { label: t('vehicle.service'), value: latest.serviceType || 'General', icon: '' },
                                                        { label: t('vehicle.price'), value: `${latest.totalPrice.toLocaleString()} ETB`, icon: '' },
                                                        { label: t('vehicle.start'), value: `${new Date(latest.startTime).toLocaleDateString()} ${new Date(latest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, icon: '' },
                                                        { label: t('vehicle.end'), value: `${new Date(latest.endTime).toLocaleDateString()} ${new Date(latest.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, icon: '' },
                                                    ].map(d => (
                                                        <div key={d.label} className="bg-white/70 rounded-lg p-2.5">
                                                            <p className="text-xs text-slate-400 mb-0.5">{d.icon} {d.label}</p>
                                                            <p className="font-semibold text-slate-700 text-xs">{d.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {latest.serviceDescription && (
                                                    <div className="mt-3 bg-white/70 rounded-lg px-3 py-2 text-xs text-indigo-700">
                                                        {latest.serviceDescription}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-1">
                                            <button onClick={() => handleEdit(vehicle)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                {t('vehicle.editVehicle')}
                                            </button>
                                            <button onClick={() => handleDelete(vehicle._id)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                                {t('vehicle.deleteVehicle')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Add Modal ── */}
            <Modal isOpen={showAddModal} onClose={handleCloseModal} title={t('vehicle.addNewVehicle')} size="lg">
                <VehicleForm isEdit={false} />
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={showEditModal} onClose={handleCloseModal} title={t('vehicle.editVehicle')} size="lg">
                <VehicleForm isEdit={true} />
            </Modal>
        </div>
    );
}
