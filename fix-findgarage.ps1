$content = @'
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import GarageSearchMap from '@/components/car-owner/GarageSearchMap';
import ReservationForm from '@/components/car-owner/ReservationForm';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';

const searchSchema = z.object({
    radius: z.number().min(1).max(50).default(10),
    date: z.string().optional(),
    time: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    vehicleType: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
});

type SearchForm = z.infer<typeof searchSchema>;

interface Garage {
    _id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    pricePerHour: number;
    availableSlots: number;
    rating: number;
    amenities: string[];
    distance?: number;
}

interface Vehicle {
    _id: string;
    make: string;
    model: string;
    plateNumber: string;
}

export default function FindGarage() {
    const [garages, setGarages] = useState<Garage[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SearchForm>({
        resolver: zodResolver(searchSchema),
        defaultValues: { radius: 10, amenities: [] },
    });

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/vehicles/my');
                const vehiclesList = response.data.data || [];
                setVehicles(vehiclesList);
            } catch (err: any) {
                console.error('Failed to fetch vehicles:', err);
            }
        };
        fetchVehicles();
    }, []);

    useEffect(() => {
        const defaultLoc = { lat: 7.6667, lng: 36.8333 };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    searchGaragesWithLocation(loc, 10);
                },
                (err) => {
                    console.warn('Geolocation error:', err);
                    setUserLocation(defaultLoc);
                    searchGaragesWithLocation(defaultLoc, 10);
                }
            );
        } else {
            setUserLocation(defaultLoc);
            searchGaragesWithLocation(defaultLoc, 10);
        }
    }, []);

    const searchGaragesWithLocation = async (location: { lat: number; lng: number }, radius: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/garages/search', { lat: location.lat, lng: location.lng, radius });
            const formattedGarages = (response.data.data || []).map((g: any) => ({
                _id: g._id,
                name: g.name,
                address: g.location?.address || 'No address',
                lat: g.location?.coordinates?.[1] || null,
                lng: g.location?.coordinates?.[0] || null,
                pricePerHour: g.pricePerHour || 0,
                availableSlots: g.availableSlots || 0,
                rating: g.rating || 0,
                amenities: g.amenities || [],
                distance: g.distance,
            }));
            setGarages(formattedGarages);
            if (formattedGarages.length === 0) toast('No garages found');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Search failed';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = handleSubmit((data) => {
        if (!userLocation) {
            toast.error('Location not available');
            return;
        }
        searchGaragesWithLocation(userLocation, data.radius);
    });

    const handleReserve = (garage: Garage) => {
        setSelectedGarage(garage);
        setShowReserveModal(true);
    };

    const handleViewDetails = (garage: Garage) => {
        toast(`${garage.name}\n${garage.address}\nPrice: $${garage.pricePerHour}/hr\nSlots: ${garage.availableSlots}`, {
            duration: 5000,
        });
    };

    const handleReservationSuccess = () => {
        setShowReserveModal(false);
        setSelectedGarage(null);
        toast.success('Reservation created!');
        if (userLocation) searchGaragesWithLocation(userLocation, watch('radius'));
    };

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find Nearby Garages</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Search available garages</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <form onSubmit={onSubmit} className="space-y-6">
                            <Input label="Radius (km)" type="number" {...register('radius', { valueAsNumber: true })} error={errors.radius?.message} />
                            <Button type="submit" variant="primary" fullWidth disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
                        </form>
                    </Card>
                    {loading ? <Loader size="lg" /> : error ? <Alert variant="error">{error}</Alert> : garages.length === 0 ? <Alert variant="info">No garages found</Alert> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {garages.map((garage) => (
                                <Card key={garage._id} hoverable>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{garage.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{garage.address}</p>
                                    <div className="flex gap-2 mt-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1" 
                                            onClick={() => handleViewDetails(garage)}
                                        >
                                            View Details
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            className="flex-1" 
                                            onClick={() => handleReserve(garage)}
                                        >
                                            Reserve Now
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <GarageSearchMap garages={garages} userLocation={userLocation} onSelectGarage={handleReserve} height="100%" />
                </div>
            </div>
            <Modal isOpen={showReserveModal} onClose={() => setShowReserveModal(false)} title={`Reserve at ${selectedGarage?.name}`} size="lg">
                {selectedGarage && <ReservationForm garageId={selectedGarage._id} vehicles={vehicles} onSuccess={handleReservationSuccess} onClose={() => setShowReserveModal(false)} />}
            </Modal>
        </div>
    );
}
'@

$content | Out-File -FilePath "frontend/src/pages/CarOwner/FindGarage.tsx" -Encoding UTF8 -NoNewline
Write-Host "File written successfully!" -ForegroundColor Green
Write-Host "Lines:" (Get-Content "frontend/src/pages/CarOwner/FindGarage.tsx" | Measure-Object -Line).Lines -ForegroundColor Cyan
