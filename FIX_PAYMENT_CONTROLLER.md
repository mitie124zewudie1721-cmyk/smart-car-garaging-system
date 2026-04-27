# Fix Payment Controller - Action Required

## Problem
The payment controller file got corrupted during editing. The `export default` statement is in the wrong place.

## Solution
The file needs to be manually fixed or restored from backup.

### Option 1: Restore from Git
```bash
cd backend
git checkout src/controllers/paymentController.js
```

### Option 2: Manual Fix
The file `backend/src/controllers/paymentController.js.backup` has been created.

You need to add these two functions BEFORE the `export default` statement:

```javascript
/**
 * Get payment for a specific reservation
 */
export const getPaymentByReservation = async (req, res, next) => {
    try {
        const { reservationId } = req.params;

        const payment = await Payment.findOne({ reservation: reservationId })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'No payment found for this reservation',
            });
        }

        const reservation = await Reservation.findById(reservationId).populate('garage');
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        const isOwner = payment.user._id.toString() === req.user.id;
        const isGarageOwner = reservation.garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment',
            });
        }

        return res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        logger.error('Get payment by reservation failed', { error: error.message });
        next(error);
    }
};

/**
 * Verify payment as garage owner
 */
export const garageVerifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate({
            path: 'reservation',
            populate: { path: 'garage user' }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        const isGarageOwner = payment.reservation.garage.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isGarageOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only garage owner can verify payments',
            });
        }

        payment.status = 'success';
        payment.paymentDate = new Date();
        payment.isVerified = true;
        payment.verifiedAt = new Date();
        if (!payment.metadata) payment.metadata = {};
        payment.metadata.verifiedBy = req.user.id;
        payment.metadata.verificationMethod = 'manual_garage_owner';

        await payment.save();

        await Reservation.findByIdAndUpdate(payment.reservation._id, {
            paymentStatus: 'paid',
        });

        try {
            await createNotification({
                recipient: payment.reservation.user._id,
                title: 'Payment Confirmed',
                message: `Your payment of ${payment.totalAmount} ETB has been confirmed by ${payment.reservation.garage.name}`,
                type: 'payment_confirmed',
                actionUrl: `/my-reservations`,
            });
        } catch (notifError) {
            logger.error('Failed to create payment confirmation notification', { error: notifError.message });
        }

        logger.info(`Payment verified by garage owner: ${payment._id}`);

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: payment,
        });
    } catch (error) {
        logger.error('Garage payment verification failed', { error: error.message });
        next(error);
    }
};
```

Then update the export default to include them:
```javascript
export default {
    initiatePayment,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
    getPaymentByReservation,
    garageVerifyPayment,
};
```

## Quick Fix Command
If you have git:
```bash
cd backend
git checkout src/controllers/paymentController.js
```

Then manually add the two functions above before the export statement.

## Status
- Payment routes: ✅ Ready
- Payment controller: ❌ Needs manual fix
- Frontend: ⏳ Waiting for backend fix
