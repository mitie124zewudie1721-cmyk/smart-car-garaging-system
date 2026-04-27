// src/pages/GarageOwner/MyGarages.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import GarageCard from '@/components/garage-owner/GarageCard';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import { useTranslation } from 'react-i18next';

interface Garage {
    _id: string;
    name: string;
    address: string;
    capacity: number;
    availableSlots: number;
    pricePerHour: number;
    rating: number;
    amenities: string[];
    images?: string[];
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    depositPercent?: number;
}

export default function MyGarages() {
    const [garages, setGarages] = useState<Garage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    const fetchGarages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/garages/my');
            setGarages(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load your garages');
            toast.error('Could not fetch garages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGarages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this garage? This cannot be undone.')) return;

        try {
            await api.delete(`/garages/${id}`);
            toast.success('Garage deleted successfully');
            fetchGarages();
        } catch (err) {
            toast.error('Failed to delete garage');
        }
    };

    const handleEdit = (id: string) => {
        // Navigate to edit page with ID
        window.location.href = `/edit-garage/${id}`;
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('myGarages.title')}
                </h1>
                <Link to="/add-garage">
                    <Button variant="primary" size="lg">
                        {t('myGarages.addNew')}
                    </Button>
                </Link>
            </div>

            {/* Pending Verification Notice */}
            {garages.some(g => g.verificationStatus === 'pending') && (
                <Alert variant="warning" className="mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="font-semibold mb-1">{t('myGarages.pendingNotice')}</p>
                            <p className="text-sm">
                                {t('myGarages.pendingDesc', { count: garages.filter(g => g.verificationStatus === 'pending').length })}
                            </p>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Rejected Garages Notice */}
            {garages.some(g => g.verificationStatus === 'rejected') && (
                <Alert variant="error" className="mb-6">
                    <div className="flex items-start gap-3">
                        <div>
                            <p className="font-semibold mb-1">{t('myGarages.rejectedNotice')}</p>
                            <p className="text-sm">
                                {t('myGarages.rejectedDesc', { count: garages.filter(g => g.verificationStatus === 'rejected').length })}
                            </p>
                        </div>
                    </div>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : error ? (
                <Alert variant="error">{error}</Alert>
            ) : garages.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                        {t('myGarages.noGarages')}
                    </p>
                    <Link to="/add-garage">
                        <Button variant="primary" size="lg">
                            {t('myGarages.addFirst')}
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {garages.map((garage) => (
                        <GarageCard
                            key={garage._id}
                            garage={garage}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}