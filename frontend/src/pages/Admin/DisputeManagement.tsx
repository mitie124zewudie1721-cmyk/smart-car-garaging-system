// src/pages/Admin/DisputeManagement.tsx
import { useEffect, useState, type ChangeEvent } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import { ShieldCheck, AlertTriangle, Zap, ClipboardList, CheckCircle, RefreshCw } from 'lucide-react';
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

const DISPUTE_TYPES = [
    { value: 'complaint', label: 'Service Quality Complaint' },
    { value: 'cancellation_request', label: 'Cancellation Request' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'other', label: 'Other Issue' },
];

export default function DisputeManagement() {
    const { t } = useTranslation();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [disputeFeedbacks, setDisputeFeedbacks] = useState<DisputeFeedback[]>([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
    const [interventionNote, setInterventionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDisputes = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const response = await api.get('/disputes/admin/all');
            setDisputes(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch disputes:', err);
            if (showLoader) toast.error('Failed to load disputes');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes(true);
    }, []);

    // Silent background refresh every 30s — no loading flash
    useEffect(() => {
        const interval = setInterval(() => fetchDisputes(false), 30000);
        return () => clearInterval(interval);
    }, []);

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

    const handleIntervene = (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setInterventionNote('');
        setShowInterventionModal(true);
    };

    const submitIntervention = async () => {
        if (!selectedDispute || !interventionNote.trim()) {
            toast.error('Please provide an intervention note');
            return;
        }

        setSubmitting(true);
        try {
            const disputeId = selectedDispute.id || selectedDispute._id;
            await api.patch(`/disputes/${disputeId}/admin-intervene`, {
                interventionNote: interventionNote.trim(),
            });
            toast.success('Intervention recorded successfully');
            setShowInterventionModal(false);
            setSelectedDispute(null);
            setInterventionNote('');
            fetchDisputes(true);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to record intervention';
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

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'text-gray-600 dark:text-gray-400',
            medium: 'text-yellow-600 dark:text-yellow-400',
            high: 'text-orange-600 dark:text-orange-400',
            urgent: 'text-red-600 dark:text-red-400',
        };
        return colors[priority] || colors.medium;
    };

    const getDisputeId = (dispute: Dispute) => dispute.id || dispute._id || '';

    const filteredDisputes = disputes.filter(d => {
        const statusMatch = filter === 'all' || d.status === filter;
        const priorityMatch = priorityFilter === 'all' || d.priority === priorityFilter;
        return statusMatch && priorityMatch;
    });

    // Statistics
    const stats = {
        total: disputes.length,
        pending: disputes.filter(d => d.status === 'pending').length,
        underReview: disputes.filter(d => d.status === 'under_review').length,
        resolved: disputes.filter(d => d.status === 'resolved').length,
        urgent: disputes.filter(d => d.priority === 'urgent').length,
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('disputeManagement.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('disputeManagement.subtitle')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => fetchDisputes(true)} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {t('disputeManagement.refresh')}
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card hoverable={true} className="cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold opacity-90">{t('disputeManagement.totalDisputes')}</p>
                                <p className="text-3xl font-bold mt-2">{stats.total}</p>
                                <p className="text-xs opacity-80 mt-1">{t('disputeManagement.activeIssues')}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card hoverable={true} className="cursor-pointer bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold opacity-90">{t('disputeManagement.pending')}</p>
                                <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                                <p className="text-xs opacity-80 mt-1">{t('disputeManagement.waitingReview')}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card hoverable={true} className="cursor-pointer bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold opacity-90">{t('disputeManagement.underReview')}</p>
                                <p className="text-3xl font-bold mt-2">{stats.underReview}</p>
                                <p className="text-xs opacity-80 mt-1">{t('disputeManagement.inProcess')}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card hoverable={true} className="cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold opacity-90">{t('disputeManagement.resolved')}</p>
                                <p className="text-3xl font-bold mt-2">{stats.resolved}</p>
                                <p className="text-xs opacity-80 mt-1">{t('disputeManagement.successfullyClosed')}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card hoverable={true} className="cursor-pointer bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold opacity-90">Urgent</p>
                                <p className="text-3xl font-bold mt-2">{stats.urgent}</p>
                                <p className="text-xs opacity-80 mt-1">Need immediate action</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('disputeManagement.status')}:</p>
                    <div className="flex gap-2">
                        {['all', 'pending', 'under_review', 'resolved', 'rejected', 'closed'].map((status) => (
                            <Button key={status} variant={filter === status ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(status)}>
                                {status === 'all' ? t('disputeManagement.all') :
                                    status === 'pending' ? t('disputeManagement.pending') :
                                        status === 'under_review' ? t('disputeManagement.underReview') :
                                            status === 'resolved' ? t('disputeManagement.resolved') :
                                                status === 'rejected' ? t('disputeManagement.rejected') :
                                                    t('disputeManagement.closed')}
                            </Button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('disputeManagement.priority')}:</p>
                    <div className="flex gap-2">
                        {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
                            <Button key={priority} variant={priorityFilter === priority ? 'primary' : 'outline'} size="sm" onClick={() => setPriorityFilter(priority)}>
                                {priority === 'all' ? t('disputeManagement.all') :
                                    priority === 'low' ? t('disputeManagement.low') :
                                        priority === 'medium' ? t('disputeManagement.medium') :
                                            priority === 'high' ? t('disputeManagement.high') :
                                                t('disputeManagement.urgent')}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size="lg" />
                </div>
            ) : filteredDisputes.length === 0 ? (
                <Alert variant="info">
                    No disputes found matching the selected filters.
                </Alert>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredDisputes.map((dispute) => {
                        const disputeId = getDisputeId(dispute);
                        return (
                            <Card key={disputeId} hoverable={true} className="cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-800">
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {dispute.garage?.name}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                                                    {dispute.status.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(dispute.priority)}`}>
                                                    {dispute.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('disputeManagement.customer')}: {dispute.user?.name} | {t('disputeManagement.service')}: {dispute.reservation?.serviceType}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('disputeManagement.type')}</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {DISPUTE_TYPES.find(t => t.value === dispute.type)?.label || dispute.type}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('disputeManagement.filedOn')}</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('disputeManagement.reason')}</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {dispute.reason}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button variant="primary" size="sm" onClick={() => handleViewDetails(dispute)}>
                                            {t('disputeManagement.viewDetails')}
                                        </Button>
                                        {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                                            <Button variant="outline" size="sm" onClick={() => handleIntervene(dispute)}>
                                                {t('disputeManagement.takeAction')}
                                            </Button>
                                        )}
                                        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedDispute(null);
                    setDisputeFeedbacks([]);
                }}
                title={t('disputeManagement.detailsTitle')}
                size="lg"
            >
                {selectedDispute && (
                    <div className="space-y-6">
                        {/* Full dispute information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dispute Information</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedDispute.status)}`}>
                                            {selectedDispute.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Priority</p>
                                        <p className={`text-sm font-semibold ${getPriorityColor(selectedDispute.priority)}`}>
                                            {selectedDispute.priority.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Customer</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.user?.name}
                                        {selectedDispute.user?.phone && ` - ${selectedDispute.user.phone}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Garage</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedDispute.garage?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{selectedDispute.garage?.address}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Description</p>
                                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                        {selectedDispute.description}
                                    </p>
                                </div>
                                {selectedDispute.resolutionNote && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Resolution</p>
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
                                    <Alert variant="info">No feedback submitted yet.</Alert>
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
                                                        <span className="ml-1 text-sm font-medium">{feedback.rating}/5</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDispute(null);
                                    setDisputeFeedbacks([]);
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Intervention Modal */}
            <Modal
                isOpen={showInterventionModal}
                onClose={() => {
                    setShowInterventionModal(false);
                    setSelectedDispute(null);
                    setInterventionNote('');
                }}
                title="Admin Intervention"
                size="md"
            >
                {selectedDispute && (
                    <div className="space-y-4">
                        <Alert variant="info">
                            Record your intervention or guidance for this dispute. This will be visible to both parties.
                        </Alert>

                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong>Dispute:</strong> {selectedDispute.reason}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Between:</strong> {selectedDispute.user?.name} and {selectedDispute.garage?.name}
                            </p>
                        </div>

                        <div className="space-y-1.5 w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Intervention Note</label>
                            <textarea
                                rows={5}
                                placeholder="Provide guidance, mediation, or resolution instructions..."
                                value={interventionNote}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInterventionNote(e.target.value)}
                                disabled={submitting}
                                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInterventionModal(false);
                                    setSelectedDispute(null);
                                    setInterventionNote('');
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={submitIntervention}
                                isLoading={submitting}
                                disabled={submitting || !interventionNote.trim()}
                            >
                                Submit Intervention
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}


