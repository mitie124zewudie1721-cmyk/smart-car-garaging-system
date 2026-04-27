// src/pages/Admin/GarageVerification.tsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import GarageDetailsModal from '@/components/garage-owner/GarageDetailsModal';

interface Garage {
    _id: string;
    name: string;
    location: { address: string; coordinates: number[] };
    capacity: number;
    availableSlots: number;
    pricePerHour: number;
    rating: number;
    totalReviews: number;
    amenities: string[];
    description?: string;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    owner: { _id: string; name: string; username: string; email?: string; phone?: string };
    createdAt: string;
    updatedAt?: string;
    operatingHours?: { start?: string; end?: string; weekly?: Record<string, { open: boolean; start: string; end: string }>; };
    licenseNumber?: string;
    licenseDocument?: { path?: string; originalFilename?: string; mimeType?: string; };
    needsReview?: boolean;
    contact?: { phone?: string; email?: string };
    services?: { name: string; price: number; duration: number; description?: string }[];
}

export default function GarageVerification() {
    const [pendingGarages, setPendingGarages] = useState<Garage[]>([]);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [detailsGarage, setDetailsGarage] = useState<Garage | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => { fetchPendingGarages(); }, []);

    const fetchPendingGarages = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/garages/pending');
            setPendingGarages(res.data.data);
            if (res.data.data.length > 0) setSelectedGarage(res.data.data[0]);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to fetch pending garages');
        } finally { setLoading(false); }
    };

    const removeGarage = (id: string) => {
        setPendingGarages(prev => {
            const rest = prev.filter(g => g._id !== id);
            if (selectedGarage?._id === id) setSelectedGarage(rest[0] ?? null);
            return rest;
        });
    };

    const handleApprove = async (garageId: string) => {
        if (!confirm('Approve this garage?')) return;
        try {
            setActionLoading(true);
            await api.patch('/admin/garages/' + garageId + '/approve');
            toast.success('Garage approved!');
            removeGarage(garageId);
            setDetailsGarage(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to approve');
        } finally { setActionLoading(false); }
    };

    const openRejectModal = (garageId: string) => {
        setRejectTargetId(garageId);
        setRejectionReason('');
        setDetailsGarage(null);
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectTargetId || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason'); return;
        }
        try {
            setActionLoading(true);
            await api.patch('/admin/garages/' + rejectTargetId + '/reject', { reason: rejectionReason });
            toast.success('Garage rejected');
            removeGarage(rejectTargetId);
            setShowRejectModal(false);
            setRejectionReason('');
            setRejectTargetId(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to reject');
        } finally { setActionLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Garage Verification</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Review and approve garage registrations</p>

                {pendingGarages.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending verifications</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All garages have been verified!</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel */}
                        <div className="lg:col-span-1">
                            <Card>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Pending Garages ({pendingGarages.length})
                                </h2>
                                <div className="space-y-3">
                                    {pendingGarages.map((garage) => {
                                        const isEdited = garage.updatedAt && garage.createdAt &&
                                            new Date(garage.updatedAt).getTime() - new Date(garage.createdAt).getTime() > 60000;
                                        return (
                                            <div key={garage._id} style={{ border: selectedGarage?._id === garage._id ? '2px solid #6366f1' : '2px solid #e5e7eb', borderRadius: 8 }}>
                                                <div style={{ padding: 16, cursor: 'pointer', background: selectedGarage?._id === garage._id ? '#eef2ff' : 'transparent' }} onClick={() => setSelectedGarage(garage)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <p style={{ fontWeight: 600, color: '#111827' }}>{garage.name}</p>
                                                        {isEdited && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '1px 6px' }}>
                                                                EDITED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Owner: {garage.owner.username}</p>
                                                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{new Date(garage.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{ padding: '0 12px 12px' }}>
                                                    <button type="button" onClick={() => setDetailsGarage(garage)}
                                                        style={{ width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer' }}>
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Right Panel */}
                        <div className="lg:col-span-2">
                            {selectedGarage && (
                                <Card>
                                    <div className="space-y-5">
                                        {/* Re-approval banner */}
                                        {selectedGarage.updatedAt && selectedGarage.createdAt &&
                                            new Date(selectedGarage.updatedAt).getTime() - new Date(selectedGarage.createdAt).getTime() > 60000 && (
                                            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2">
                                                <span className="text-amber-500 text-lg">??</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-800">Re-approval Required</p>
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        Owner edited this garage on {new Date(selectedGarage.updatedAt).toLocaleString()}. Review updated info before approving.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedGarage.name}</h2>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-gray-900 dark:text-white">{selectedGarage.location.address}</p></div>
                                            <div><label className="text-sm font-medium text-gray-500">Capacity</label><p className="text-gray-900 dark:text-white">{selectedGarage.capacity} vehicles</p></div>
                                            <div><label className="text-sm font-medium text-gray-500">Registered</label><p className="text-gray-900 dark:text-white">{new Date(selectedGarage.createdAt).toLocaleString()}</p></div>
                                        </div>

                                        {selectedGarage.description && (
                                            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                                                ?? {selectedGarage.description}
                                            </div>
                                        )}

                                        {/* License Information */}
                                        {/* License Information */}
                                        <div className="border-t pt-4">
                                            <label className="text-xs font-medium text-gray-500 uppercase block mb-2">?? License</label>
                                            {selectedGarage.licenseNumber ? (
                                                <p className="text-sm font-semibold text-slate-700 mb-2">
                                                    License #: <span className="font-mono text-indigo-700">{selectedGarage.licenseNumber}</span>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic mb-2">No license number provided</p>
                                            )}
                                            {selectedGarage.licenseDocument?.path ? (
                                                <div>
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL?.replace('/api','')||'http://localhost:5002'}${selectedGarage.licenseDocument.path}`}
                                                        alt="License document"
                                                        className="max-w-xs max-h-48 rounded-lg border border-slate-200 shadow-sm object-contain cursor-pointer hover:opacity-90 transition"
                                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api','')||'http://localhost:5002'}${selectedGarage.licenseDocument!.path}`, '_blank')}
                                                    />
                                                    <p className="text-xs text-slate-400 mt-1">Click to view full size</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">?? No license image uploaded</p>
                                            )}
                                        </div>

                                        {selectedGarage.amenities?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Amenities</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedGarage.amenities.map(a => (
                                                        <span key={a} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{a.replace(/_/g, ' ')}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(selectedGarage.operatingHours?.start || selectedGarage.contact?.phone) && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {(selectedGarage.operatingHours?.start || selectedGarage.operatingHours?.weekly) && (
                                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-amber-600 mb-2">?? Operating Hours</p>
                                                        {(selectedGarage.operatingHours as any).weekly ? (
                                                            <div className="space-y-1">
                                                                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day: string) => {
                                                                    const s = (selectedGarage.operatingHours as any).weekly[day];
                                                                    if (!s) return null;
                                                                    return (
                                                                        <div key={day} className="flex items-center gap-2 text-xs">
                                                                            <span className="w-20 font-semibold text-amber-700 capitalize">{day}</span>
                                                                            {s.open ? <span className="text-emerald-700 font-bold">{s.start} � {s.end}</span> : <span className="text-red-400 italic">Closed</span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-medium text-amber-800">{selectedGarage.operatingHours?.start} � {selectedGarage.operatingHours?.end}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {(selectedGarage.contact?.phone || selectedGarage.contact?.email) && (
                                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-blue-600 mb-1">?? Contact</p>
                                                        {selectedGarage.contact?.phone && <p className="text-sm text-blue-800">{selectedGarage.contact.phone}</p>}
                                                        {selectedGarage.contact?.email && <p className="text-sm text-blue-800">{selectedGarage.contact.email}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectedGarage.services && selectedGarage.services.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Services ({selectedGarage.services.length})</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedGarage.services.map((s, i) => (
                                                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                                            <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                                                            <p className="text-xs text-slate-500">{s.duration} min � {s.price} ETB</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}


                                        <div className="border-t pt-5">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Owner Information</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-gray-900 dark:text-white">{selectedGarage.owner.name}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">Username</label><p className="text-gray-900 dark:text-white">{selectedGarage.owner.username}</p></div>
                                                {selectedGarage.owner.email && <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-gray-900 dark:text-white">{selectedGarage.owner.email}</p></div>}
                                                {selectedGarage.owner.phone && <div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-gray-900 dark:text-white">{selectedGarage.owner.phone}</p></div>}
                                            </div>
                                        </div>

                                        <div className="border-t pt-5 flex gap-4">
                                            <Button onClick={() => handleApprove(selectedGarage._id)} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                                {actionLoading ? 'Processing...' : 'Approve Garage'}
                                            </Button>
                                            <Button onClick={() => openRejectModal(selectedGarage._id)} disabled={actionLoading} variant="outline" className="flex-1 border-red-600 text-red-600 hover:bg-red-50">
                                                Reject Garage
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Garage</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Provide a reason - the owner will see this.</p>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter rejection reason..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                            rows={4} maxLength={500} />
                        <div className="text-xs text-gray-500 mt-1 text-right">{rejectionReason.length}/500</div>
                        <div className="flex gap-3 mt-6">
                            <Button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setRejectTargetId(null); }} variant="outline" className="flex-1" disabled={actionLoading}>Cancel</Button>
                            <Button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={actionLoading || !rejectionReason.trim()}>
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Details Modal */}
            {detailsGarage && (
                <GarageDetailsModal
                    garage={{ ...detailsGarage, location: { address: detailsGarage.location.address, coordinates: detailsGarage.location.coordinates as [number, number] }, rating: detailsGarage.rating ?? 0, totalReviews: detailsGarage.totalReviews ?? 0, amenities: detailsGarage.amenities ?? [] }}
                    isOpen={true}
                    onClose={() => setDetailsGarage(null)}
                    role="admin"
                    onApprove={() => handleApprove(detailsGarage._id)}
                    onReject={() => openRejectModal(detailsGarage._id)}
                />
            )}
        </div>
    );
}
