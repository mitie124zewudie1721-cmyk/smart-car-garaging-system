// src/pages/GarageOwner/EditGarage.tsx
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import GarageForm from '@/components/garage-owner/GarageForm';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';

export default function EditGarage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingNotice, setPendingNotice] = useState<string | null>(null);

    useEffect(() => {
        const fetchGarage = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await api.get(`/garages/${id}`);
                const garage = response.data.data;

                // if garage is pending after a previous edit, show notice
                if (garage.verificationStatus === 'pending') {
                    setPendingNotice('This garage is pending admin approval. Changes will become active once approved.');
                }

                // Transform garage data to match form structure
                const formData = {
                    name: garage.name,
                    address: garage.location?.address || '',
                    latitude: garage.location?.coordinates?.[1] || 0,
                    longitude: garage.location?.coordinates?.[0] || 0,
                    capacity: garage.capacity,
                    pricePerHour: garage.pricePerHour,
                    description: garage.description || '',
                    amenities: garage.amenities || [],
                    contactPhone: garage.contact?.phone || '',
                    contactEmail: garage.contact?.email || '',
                    services: garage.services || [],
                    operatingHours: garage.operatingHours || { start: '08:00', end: '18:00' },
                    paymentMethods: garage.paymentMethods || [],
                    commissionRate: garage.commissionRate != null ? garage.commissionRate : undefined,
                    depositPercent: garage.depositPercent ?? 30,
                    cbeAccountNumber: garage.bankAccounts?.cbe?.accountNumber || '',
                    cbeAccountName: garage.bankAccounts?.cbe?.accountName || '',
                    cbeBranch: garage.bankAccounts?.cbe?.branch || '',
                    abyssiniaAccountNumber: garage.bankAccounts?.abyssinia?.accountNumber || '',
                    abyssiniaAccountName: garage.bankAccounts?.abyssinia?.accountName || '',
                    abyssiniaBranch: garage.bankAccounts?.abyssinia?.branch || '',
                    telebirrPhone: garage.bankAccounts?.telebirr?.phoneNumber || '',
                    telebirrAccountNumber: garage.bankAccounts?.telebirr?.accountNumber || '',
                    telebirrAccountName: garage.bankAccounts?.telebirr?.accountName || '',
                };

                setInitialData(formData);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load garage details');
                toast.error('Could not fetch garage');
            } finally {
                setLoading(false);
            }
        };

        fetchGarage();
    }, [id]);

    const handleSuccess = () => {
        navigate('/my-garages');
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !initialData) {
        return (
            <div className="p-6 md:p-8">
                <Alert variant="error">{error || 'Garage not found'}</Alert>
            </div>
        );
    }

    // show pending banner if we have one
    const pendingBanner = pendingNotice ? (
        <Alert variant="warning" className="mb-4">
            {pendingNotice}
        </Alert>
    ) : null;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                {pendingBanner}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('garageForm.editGarageTitle', { name: initialData.name })}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {t('garageForm.editGarageSubtitle')}
                </p>

                <GarageForm
                    initialData={initialData}
                    onSuccess={handleSuccess}
                    isEdit={true}
                    garageId={id}
                />
            </div>
        </div>
    );
}