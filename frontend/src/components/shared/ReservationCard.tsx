// src/components/shared/ReservationCard.tsx
import { format } from 'date-fns';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Reservation {
    _id: string;
    garageName: string;
    vehicleName: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    totalPrice: number;
    serviceType?: string;
    serviceDescription?: string;
    onCancel?: (id: string) => Promise<void> | void;
}

interface ReservationCardProps {
    reservation: Reservation;
}

export default function ReservationCard({ reservation }: ReservationCardProps) {
    const isActive = ['pending', 'confirmed', 'active'].includes(reservation.status);
    const canCancel = isActive && reservation.onCancel;

    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const statusLabels = {
        pending: 'Pending Confirmation',
        confirmed: 'Confirmed',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };

    const handleCancel = async () => {
        if (!reservation.onCancel) return;

        if (!confirm('Are you sure you want to cancel this reservation? This cannot be undone.')) {
            return;
        }

        try {
            await reservation.onCancel(reservation._id);
            toast.success('Reservation cancelled successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel reservation');
        }
    };

    // Format price with Ethiopian Birr symbol
    const formattedPrice = new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
    }).format(reservation.totalPrice);

    return (
        <Card
            hoverable
            className="transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {reservation.garageName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vehicle: {reservation.vehicleName}
                    </p>
                    {reservation.serviceType && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Service:</span> {reservation.serviceType}
                        </p>
                    )}
                    {reservation.serviceDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            {reservation.serviceDescription}
                        </p>
                    )}
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">From:</span>{' '}
                        {format(new Date(reservation.startTime), 'PPP p')} –{' '}
                        <span className="font-medium">To:</span>{' '}
                        {format(new Date(reservation.endTime), 'PPP p')}
                    </div>
                </div>

                {/* Right: Status + Price + Cancel */}
                <div className="flex flex-col items-end gap-3">
                    <span
                        className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                            statusStyles[reservation.status]
                        )}
                    >
                        {statusLabels[reservation.status]}
                    </span>

                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formattedPrice}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total Price
                        </p>
                    </div>

                    {canCancel && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleCancel}
                            aria-label={`Cancel reservation at ${reservation.garageName}`}
                        >
                            Cancel Reservation
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}