// src/components/garage-owner/ReservationTable.tsx
import { format } from 'date-fns';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface Reservation {
    _id: string;
    userName: string;
    vehicle: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    totalPrice: number;
}

interface ReservationTableProps {
    reservations: Reservation[];
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
}

export default function ReservationTable({ reservations, onConfirm, onCancel }: ReservationTableProps) {
    if (reservations.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No reservations yet.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {reservations.map((res) => (
                        <tr key={res._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{res.userName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{res.vehicle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(res.startTime), 'MMM d, yyyy h:mm a')} –<br />
                                    {format(new Date(res.endTime), 'MMM d, yyyy h:mm a')}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={cn(
                                        'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                        res.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                                        res.status === 'confirmed' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                                        res.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                        res.status === 'completed' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                                        res.status === 'cancelled' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    )}
                                >
                                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                ETB {res.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {res.status === 'pending' && onConfirm && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => onConfirm(res._id)}
                                        className="mr-2"
                                    >
                                        Confirm
                                    </Button>
                                )}
                                {['pending', 'confirmed'].includes(res.status) && onCancel && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onCancel(res._id)}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}