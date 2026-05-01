// src/pages/Admin/Users.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import { useTranslation } from 'react-i18next';

interface User {
    _id: string;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    role: 'car_owner' | 'garage_owner' | 'admin';
    isActive: boolean;
    createdAt: string;
}

interface FeeSubmission {
    _id: string;
    name: string;
    username: string;
    phone?: string;
    email?: string;
    registrationFeeSubmission: {
        paymentMethod: string;
        transactionRef?: string;
        chapaRef?: string;
        receiptPath?: string;
        submittedAt: string;
        status: string;
        rejectionReason?: string;
    };
}

export default function Users() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'users' | 'fees'>('users');
    const [pendingFees, setPendingFees] = useState<FeeSubmission[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/users', {
                params: filter !== 'all' ? { role: filter } : {},
            });
            setUsers(response.data.data || []);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load users';
            setError(message);
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchPendingFees = async () => {
        setFeesLoading(true);
        try {
            const r = await api.get('/admin/registration-fees/pending');
            setPendingFees(r.data.data || []);
        } catch { toast.error('Failed to load pending fees'); }
        finally { setFeesLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'fees') fetchPendingFees();
    }, [activeTab]);

    const handleApproveFee = async (userId: string) => {
        try {
            await api.patch(`/admin/registration-fees/${userId}/approve`);
            toast.success('Fee approved — user can now add garages');
            fetchPendingFees();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const handleVerifyChapaFee = async (userId: string, txRef: string) => {
        try {
            const r = await api.get(`/users/registration-fee/chapa-verify-admin/${userId}/${txRef}`);
            if (r.data.success) {
                toast.success('✅ Chapa payment verified — user activated!');
                fetchPendingFees();
            } else {
                toast.error('Payment not confirmed by Chapa yet');
            }
        } catch (e: any) {
            // If Chapa can't verify, allow manual approve
            toast.error(e.response?.data?.message || 'Chapa verification failed — use manual approve');
        }
    };

    const handleRejectFee = async (userId: string) => {
        if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
        try {
            await api.patch(`/admin/registration-fees/${userId}/reject`, { reason: rejectReason });
            toast.success('Fee rejected — user notified');
            setRejectingId(null); setRejectReason('');
            fetchPendingFees();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            toast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully`);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleOpenRoleModal = (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const handleChangeRole = async () => {
        if (!selectedUser || !newRole) return;

        if (newRole === selectedUser.role) {
            toast.error('Please select a different role');
            return;
        }

        try {
            await api.patch(`/admin/users/${selectedUser._id}/role`, { role: newRole });
            toast.success(`User role changed to ${newRole.replace('_', ' ')} successfully`);
            setShowRoleModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change user role');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'garage_owner':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'car_owner':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">👥 {t('users.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('users.subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab('users')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    👥 {t('users.allUsers')}
                </button>
                <button onClick={() => setActiveTab('fees')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'fees' ? 'bg-amber-500 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    💳 {t('users.pendingFeePayments')}
                    {pendingFees.length > 0 && activeTab !== 'fees' && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingFees.length}</span>
                    )}
                </button>
            </div>

            {/* Pending Fees Tab */}
            {activeTab === 'fees' && (
                <div>
                    {feesLoading ? (
                        <div className="flex justify-center py-12"><Loader size="lg" /></div>
                    ) : pendingFees.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                            <p className="text-4xl mb-3">✅</p>
                            <p className="text-slate-500 font-medium">{t('users.noPendingFees')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingFees.map(u => {
                                const isChapa = u.registrationFeeSubmission.status === 'chapa_pending';
                                const txRef = u.registrationFeeSubmission.chapaRef || u.registrationFeeSubmission.transactionRef;
                                return (
                                    <div key={u._id} className={`bg-white rounded-2xl border p-5 shadow-sm ${isChapa ? 'border-teal-200' : 'border-slate-100'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-800 text-lg">{u.name}</p>
                                                    {isChapa && (
                                                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">⚡ Chapa</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">@{u.username} {u.phone && `· ${u.phone}`}</p>
                                                <div className="mt-2 space-y-1 text-sm">
                                                    <p><span className="text-slate-400">{t('users.method')}:</span> <span className="font-semibold capitalize">{isChapa ? 'Chapa (online)' : u.registrationFeeSubmission.paymentMethod}</span></p>
                                                    {txRef && (
                                                        <p><span className="text-slate-400">{t('users.ref')}:</span> <span className="font-mono font-semibold text-indigo-700">{txRef}</span></p>
                                                    )}
                                                    <p><span className="text-slate-400">{t('users.submitted')}:</span> {u.registrationFeeSubmission.submittedAt ? new Date(u.registrationFeeSubmission.submittedAt).toLocaleString() : 'N/A'}</p>
                                                </div>
                                                {(u.registrationFeeSubmission as any).receiptPath && (
                                                    <div className="mt-3">
                                                        <p className="text-xs text-slate-400 mb-1">📸 {t('users.receipt')}:</p>
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002'}${(u.registrationFeeSubmission as any).receiptPath}`}
                                                            alt="Payment receipt"
                                                            className="max-h-36 rounded-lg border border-slate-200 shadow-sm object-contain cursor-pointer hover:opacity-90 transition"
                                                            onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002'}${(u.registrationFeeSubmission as any).receiptPath}`, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {isChapa && txRef ? (
                                                    <>
                                                        <button onClick={() => handleVerifyChapaFee(u._id, txRef)}
                                                            className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition">
                                                            🔄 Verify Chapa
                                                        </button>
                                                        <button onClick={() => handleApproveFee(u._id)}
                                                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                                                            ✓ Manual Approve
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleApproveFee(u._id)}
                                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">
                                                        ✓ {t('users.approve')}
                                                    </button>
                                                )}
                                                <button onClick={() => setRejectingId(u._id)}
                                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition">
                                                    ✕ {t('users.reject')}
                                                </button>
                                            </div>
                                        </div>
                                        {rejectingId === u._id && (
                                            <div className="mt-4 border-t pt-4">
                                                <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                                    placeholder={t('users.rejectPlaceholder')}
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-2" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition">{t('users.cancel')}</button>
                                                    <button onClick={() => handleRejectFee(u._id)}
                                                        className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">{t('users.confirmReject')}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {['all', 'car_owner', 'garage_owner', 'admin'].map((role) => (
                            <Button key={role} variant={filter === role ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(role)}>
                                {role === 'all' ? t('users.allUsers') :
                                    role === 'car_owner' ? t('users.carOwner').toUpperCase() :
                                        role === 'garage_owner' ? t('users.garageOwner').toUpperCase() :
                                            t('users.admin').toUpperCase()}
                            </Button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader size="lg" />
                        </div>
                    ) : error ? (
                        <Alert variant="error">{error}</Alert>
                    ) : users.length === 0 ? (
                        <Alert variant="info">{t('users.noUsers')}</Alert>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.userCol')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.roleCol')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.contactCol')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.statusCol')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.actionsCol')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        @{user.username}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {user.phone || user.email || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}>
                                                    {user.isActive ? t('users.active') : t('users.suspended')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <Button variant="primary" size="sm" onClick={() => handleOpenRoleModal(user)}>
                                                    🔄 {t('users.changeRole')}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(user._id, user.isActive)}>
                                                    {user.isActive ? t('users.suspend') : t('users.activate')}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400">
                                                    {t('users.delete')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Role Change Modal */}
                    {showRoleModal && selectedUser && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
                                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                    {t('users.changeUserRole')}
                                </h3>
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('users.userCol')}</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {selectedUser.name} (@{selectedUser.username})
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1">{t('users.currentRole')}</p>
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                                        {selectedUser.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                        {t('users.newRole')}
                                    </label>
                                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="car_owner">{t('users.carOwner')}</option>
                                        <option value="garage_owner">{t('users.garageOwner')}</option>
                                        <option value="admin">{t('users.admin')}</option>
                                    </select>
                                </div>
                                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ <strong>{t('users.note')}:</strong> {t('users.roleWarning')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="primary" size="md" onClick={handleChangeRole} className="flex-1">
                                        {t('users.confirmChange')}
                                    </Button>
                                    <Button variant="secondary" size="md" onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="flex-1">
                                        {t('users.cancel')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )} {/* end users tab */}
        </div>
    );
}
