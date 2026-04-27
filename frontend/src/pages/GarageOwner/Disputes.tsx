// src/pages/GarageOwner/Disputes.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

interface Dispute {
    _id?: string;
    id?: string;
    reservation: {
        _id: string;
        startTime: string;
        serviceType: string;
        totalPrice: number;
        status: string;
    };
    user: {
        _id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    garage: {
        _id: string;
        name: string;
        address: string;
    };
    type: string;
    reason: string;
    description: string;
    status: string;
    priority: string;
    resolutionNote?: string;
    createdAt: string;
    resolvedAt?: string;
}

interface DisputeFeedback {
    _id: string;
    user: {
        _id: string;
        name: string;
        role: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

const resolutionSchema = z.object({
    status: z.string().min(1, 'Please select a status'),
    resolutionNote: z.string().min(10, 'Resolution note must be at least 10 characters').max(1000, 'Resolution note too long'),
});

const feedbackSchema = z.object({
    rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment too long'),
});

type ResolutionFormData = z.infer<typeof resolutionSchema>;
type FeedbackFormData = z.infer<typeof feedbackSchema>;

const DISPUTE_TYPES = [
    { value: 'complaint', label: 'Service Quality Complaint' },
    { value: 'cancellation_request', label: 'Cancellation Request' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'other', label: 'Other Issue' },
];

const STATUS_OPTIONS = [
    { value: 'under_review', label: 'Under Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'closed', label: 'Closed' },
];

export default function GarageOwnerDisputes() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [disputeFeedbacks, setDisputeFeedbacks] = useState<DisputeFeedback[]>([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ResolutionFormData>({
        resolver: zodResolver(resolutionSchema),
    });

    const {
        register: registerFeedback,
        handleSubmit: handleSubmitFeedback,
        formState: { errors: feedbackErrors },
        reset: resetFeedback,
        setValue: setFeedbackValue,
    } = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackSchema),
    });

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/disputes/garage');
            setDisputes(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch disputes:', err);
            toast.error('Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const handleResolve = (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setShowResolveModal(true);
        reset({
            status: dispute.status === 'pending' ? 'under_review' : dispute.status,
            resolutionNote: dispute.resolutionNote || '',
        });
    };

    const onSubmit = async (data: ResolutionFormData) => {
        if (!selectedDispute) return;

        setSubmitting(true);
        try {
            const disputeId = selectedDispute.id || selectedDispute._id;
            await api.patch(`/disputes/${disputeId}/status`, data);
            toast.success('Dispute updated successfully');
            setShowResolveModal(false);
            setSelectedDispute(null);
            reset();
            fetchDisputes();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update dispute';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        };
        return colors[status] || colors.pending;
    };

    const getDisputeId = (dispute: Dispute) => dispute.id || dispute._id || '';

    const handleViewDetails = async (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setShowDetailsModal(true);

        // Fetch feedbacks for this dispute
        if (dispute.status === 'resolved' || dispute.status === 'closed') {
            setLoadingFeedbacks(true);
            try {
                const disputeId = dispute.id || dispute._id;
                const response = await api.get(`/feedbacks/dispute/${disputeId}`);
                setDisputeFeedbacks(response.data.data || []);
            } catch (err: any) {
                console.error('Failed to fetch dispute feedbacks:', err);
                setDisputeFeedbacks([]);
            } finally {
                setLoadingFeedbacks(false);
            }
        }
    };

    const handleLeaveFeedback = (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setFeedbackRating(0);
        resetFeedback();
        setShowFeedbackModal(true);
    };

    const onSubmitFeedback = async (data: FeedbackFormData) => {
        if (!selectedDispute) return;

        setSubmitting(true);
        try {
            const disputeId = selectedDispute.id || selectedDispute._id;
            await api.post('/feedbacks', {
                disputeId,
                rating: data.rating,
                comment: data.comment,
                feedbackType: 'dispute_resolution',
            });
            toast.success('Thank you for your feedback!');
            setShowFeedbackModal(false);
            setSelectedDispute(null);
            resetFeedback();
            setFeedbackRating(0);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to submit feedback';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRatingClick = (rating: number) => {
        setFeedbackRating(rating);
        setFeedbackValue('rating', rating, { shouldValidate: true });
    };

    const filteredDisputes = filter === 'all'
        ? disputes
        : disputes.filter(d => d.status === filter);

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('disputes.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('disputes.subtitle')}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(['all', 'pending', 'under_review', 'resolved', 'rejected', 'closed'] as const).map((status) => {
                    const labelMap: Record<string, string> = {
                        all: t('disputes.all'),
                        pending: t('disputes.statusPending'),
                        under_review: t('disputes.statusUnderReview'),
                        resolved: t('disputes.statusResolved'),
                        rejected: t('disputes.statusRejected'),
                        closed: t('disputes.statusClosed'),
                    };
                    return (
                        <Button
                            key={status}
                            variant={filter === status ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(status)}
                        >
                            {labelMap[status]}
                            {status === 'all' && ` (${disputes.length})`}
                            {status !== 'all' && ` (${disputes.filter(d => d.status === status).length})`}
                        </Button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : filteredDisputes.length === 0 ? (
                <Alert variant="info">
                    {filter === 'all'
                        ? t('disputes.noDisputes')
                        : t('disputes.noStatusDisputes', { status: filter.replace('_', ' ') })
                    }
                </Alert>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredDisputes.map((dispute) => {
                        const disputeId = getDisputeId(dispute);
                        return (
                            <Card key={disputeId}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {dispute.garage?.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('disputes.service')}: {dispute.reservation?.serviceType}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                                            {({
                                                pending: t('disputes.statusPending'),
                                                under_review: t('disputes.statusUnderReview'),
                                                resolved: t('disputes.statusResolved'),
                                                rejected: t('disputes.statusRejected'),
                                                closed: t('disputes.statusClosed'),
                                            } as Record<string, string>)[dispute.status] || dispute.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('disputes.customer')}:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {dispute.user?.name}
                                            </span>
                                        </div>
                                        {dispute.user?.phone && (
                                            <div className="flex items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 w-32">{t('disputes.phone')}:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {dispute.user.phone}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('disputes.type')}:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {DISPUTE_TYPES.find(t => t.value === dispute.type)?.label || dispute.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('disputes.reason')}:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {dispute.reason}
                                            </span>
                                        </div>
                                        <div className="flex items-start text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{t('disputes.description')}:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {dispute.description}
                                            </span>
                                        </div>
                                        {dispute.resolutionNote && (
                                            <div className="flex items-start text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{t('disputes.yourResponse')}:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {dispute.resolutionNote}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('disputes.filed')}:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleResolve(dispute)}
                                            >
                                                {dispute.status === 'pending' ? t('disputes.reviewRespond') : t('disputes.updateStatus')}
                                            </Button>
                                        )}
                                        {(dispute.status === 'resolved' || dispute.status === 'closed') && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleLeaveFeedback(dispute)}
                                            >
                                                {t('disputes.leaveFeedback')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(dispute)}
                                        >
                                            {t('disputes.viewDetails')}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Resolve Dispute Modal */}
            <Modal
                isOpen={showResolveModal}
                onClose={() => {
                    setShowResolveModal(false);
                    setSelectedDispute(null);
                }}
                title={t('disputes.resolveTitle')}
                size="lg"
            >
                {selectedDispute && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>{t('disputes.customer')}:</strong> {selectedDispute.user?.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>{t('disputes.reason')}:</strong> {selectedDispute.reason}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>{t('disputes.description')}:</strong> {selectedDispute.description}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Select
                        label={t('disputes.status')}
                        placeholder={t('disputes.status')}
                        {...register('status')}
                        error={errors.status?.message}
                        disabled={submitting}
                        options={STATUS_OPTIONS}
                    />

                    <div className="space-y-1.5 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('disputes.resolutionNote')}</label>
                        <textarea
                            rows={5}
                            placeholder={t('disputes.commentPlaceholder')}
                            {...register('resolutionNote')}
                            disabled={submitting}
                            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                        />
                        {errors.resolutionNote && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.resolutionNote.message}</p>}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowResolveModal(false);
                                setSelectedDispute(null);
                            }}
                            disabled={submitting}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={submitting}
                            disabled={submitting}
                        >
                            {t('disputes.updateDispute')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Dispute Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedDispute(null);
                }}
                title={t('disputes.detailsTitle')}
                size="lg"
            >
                {selectedDispute && (
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('disputes.title')} #{getDisputeId(selectedDispute).slice(-8)}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedDispute.status)}`}>
                                {({
                                    pending: t('disputes.statusPending'),
                                    under_review: t('disputes.statusUnderReview'),
                                    resolved: t('disputes.statusResolved'),
                                    rejected: t('disputes.statusRejected'),
                                    closed: t('disputes.statusClosed'),
                                } as Record<string, string>)[selectedDispute.status] || selectedDispute.status}
                            </span>
                        </div>

                        {/* Garage Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('disputes.garageInfo')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('garageVerification.owner')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.garage?.name || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('garageVerification.address')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                                        {selectedDispute.garage?.address || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('disputes.customerInfo')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.customer')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.user?.name || 'N/A'}
                                    </span>
                                </div>
                                {selectedDispute.user?.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.phone')}:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedDispute.user.phone}
                                        </span>
                                    </div>
                                )}
                                {selectedDispute.user?.email && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedDispute.user.email}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reservation Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('disputes.reservationInfo')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Service Type:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.reservation?.serviceType || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.service')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.reservation?.serviceType || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reservation.startTime')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.reservation?.startTime
                                            ? new Date(selectedDispute.reservation.startTime).toLocaleDateString()
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reservation.totalPrice')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.reservation?.totalPrice
                                            ? `${selectedDispute.reservation.totalPrice} ETB`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('common.status')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.reservation?.status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dispute Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('disputes.disputeInfo')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.type')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {DISPUTE_TYPES.find(t => t.value === selectedDispute.type)?.label || selectedDispute.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.priority')}:</span>
                                    <span className={`text-sm font-medium ${selectedDispute.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                                        selectedDispute.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                            selectedDispute.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {selectedDispute.priority.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">{t('disputes.reason')}:</span>
                                    <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded">
                                        {selectedDispute.reason}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">{t('disputes.description')}:</span>
                                    <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">
                                        {selectedDispute.description}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.filedOn')}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(selectedDispute.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Resolution Information */}
                        {selectedDispute.resolutionNote && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('disputes.yourResponse')}</h4>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                        {selectedDispute.resolutionNote}
                                    </p>
                                    {selectedDispute.resolvedAt && (
                                        <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('disputes.resolvedOn')}:</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(selectedDispute.resolvedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Feedbacks Section */}
                        {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('disputes.feedbackHistory')}
                                </h4>
                                {loadingFeedbacks ? (
                                    <div className="flex justify-center py-8">
                                        <Loader size="md" />
                                    </div>
                                ) : disputeFeedbacks.length === 0 ? (
                                    <Alert variant="info">
                                        {t('disputes.noFeedback')}
                                    </Alert>
                                ) : (
                                    <div className="space-y-4">
                                        {disputeFeedbacks.map((feedback) => (
                                            <div
                                                key={feedback._id}
                                                className={`p-4 rounded-lg border-2 ${feedback.user.role === 'car_owner'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {feedback.user.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {feedback.user.role === 'car_owner' ? 'Car Owner' : 'Garage Owner'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <svg
                                                                key={star}
                                                                className={`w-4 h-4 ${star <= feedback.rating
                                                                    ? 'text-yellow-400 fill-current'
                                                                    : 'text-gray-300 dark:text-gray-600'
                                                                    }`}
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                        ))}
                                                        <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                                                            {feedback.rating}/5
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                                    {feedback.comment}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    {new Date(feedback.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleResolve(selectedDispute);
                                    }}
                                    fullWidth
                                >
                                    {selectedDispute.status === 'pending' ? t('disputes.reviewRespond') : t('disputes.updateStatus')}
                                </Button>
                            )}
                            {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleLeaveFeedback(selectedDispute);
                                    }}
                                    fullWidth
                                >
                                    {t('disputes.leaveFeedback')}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDetailsModal(false)}
                                fullWidth
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Feedback Modal */}
            <Modal
                isOpen={showFeedbackModal}
                onClose={() => {
                    setShowFeedbackModal(false);
                    setSelectedDispute(null);
                    setFeedbackRating(0);
                }}
                title="Leave Feedback on Customer Interaction"
                size="md"
            >
                {selectedDispute && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Customer:</strong> {selectedDispute.user?.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Issue:</strong> {selectedDispute.reason}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmitFeedback(onSubmitFeedback)} className="space-y-6">
                    {/* Hidden input for rating to work with react-hook-form */}
                    <input type="hidden" {...registerFeedback('rating', { valueAsNumber: true })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            How would you rate this customer interaction? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingClick(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    disabled={submitting}
                                >
                                    <svg
                                        className={`w-10 h-10 ${star <= feedbackRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        {feedbackRating === 0 && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                Please select a rating
                            </p>
                        )}
                        {feedbackErrors.rating && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                                {feedbackErrors.rating.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Comments</label>
                        <textarea
                            rows={4}
                            placeholder="Share your experience with this customer and dispute resolution..."
                            {...registerFeedback('comment')}
                            disabled={submitting}
                            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                        />
                        {feedbackErrors.comment && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{feedbackErrors.comment.message}</p>}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowFeedbackModal(false);
                                setSelectedDispute(null);
                                setFeedbackRating(0);
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={submitting}
                            disabled={submitting || feedbackRating === 0}
                        >
                            Submit Feedback
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
