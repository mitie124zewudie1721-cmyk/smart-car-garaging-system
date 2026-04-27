// src/routes/paymentRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadReceipt, handleUploadError } from '../middlewares/uploadMiddleware.js';
import {
    initiatePayment,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
    getPaymentByReservation,
    garageVerifyPayment,
    getMyEarnings,
    getMyWallet,
    notifyAdminCommissionPaid,
    getAllPayments,
    getGarageOwnerPayments,
    initiateChapaPayment,
    chapaWebhook,
    verifyChapaPaymentManual,
    requestWithdrawal,
    processWithdrawal,
    getWithdrawals,
    markWithdrawalCompleted,
    getAdminRefunds,
    markRefunded,
} from '../controllers/paymentController.js';

const router = express.Router();

// ── Public routes (no auth needed) ──
router.post('/chapa/webhook', chapaWebhook);
router.get('/chapa/webhook', chapaWebhook);

router.use(protect);

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);
router.get('/my-earnings', getMyEarnings);
router.get('/my-wallet', getMyWallet);
router.post('/notify-commission-paid', uploadReceipt, handleUploadError, notifyAdminCommissionPaid);
router.get('/my-payments', getMyPayments);
router.get('/my', getMyPayments);
router.get('/garage-payments', restrictTo('garage_owner'), getGarageOwnerPayments);
router.get('/admin/all', restrictTo('admin'), getAllPayments);

// ── Chapa routes ──
router.post('/chapa/initiate', initiateChapaPayment);
router.get('/chapa/verify/:txRef', verifyChapaPaymentManual);

// ── Platform accounts ──
router.get('/platform-accounts', (req, res) => {
    res.json({
        success: true,
        data: {
            telebirr: { phone: process.env.PLATFORM_TELEBIRR, name: process.env.PLATFORM_TELEBIRR_NAME },
            cbe: { account: process.env.PLATFORM_CBE_ACCOUNT, name: process.env.PLATFORM_CBE_NAME },
            abyssinia: { account: process.env.PLATFORM_ABYSSINIA_ACCOUNT, name: process.env.PLATFORM_ABYSSINIA_NAME },
        },
    });
});

// ── Withdrawal routes ──
router.post('/withdrawal/request', restrictTo('garage_owner'), requestWithdrawal);
router.get('/withdrawal', getWithdrawals);
router.patch('/withdrawal/:withdrawalId/process', restrictTo('admin'), processWithdrawal);
router.patch('/withdrawal/:withdrawalId/mark-completed', restrictTo('admin'), markWithdrawalCompleted);

// ── Refund management (admin) — MUST be before /:id ──
router.get('/admin/refunds', restrictTo('admin'), getAdminRefunds);
router.patch('/admin/refunds/:paymentId/mark-refunded', restrictTo('admin'), markRefunded);

router.get('/reservation/:reservationId', getPaymentByReservation);
router.patch('/:paymentId/garage-verify', garageVerifyPayment);
router.get('/:id', getPaymentStatus);

export default router;
