// src/routes/adminRoutes.js
import express from 'express';
import adminController from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { strictLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);

// Platform accounts GET is accessible to authenticated users (garage owners need it for payment info)
router.get('/platform-accounts', adminController.getPlatformAccounts);

router.use(restrictTo('admin'));

// Get system statistics
router.get('/stats', adminController.getSystemStats);

// Get all users
router.get('/users', adminController.getAllUsers);

// Update user status
router.patch('/users/:id/status', adminController.updateUserStatus);

// Change user role
router.patch('/users/:id/role', adminController.changeUserRole);

// Delete user (soft delete → trash)
router.delete('/users/:id', strictLimiter, adminController.deleteUser);

// Delete garage (soft delete → trash)
router.delete('/garages/:id', strictLimiter, adminController.deleteGarage);

// Registration fee management
router.get('/registration-fees/pending', adminController.getPendingFees);
router.patch('/registration-fees/:userId/approve', adminController.approveFee);
router.patch('/registration-fees/:userId/reject', adminController.rejectFee);

// Trash management
router.get('/trash', adminController.getTrash);
router.patch('/trash/users/:id/restore', adminController.restoreUser);
router.delete('/trash/users/:id/permanent', adminController.permanentDeleteUser);
router.patch('/trash/garages/:id/restore', adminController.restoreGarage);
router.delete('/trash/garages/:id/permanent', adminController.permanentDeleteGarage);

// Get analytics data
router.get('/analytics/:type/:period', adminController.getAnalytics);

// Get performance insights
router.get('/performance-insights', adminController.getPerformanceInsights);

// Garage verification routes
router.get('/garages/pending', adminController.getPendingGarages);
router.patch('/garages/:id/approve', adminController.approveGarage);
router.patch('/garages/:id/reject', adminController.rejectGarage);

// Garage management routes
router.get('/garages/:garageId/stats', adminController.getGarageStats);
router.get('/garages/:garageId/reservations', adminController.getGarageReservations);

// Platform accounts
router.get('/platform-accounts', adminController.getPlatformAccounts);
router.put('/platform-accounts', adminController.updatePlatformAccounts);

// Agreement management
router.get('/agreement', adminController.getAgreement);
router.put('/agreement', adminController.updateAgreement);

// Commission management routes
router.get('/commission', adminController.getCommissionSettings);
router.patch('/commission/default', adminController.setDefaultCommission);
router.patch('/commission/garage/:id', adminController.setGarageCommission);
router.get('/commission/payments', adminController.getCommissionPayments);
router.patch('/commission/payments/:garageId/mark-paid', adminController.markCommissionPaid);

// Payout management routes
router.get('/payouts', adminController.getPayouts);
router.patch('/payouts/:garageId/mark-sent', adminController.markPayoutSent);

// Commission reminder
router.post('/commission/payments/:garageId/remind', adminController.sendCommissionReminder);

// Penalty management
router.get('/commission/penalty-settings', adminController.getPenaltySettings);
router.patch('/commission/penalty-settings', adminController.updatePenaltySettings);
router.post('/commission/payments/:garageId/apply-penalty', adminController.applyPenalty);
router.post('/commission/recalculate-penalties', adminController.recalculatePenalties);
router.delete('/commission/payments/:garageId/remove-penalty', adminController.removePenalty);

export default router;
