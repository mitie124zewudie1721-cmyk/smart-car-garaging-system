// src/pages/CarOwner/Disputes.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
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

const disputeSchema = z.object({
    reservationId: z.string().min(1, 'Please select a reservation'),
    type: z.string().min(1, 'Please select dispute type'),
    reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
});

const feedbackSchema = z.object({
    rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment too long'),
});

type DisputeFormData = z.infer<typeof disputeSchema>;
type FeedbackFormData = z.infer<typeof feedbackSchema>;

const DISPUTE_TYPES = [
    { value: 'complaint', label: 'Service Quality Complaint' },
    { value: 'cancellation_request', label: 'Cancellation Request' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'other', label: 'Other Issue' },
];

export default function Disputes() {
    const { t } = useTranslation();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [disputeFeedbacks, setDisputeFeedbacks] = useState<DisputeFeedback[]>([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<DisputeFormData>({
        resolver: zodResolver(disputeSchema),
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
        try {
            const response = await api.get('/disputes/my');
            setDisputes(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch disputes:', err);
        }
    };

    const fetchReservations = async () => {
        try {
            const response = await api.get('/reservations/my');
            setReservations(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch reservations:', err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchDisputes(), fetchReservations()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const onSubmit = async (data: DisputeFormData) => {
        setSubmitting(true);
        try {
            await api.post('/disputes', data);
            toast.success('Dispute submitted successfully');
            setShowCreateModal(false);
            reset();
            fetchDisputes();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to submit dispute';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeaveFeedback = (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setFeedbackRating(0);
        resetFeedback();
        setShowFeedbackModal(true);
    };

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

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('carDisputes.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('carDisputes.subtitle')}
                    </p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    {t('carDisputes.fileNew')}
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : disputes.length === 0 ? (
                <Alert variant="info">
                    {t('carDisputes.noDisputes')}
                </Alert>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {disputes.map((dispute) => {
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
                                                {t('carDisputes.service')}: {dispute.reservation?.serviceType}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                                            {({
                                                pending: t('carDisputes.statusPending'),
                                                under_review: t('carDisputes.statusUnderReview'),
                                                resolved: t('carDisputes.statusResolved'),
                                                rejected: t('carDisputes.statusRejected'),
                                                closed: t('carDisputes.statusClosed'),
                                            } as Record<string, string>)[dispute.status] || dispute.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('carDisputes.type')}:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {DISPUTE_TYPES.find(t => t.value === dispute.type)?.label || dispute.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('carDisputes.reason')}:</span>
                                            <span className="text-gray-900 dark:text-white">{dispute.reason}</span>
                                        </div>
                                        <div className="flex items-start text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{t('carDisputes.description')}:</span>
                                            <span className="text-gray-900 dark:text-white">{dispute.description}</span>
                                        </div>
                                        {dispute.resolutionNote && (
                                            <div className="flex items-start text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{t('carDisputes.resolution')}:</span>
                                                <span className="text-gray-900 dark:text-white">{dispute.resolutionNote}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 w-32">{t('carDisputes.filed')}:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {(dispute.status === 'resolved' || dispute.status === 'closed') && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                            <Button variant="primary" size="sm" onClick={() => handleLeaveFeedback(dispute)} fullWidth>
                                                {t('carDisputes.leaveFeedback')}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(dispute)} fullWidth>
                                                {t('carDisputes.viewDetails')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('carDisputes.fileComplaint')} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Select label={t('carDisputes.selectReservation')} placeholder={t('carDisputes.chooseReservation')}
                        {...register('reservationId')} error={errors.reservationId?.message} disabled={submitting}
                        options={reservations.map(r => ({ value: r._id || r.id, label: `${r.garage?.name} - ${r.serviceType} (${new Date(r.startTime).toLocaleDateString()})` }))}
                    />
                    <Select label={t('carDisputes.complaintType')} placeholder={t('carDisputes.selectType')}
                        {...register('type')} error={errors.type?.message} disabled={submitting} options={DISPUTE_TYPES}
                    />
                    <Input label={t('carDisputes.reasonBrief')} placeholder={t('carDisputes.reasonPlaceholder')}
                        {...register('reason')} error={errors.reason?.message} disabled={submitting}
                    />
                    <div className="space-y-1.5 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('carDisputes.detailedDesc')}</label>
                        <textarea
                            rows={5}
                            placeholder={t('carDisputes.descPlaceholder')}
                            {...register('description')}
                            disabled={submitting}
                            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                            {t('carDisputes.cancel')}
                        </Button>
                        <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting}>
                            {t('carDisputes.submitComplaint')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showFeedbackModal} onClose={() => { setShowFeedbackModal(false); setSelectedDispute(null); setFeedbackRating(0); }}
                title={t('carDisputes.feedbackTitle')} size="md">
                {selectedDispute && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>{t('carDisputes.garage')}:</strong> {selectedDispute.garage?.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>{t('carDisputes.issue')}:</strong> {selectedDispute.reason}
                        </p>
                    </div>
                )}
                <form onSubmit={handleSubmitFeedback(onSubmitFeedback)} className="space-y-6">
                    <input type="hidden" {...registerFeedback('rating', { valueAsNumber: true })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carDisputes.satisfactionQuestion')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => handleRatingClick(star)}
                                    className="focus:outline-none transition-transform hover:scale-110" disabled={submitting}>
                                    <svg className={`w-10 h-10 ${star <= feedbackRating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        {feedbackRating === 0 && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">{t('carDisputes.selectRating')}</p>}
                        {feedbackErrors.rating && <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{feedbackErrors.rating.message}</p>}
                    </div>
                    <div className="space-y-1.5 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('carDisputes.yourComments')}</label>
                        <textarea
                            rows={4}
                            placeholder={t('carDisputes.commentPlaceholder')}
                            {...registerFeedback('comment')}
                            disabled={submitting}
                            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                        />
                        {feedbackErrors.comment && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{feedbackErrors.comment.message}</p>}
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => { setShowFeedbackModal(false); setSelectedDispute(null); setFeedbackRating(0); }} disabled={submitting}>
                            {t('carDisputes.cancel')}
                        </Button>
                        <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting || feedbackRating === 0}>
                            {t('carDisputes.submitFeedback')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Dispute Details Modal with Feedbacks */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedDispute(null);
                    setDisputeFeedbacks([]);
                }}
                title="Dispute Details & Feedbacks"
                size="lg"
            >
                {selectedDispute && (
                    <div className="space-y-6">
                        {/* Dispute Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dispute Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedDispute.status)}`}>
                                        {selectedDispute.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Garage:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.garage?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {DISPUTE_TYPES.find(t => t.value === selectedDispute.type)?.label || selectedDispute.type}
                                    </span>
                                </div>
                                {selectedDispute.resolutionNote && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Resolution:</span>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {selectedDispute.resolutionNote}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Feedbacks Section */}
                        {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Feedback from Both Parties
                                </h4>
                                {loadingFeedbacks ? (
                                    <div className="flex justify-center py-8">
                                        <Loader size="md" />
                                    </div>
                                ) : disputeFeedbacks.length === 0 ? (
                                    <Alert variant="info">
                                        No feedback has been submitted yet. Be the first to leave feedback!
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

                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                                <Button variant="primary" size="sm" onClick={() => { setShowDetailsModal(false); handleLeaveFeedback(selectedDispute); }} fullWidth>
                                    {t('carDisputes.leaveYourFeedback')}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setShowDetailsModal(false); setSelectedDispute(null); setDisputeFeedbacks([]); }} fullWidth>
                                {t('carDisputes.close')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
