// src/routes/userRoutes.js
import express from 'express';
import { z } from 'zod';

import userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { uploadAvatar, uploadReceipt, handleUploadError } from '../middlewares/uploadMiddleware.js';

// Helper: create a Payment record for registration fee
async function createRegFeePaymentRecord(userId, txRef, amount, chapaRef) {
    try {
        const Payment = (await import('../models/Payment.js')).default;
        const existing = await Payment.findOne({ transactionId: txRef });
        if (existing) return;
        await Payment.create({
            user: userId,
            amount,
            paymentMethod: 'telebirr',
            paymentProvider: 'chapa',
            status: 'success',
            transactionId: txRef,
            chapaRef: chapaRef || txRef,
            isVerified: true,
            verifiedAt: new Date(),
            description: 'Platform Registration Fee',
            metadata: { type: 'registration_fee', chapaInitiated: true },
        });
    } catch (e) {
        console.error('Failed to create reg fee payment record:', e.message);
    }
}

// ────────────────────────────────────────────────
// Zod validation schemas
// ────────────────────────────────────────────────
const updateProfileSchema = {
    body: z.object({
        name: z.string().min(2).max(100).trim().optional(),
        phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format').trim().optional(),
        email: z.string().email('Invalid email format').trim().optional().or(z.literal('')),
        profilePicture: z.string().optional(),
        carType: z.string().trim().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    }),
};

const getAllUsersSchema = {
    query: z.object({
        page: z.coerce.number()
            .int('Page must be a number')
            .min(1, 'Page must be at least 1')
            .default(1)
            .optional(),
        limit: z.coerce.number()
            .int('Limit must be a number')
            .min(5, 'Limit minimum 5')
            .max(100, 'Limit maximum 100')
            .default(20)
            .optional(),
        role: z.enum(['car_owner', 'garage_owner', 'admin'])
            .optional(),
        search: z.string()
            .trim()
            .optional(), // search by name or email
        isActive: z.coerce.boolean()
            .optional(),
    }).optional(),
};

const userIdParamSchema = {
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB user ID')
            .optional(),
    }),
};

// ────────────────────────────────────────────────
// Router setup
// ────────────────────────────────────────────────
const router = express.Router();

// All user routes require authentication
router.use(protect);

// ── Routes for the currently authenticated user ──
router.get('/profile', userController.getProfile);

router.put(
    '/profile',
    validate(updateProfileSchema),
    userController.updateProfile
);

router.post(
    '/profile/avatar',
    uploadAvatar,
    handleUploadError,
    userController.uploadAvatar
);

// ── Admin-only routes ──
router.get(
    '/',
    restrictTo('admin'),
    validate(getAllUsersSchema),
    userController.getAllUsers
);

router.delete(
    '/:id',
    restrictTo('admin'),
    validate(userIdParamSchema),
    userController.deleteUser
);

// Optional future routes (uncomment when needed)
// router.get('/:id', protect, restrictTo('admin'), userController.getUserById);
// router.patch('/:id/role', restrictTo('admin'), userController.changeUserRole);

