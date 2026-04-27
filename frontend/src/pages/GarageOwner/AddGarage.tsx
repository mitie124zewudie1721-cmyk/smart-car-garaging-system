// src/pages/GarageOwner/AddGarage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GarageForm from '@/components/garage-owner/GarageForm';
import api from '@/lib/api';

export default function AddGarage() {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [feePaid, setFeePaid] = useState(false);

    useEffect(() => {
        api.get('/users/registration-fee/status')
            .then(r => {
                if (r.data.data?.isPaid) {
                    setFeePaid(true);
                } else {
                    // Check agreement first, then fee
                    api.get('/users/agreement').then(ag => {
                        if (!ag.data.data?.userAccepted) {
                            navigate('/agreement', { replace: true });
                        } else {
                            navigate('/registration-fee', { replace: true });
                        }
                    }).catch(() => navigate('/registration-fee', { replace: true }));
                }
            })
            .catch(() => {
                setFeePaid(true);
            })
            .finally(() => setChecking(false));
    }, []);

    if (checking) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!feePaid) return null;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Garage</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Fill in the details to add your garage to the system</p>
                <GarageForm onSuccess={() => navigate('/my-garages')} />
            </div>
        </div>
    );
}
