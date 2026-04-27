// src/components/layout/NotificationBell.tsx
import { useState, useEffect, useRef } from 'react';
import { Bell, Building2, CheckCircle, XCircle, AlertTriangle, CreditCard, MessageSquare, Info } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    priority: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications?limit=10');
            setNotifications(response.data.data || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark as read
    const markAsRead = async (notificationId: string) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId || n._id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notification.isRead) {
            markAsRead(notification.id || notification._id);
        }

        // Determine where to navigate
        let url = notification.actionUrl;

        // Fix bad/legacy actionUrls based on type
        if (!url || url === '/garage/dashboard' || url === '/garage/profile' || url === '/') {
            switch (notification.type) {
                case 'garage_approved':
                case 'garage_rejected':
                case 'garage_pending':
                    url = '/my-garages';
                    break;
                case 'dispute_created':
                case 'dispute_updated':
                case 'dispute_resolved':
                    url = '/disputes';
                    break;
                case 'payment_received':
                    url = '/my-reservations';
                    break;
                default:
                    url = '/dashboard';
            }
        }

        setIsOpen(false);
        setTimeout(() => navigate(url!), 50);
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Get icon + color per notification type
    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'garage_pending':
                return { icon: <Building2 size={16} />, color: 'text-amber-500' };
            case 'garage_approved':
                return { icon: <CheckCircle size={16} />, color: 'text-emerald-500' };
            case 'garage_rejected':
                return { icon: <XCircle size={16} />, color: 'text-red-500' };
            case 'dispute_created':
            case 'dispute_updated':
                return { icon: <AlertTriangle size={16} />, color: 'text-orange-500' };
            case 'dispute_resolved':
                return { icon: <CheckCircle size={16} />, color: 'text-emerald-500' };
            case 'payment_received':
                return { icon: <CreditCard size={16} />, color: 'text-indigo-500' };
            case 'feedback_received':
                return { icon: <MessageSquare size={16} />, color: 'text-violet-500' };
            default:
                return { icon: <Info size={16} />, color: 'text-blue-500' };
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-white hover:text-gray-200 dark:text-white dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                aria-label="Notifications"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id || notification._id}
                                    onClick={(e) => handleNotificationClick(notification, e)}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${!notification.isRead
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 flex-shrink-0 ${getTypeStyle(notification.type).color}`}>
                                            {getTypeStyle(notification.type).icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && unreadCount > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
