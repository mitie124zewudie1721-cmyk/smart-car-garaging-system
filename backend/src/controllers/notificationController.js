// src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendNotificationEmail } from '../services/emailService.js';
import { sendNotificationSMS } from '../services/smsService.js';

/**
 * Get all notifications for current user
 */
export const getMyNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { recipient: req.user.id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false,
        });

        return res.status(200).set('Cache-Control', 'no-cache, no-store, must-revalidate').json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get notifications failed', { error: error.message });
        next(error);
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false,
        });

        return res.status(200).set('Cache-Control', 'no-cache, no-store, must-revalidate').json({
            success: true,
            count,
        });
    } catch (error) {
        logger.error('Get unread count failed', { error: error.message });
        next(error);
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        logger.error('Mark as read failed', { error: error.message });
        next(error);
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        logger.error('Mark all as read failed', { error: error.message });
        next(error);
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        logger.error('Delete notification failed', { error: error.message });
        next(error);
    }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (req, res, next) => {
    try {
        const result = await Notification.deleteMany({
            recipient: req.user.id,
            isRead: true,
        });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} notifications deleted`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        logger.error('Delete all read failed', { error: error.message });
        next(error);
    }
};

/**
 * Test email + SMS sending for a specific user (admin only)
 * POST /api/notifications/test-send
 * Body: { userId } — if omitted, sends to the logged-in admin
 */
export const testSendNotification = async (req, res, next) => {
    try {
        const targetId = req.body.userId || req.user.id;
        const user = await User.findById(targetId).select('name email phone').lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const results = { email: null, sms: null };

        if (user.email) {
            results.email = await sendNotificationEmail({
                to: user.email,
                userName: user.name || 'User',
                title: 'Test Notification',
                message: 'This is a test notification from Smart Garaging. Email notifications are working correctly!',
                type: 'system',
                actionUrl: `${process.env.CLIENT_URL}/dashboard`,
            });
        } else {
            results.email = { success: false, message: 'User has no email address' };
        }

        if (user.phone) {
            results.sms = await sendNotificationSMS(
                user.phone,
                'Test Notification',
                'This is a test SMS from Smart Garaging. SMS notifications are working!'
            );
        } else {
            results.sms = { success: false, message: 'User has no phone number' };
        }

        logger.info(`Test notification sent to user ${targetId}: email=${results.email?.success}, sms=${results.sms?.success}`);

        return res.json({
            success: true,
            user: { name: user.name, email: user.email, phone: user.phone },
            results,
        });
    } catch (error) {
        logger.error('Test notification failed', { error: error.message });
        next(error);
    }
};

/**
 * Create notification (internal use) — also sends email + SMS
 */
export const createNotification = async (data) => {
    try {
        const notification = await Notification.create(data);
        logger.info(`Notification created: ${notification._id} for user ${data.recipient}`);

        // Fire email + SMS in background (don't block the caller)
        setImmediate(async () => {
            try {
                const user = await User.findById(data.recipient).select('name email phone').lean();
                if (!user) return;

                const userName = user.name || 'User';

                // Send email if user has one
                if (user.email) {
                    sendNotificationEmail({
                        to: user.email,
                        userName,
                        title: data.title,
                        message: data.message,
                        type: data.type,
                        actionUrl: data.actionUrl
                            ? `${process.env.CLIENT_URL}${data.actionUrl}`
                            : null,
                    }).catch(err => logger.error('Email send error:', err.message));
                }

                // Send SMS if user has a phone number
                if (user.phone) {
                    sendNotificationSMS(user.phone, data.title, data.message)
                        .catch(err => logger.error('SMS send error:', err.message));
                }
            } catch (err) {
                logger.error('Failed to send email/SMS for notification:', err.message);
            }
        });

        return notification;
    } catch (error) {
        logger.error('Create notification failed', { error: error.message, data });
        throw error;
    }
};

/**
 * Create bulk notifications (internal use)
 */
export const createBulkNotifications = async (notifications) => {
    try {
        const result = await Notification.insertMany(notifications);
        logger.info(`${result.length} notifications created`);
        return result;
    } catch (error) {
        logger.error('Create bulk notifications failed', { error: error.message });
        throw error;
    }
};

export default {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    createNotification,
    createBulkNotifications,
    testSendNotification,
};
