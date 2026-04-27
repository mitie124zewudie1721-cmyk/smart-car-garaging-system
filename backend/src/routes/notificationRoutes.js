// src/routes/notificationRoutes.js
import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get my notifications
router.get('/', notificationController.getMyNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all read notifications
router.delete('/read/all', notificationController.deleteAllRead);

// Test email + SMS for the logged-in user (admin only)
router.post('/test-send', restrictTo('admin'), notificationController.testSendNotification);

export default router;