// ── Agreement routes ──
router.get('/agreement', async (req, res) => {
    try {
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne({ singleton: 'main' });
        const agreement = settings?.agreement || { content: '', version: 1 };
        // Check if user has accepted current version
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.user.id).select('agreementAccepted agreementVersion');
        return res.json({
            success: true,
            data: {
                ...agreement.toObject?.() || agreement,
                userAccepted: user?.agreementAccepted && user?.agreementVersion >= (agreement.version || 1),
            }
        });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/agreement/accept', async (req, res) => {
    try {
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne({ singleton: 'main' });
        const version = settings?.agreement?.version || 1;
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(req.user.id, {
            agreementAccepted: true,
            agreementAcceptedAt: new Date(),
            agreementVersion: version,
        });
        return res.json({ success: true, message: 'Agreement accepted' });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── Registration fee routes (garage owners) ──
router.get('/registration-fee/status', async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.user.id).select('registrationFeePaid registrationFeePaidAt registrationFeeSubmission role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({
            success: true,
            data: {
                isPaid: user.registrationFeePaid || false,
                paidAt: user.registrationFeePaidAt || null,
                role: user.role,
                submission: user.registrationFeeSubmission || null,
            }
        });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/registration-fee/pay', restrictTo('garage_owner'), uploadReceipt, handleUploadError, async (req, res) => {
    try {
        const { paymentMethod, transactionRef } = req.body;
        // Save uploaded receipt path if provided
        const receiptPath = req.file ? `/uploads/commission-receipts/${req.file.filename}` : (req.body.receiptPath || '');
        if (!paymentMethod) return res.status(400).json({ success: false, message: 'Payment method is required' });
        const User = (await import('../models/User.js')).default;

        if (paymentMethod === 'cash') {
            // Cash: submit for admin approval, not auto-approved
            await User.findByIdAndUpdate(req.user.id, {
                registrationFeeSubmission: {
                    paymentMethod: 'cash',
                    transactionRef: transactionRef || '',
                    receiptPath: req.body.receiptPath || '',
                    submittedAt: new Date(),
                    status: 'pending',
                }
            });
            // Notify admins
            const admins = await User.find({ role: 'admin' }).select('_id');
            const { createNotification } = await import('../controllers/notificationController.js');
            await Promise.all(admins.map(a => createNotification({
                recipient: a._id,
                title: 'Registration Fee Submitted',
                message: `Garage owner ${req.user.username || req.user.id} submitted a cash registration fee payment. Please verify and approve.`,
                type: 'system_announcement',
                actionUrl: '/admin/users',
            })));
            return res.json({ success: true, message: 'Payment submitted. Admin will verify your cash payment and activate your account.', data: { isPaid: false, status: 'pending' } });
        } else {
            // Bank transfer: require transaction ref
            if (!transactionRef?.trim()) {
                return res.status(400).json({ success: false, message: 'Transaction reference is required for bank transfers' });
            }
            await User.findByIdAndUpdate(req.user.id, {
                registrationFeeSubmission: {
                    paymentMethod,
                    transactionRef: transactionRef.trim(),
                    receiptPath: req.body.receiptPath || '',
                    submittedAt: new Date(),
                    status: 'pending',
                }
            });
            // Notify admins
            const admins = await User.find({ role: 'admin' }).select('_id');
            const { createNotification } = await import('../controllers/notificationController.js');
            await Promise.all(admins.map(a => createNotification({
                recipient: a._id,
                title: 'Registration Fee Submitted',
                message: `Garage owner submitted ${paymentMethod} payment (ref: ${transactionRef}). Please verify and approve.`,
                type: 'system_announcement',
                actionUrl: '/admin/users',
            })));
            return res.json({ success: true, message: 'Payment submitted for verification. Admin will review and activate your account within 24 hours.', data: { isPaid: false, status: 'pending' } });
        }
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── Chapa: initiate registration fee payment ──
router.post('/registration-fee/chapa-initiate', restrictTo('garage_owner'), async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.user.id).select('name email username phone registrationFeePaid');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.registrationFeePaid) return res.status(400).json({ success: false, message: 'Already paid' });

        // Get fee amount from platform settings
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne();
        const amount = settings?.registrationFee || 600;

        const { initializeChapaPayment } = await import('../services/chapaService.js');
        const txRef = `REG-${req.user.id.slice(-8)}-${Date.now()}`;
        const nameParts = (user.name || 'Garage Owner').split(' ');

        // Build a valid email — Chapa requires a real email format
        const safeUsername = (user.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const fallbackEmail = `${safeUsername}@smartgaraging.et`;

        const result = await initializeChapaPayment({
            amount,
            email: user.email || fallbackEmail,
            firstName: nameParts[0] || 'Garage',
            lastName: nameParts[1] || 'Owner',
            txRef,
            callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5002'}/api/users/registration-fee/chapa-webhook`,
            returnUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/registration-fee?payment=success&txRef=${txRef}`,
            customization: { title: 'Smart Garaging Registration Fee', description: `One-time registration fee — ${amount} ETB` },
        });

        if (!result.success) return res.status(400).json({ success: false, message: result.message });

        // Store txRef on user for verification
        await User.findByIdAndUpdate(req.user.id, {
            'registrationFeeSubmission.chapaRef': txRef,
            'registrationFeeSubmission.status': 'chapa_pending',
            'registrationFeeSubmission.paymentMethod': 'chapa',
            'registrationFeeSubmission.transactionRef': txRef,
            'registrationFeeSubmission.submittedAt': new Date(),
        });

        return res.json({ success: true, checkoutUrl: result.checkoutUrl, txRef });
    } catch (e) {
        console.error('Chapa reg fee error:', e.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Chapa: webhook/callback for registration fee ──
router.get('/registration-fee/chapa-webhook', async (req, res) => {
    try {
        const txRef = req.query.trx_ref || req.query.tx_ref;
        if (!txRef) return res.redirect(`${process.env.CLIENT_URL}/registration-fee?payment=failed`);

        const { verifyChapaTransaction } = await import('../services/chapaService.js');
        const verification = await verifyChapaTransaction(txRef);
        if (!verification.success || verification.status !== 'success') {
            return res.redirect(`${process.env.CLIENT_URL}/registration-fee?payment=failed&txRef=${txRef}`);
        }

        const User = (await import('../models/User.js')).default;
        const user = await User.findOne({ 'registrationFeeSubmission.chapaRef': txRef });
        if (user && !user.registrationFeePaid) {
            const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
            const settings = await PlatformSettings.findOne();
            const amount = settings?.registrationFee || 600;

            await User.findByIdAndUpdate(user._id, {
                registrationFeePaid: true,
                registrationFeePaidAt: new Date(),
                'registrationFeeSubmission.status': 'approved',
            });
            // Create Payment record so it shows in payment history
            await createRegFeePaymentRecord(user._id, txRef, amount, verification.chapaRef);
            // Notify the garage owner
            try {
                const { createNotification } = await import('../utils/notificationHelper.js');
                await createNotification({
                    recipient: user._id,
                    title: '✅ Registration Fee Paid via Chapa',
                    message: 'Your registration fee has been verified automatically. You can now add your garage!',
                    type: 'system_announcement',
                    actionUrl: '/add-garage',
                });
            } catch { /* non-critical */ }
        }
        return res.redirect(`${process.env.CLIENT_URL}/registration-fee?payment=success&txRef=${txRef}`);
    } catch (e) {
        res.redirect(`${process.env.CLIENT_URL}/registration-fee?payment=failed`);
    }
});

// ── Chapa: admin verify registration fee for a specific user ──
router.get('/registration-fee/chapa-verify-admin/:userId/:txRef', restrictTo('admin'), async (req, res) => {
    try {
        const { userId, txRef } = req.params;
        const { verifyChapaTransaction } = await import('../services/chapaService.js');
        const verification = await verifyChapaTransaction(txRef);
        if (!verification.success || verification.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment not confirmed by Chapa' });
        }
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(userId, {
            registrationFeePaid: true,
            registrationFeePaidAt: new Date(),
            'registrationFeeSubmission.status': 'approved',
            'registrationFeeSubmission.reviewedBy': req.user.id,
            'registrationFeeSubmission.reviewedAt': new Date(),
        });
        // Create Payment record
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne();
        await createRegFeePaymentRecord(userId, txRef, settings?.registrationFee || 600, verification.chapaRef);
        // Notify garage owner
        try {
            const { createNotification } = await import('../utils/notificationHelper.js');
            await createNotification({
                recipient: userId,
                title: '✅ Registration Fee Verified',
                message: 'Your Chapa payment has been verified by admin. You can now add your garage!',
                type: 'system_announcement',
                actionUrl: '/add-garage',
            });
        } catch { /* non-critical */ }
        return res.json({ success: true, message: 'Chapa payment verified — user activated' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});
// ── Chapa: manual verify registration fee ──
router.get('/registration-fee/chapa-verify/:txRef', restrictTo('garage_owner'), async (req, res) => {
    try {
        const { txRef } = req.params;
        const { verifyChapaTransaction } = await import('../services/chapaService.js');
        const verification = await verifyChapaTransaction(txRef);
        if (!verification.success || verification.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment not confirmed yet' });
        }
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(req.user.id, {
            registrationFeePaid: true,
            registrationFeePaidAt: new Date(),
            'registrationFeeSubmission.status': 'approved',
        });
        // Create Payment record
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne();
        await createRegFeePaymentRecord(req.user.id, txRef, settings?.registrationFee || 600, verification.chapaRef);
        return res.json({ success: true, message: 'Registration fee verified and account activated!' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

export default router;