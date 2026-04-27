# 💳 Payment System Implementation Guide

## Overview

Your system already has a payment infrastructure! This guide will help you implement and test the payment system with Ethiopian payment methods.

---

## 🏗️ Current Payment Infrastructure

### Payment Model (`backend/src/models/Payment.js`)

**Fields:**
- `reservation` - Link to reservation
- `user` - Car owner making payment
- `amount` - Payment amount in ETB
- `transactionId` - Unique transaction ID
- `paymentMethod` - Payment method used
- `status` - Payment status (pending, success, failed, refunded)
- `paymentDate` - When payment was made

**Payment Methods Supported:**
- ✅ **Chapa** - Ethiopian payment gateway
- ✅ **Telebirr** - Ethio Telecom mobile money
- ✅ **Cash** - Cash payment at garage
- ✅ **Bank Transfer** - Direct bank transfer
- ✅ **Mobile Money** - Other mobile money services

---

## 💰 Payment Flow

### Step 1: Car Owner Books Service
```
Car Owner → Find Garage → Book Service → Submit
Status: Pending
Payment: Not paid
```

### Step 2: Garage Owner Confirms
```
Garage Owner → Confirms Booking
Status: Confirmed
Payment: Still not paid
```

### Step 3: Car Owner Makes Payment
```
Car Owner → My Reservations → Pay Now
Selects payment method → Completes payment
Status: Confirmed
Payment: Paid
```

### Step 4: Service Completed
```
Garage Owner → Marks service as completed
Status: Completed
Payment: Paid
```

---

## 🔧 Implementation Options

### Option 1: Simple Cash/Manual Payment (Easiest)

**Best for:** Testing, MVP, small scale

**How it works:**
1. Car owner books service
2. Garage owner confirms
3. Car owner pays cash at garage
4. Garage owner marks payment as received
5. Service completed

**No integration needed!**

---

### Option 2: Chapa Payment Gateway (Recommended)

**Best for:** Production, online payments

**Chapa** is Ethiopia's leading payment gateway supporting:
- Credit/Debit cards
- Mobile money (Telebirr, M-Pesa, etc.)
- Bank transfers

**Integration steps:**
1. Sign up at https://chapa.co
2. Get API keys
3. Integrate Chapa SDK
4. Test with sandbox
5. Go live

---

### Option 3: Telebirr Direct Integration

**Best for:** Telebirr-only payments

**Telebirr** is Ethio Telecom's mobile money service

**Integration steps:**
1. Contact Ethio Telecom
2. Get merchant account
3. Get API credentials
4. Integrate API
5. Test and deploy

---

## 🚀 Quick Implementation (Cash Payment)

### Backend API Endpoints (Already Exist!)

```javascript
POST   /api/payments/initiate      - Initiate payment
POST   /api/payments/verify        - Verify payment
GET    /api/payments/:id           - Get payment status
GET    /api/payments/my-payments   - Get user's payments
```

---

### Frontend Implementation

#### 1. Add Payment Button to Reservations

**File:** `frontend/src/pages/CarOwner/MyReservations.tsx`

Add "Pay Now" button for confirmed reservations:

```typescript
{reservation.status === 'confirmed' && reservation.paymentStatus !== 'paid' && (
    <button
        onClick={() => handlePayment(reservation)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
        Pay Now
    </button>
)}
```

#### 2. Create Payment Modal

```typescript
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedReservation, setSelectedReservation] = useState(null);
const [paymentMethod, setPaymentMethod] = useState('cash');

const handlePayment = (reservation) => {
    setSelectedReservation(reservation);
    setShowPaymentModal(true);
};

const submitPayment = async () => {
    try {
        const response = await api.post('/payments/initiate', {
            reservationId: selectedReservation._id,
            amount: selectedReservation.totalPrice,
            paymentMethod: paymentMethod,
        });

        // For cash payment, immediately mark as success
        if (paymentMethod === 'cash') {
            await api.post('/payments/verify', {
                paymentId: response.data.data._id,
                status: 'success',
            });
        }

        toast.success('Payment initiated successfully');
        setShowPaymentModal(false);
        fetchReservations(); // Refresh list
    } catch (error) {
        toast.error('Payment failed');
    }
};
```

#### 3. Payment Modal UI

```typescript
{showPaymentModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Make Payment</h3>
            
            <div className="mb-4">
                <p className="text-gray-600">Amount to Pay:</p>
                <p className="text-2xl font-bold text-green-600">
                    {selectedReservation?.totalPrice} ETB
                </p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Payment Method
                </label>
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="cash">Cash at Garage</option>
                    <option value="chapa">Chapa (Card/Mobile Money)</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="bank_transfer">Bank Transfer</option>
                </select>
            </div>

            {paymentMethod === 'cash' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                        You will pay cash when you arrive at the garage.
                    </p>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={submitPayment}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Confirm Payment
                </button>
                <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}
```

---

## 📊 Payment Status Display

### Show Payment Status in Reservations

```typescript
const getPaymentStatusBadge = (status) => {
    const badges = {
        paid: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-blue-100 text-blue-800',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.pending}`}>
            {status || 'Not Paid'}
        </span>
    );
};

// In reservation card
<div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Payment:</span>
    {getPaymentStatusBadge(reservation.paymentStatus)}
</div>
```

---

## 🔐 Chapa Integration (Advanced)

### Step 1: Install Chapa SDK

```bash
npm install chapa
```

### Step 2: Configure Chapa

**File:** `backend/.env`

```env
CHAPA_SECRET_KEY=your_secret_key_here
CHAPA_PUBLIC_KEY=your_public_key_here
CHAPA_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 3: Create Chapa Service

**File:** `backend/src/services/chapaService.js`

```javascript
import { Chapa } from 'chapa';

const chapa = new Chapa(process.env.CHAPA_SECRET_KEY);

export const initiateChapaPayment = async (paymentData) => {
    try {
        const response = await chapa.initialize({
            amount: paymentData.amount,
            currency: 'ETB',
            email: paymentData.email,
            first_name: paymentData.firstName,
            last_name: paymentData.lastName,
            tx_ref: paymentData.transactionId,
            callback_url: `${process.env.CLIENT_URL}/payment/callback`,
            return_url: `${process.env.CLIENT_URL}/payment/success`,
            customization: {
                title: 'Smart Garaging Payment',
                description: `Payment for ${paymentData.serviceType}`,
            },
        });

        return {
            success: true,
            checkoutUrl: response.data.checkout_url,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

export const verifyChapaPayment = async (transactionId) => {
    try {
        const response = await chapa.verify(transactionId);
        return {
            success: true,
            status: response.data.status,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};
```

### Step 4: Update Payment Controller

```javascript
import { initiateChapaPayment, verifyChapaPayment } from '../services/chapaService.js';

export const initiatePayment = async (req, res, next) => {
    try {
        const { reservationId, amount, paymentMethod } = req.body;

        // ... existing validation ...

        const payment = await Payment.create({
            reservation: reservationId,
            user: req.user.id,
            amount,
            paymentMethod,
            status: 'pending',
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });

        // If Chapa payment, initiate with Chapa
        if (paymentMethod === 'chapa') {
            const chapaResult = await initiateChapaPayment({
                amount,
                email: req.user.email,
                firstName: req.user.name.split(' ')[0],
                lastName: req.user.name.split(' ')[1] || '',
                transactionId: payment.transactionId,
                serviceType: reservation.serviceType,
            });

            if (chapaResult.success) {
                return res.status(201).json({
                    success: true,
                    message: 'Payment initiated successfully',
                    data: payment,
                    checkoutUrl: chapaResult.checkoutUrl,
                });
            }
        }

        // For other methods (cash, bank transfer)
        return res.status(201).json({
            success: true,
            message: 'Payment initiated successfully',
            data: payment,
        });
    } catch (error) {
        logger.error('Payment initiation failed', { error: error.message });
        next(error);
    }
};
```

---

## 🧪 Testing Payment System

### Test 1: Cash Payment

1. **Car owner books service**
2. **Garage owner confirms**
3. **Car owner clicks "Pay Now"**
4. **Selects "Cash at Garage"**
5. **Confirms payment**
6. **Payment status: Pending → Success**

### Test 2: Check Payment Status

```powershell
# Get user's payments
curl http://localhost:5002/api/payments/my-payments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific payment
curl http://localhost:5002/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Payment Notifications

### Add to Reservation Controller

When payment is successful, notify garage owner:

```javascript
// In verifyPayment function
if (status === 'success') {
    await createNotification({
        recipient: garage.owner,
        title: 'Payment Received',
        message: `Payment of ${payment.amount} ETB received for ${reservation.serviceType}`,
        type: 'payment_received',
        actionUrl: `/garage/bookings/${reservation._id}`,
    });
}
```

---

## 💡 Payment Methods Comparison

| Method | Integration | Cost | Speed | Best For |
|--------|-------------|------|-------|----------|
| **Cash** | None | Free | Instant | Testing, MVP |
| **Chapa** | Medium | 2-3% | Instant | Production |
| **Telebirr** | Complex | 1-2% | Instant | Telebirr users |
| **Bank Transfer** | None | Free | 1-2 days | Large amounts |

---

## 🚀 Quick Start (Cash Payment)

### 1. Enable Payment Routes

**File:** `backend/src/index.js`

```javascript
import paymentRoutes from './routes/paymentRoutes.js';
app.use('/api/payments', paymentRoutes);
```

### 2. Create Payment Routes File

**File:** `backend/src/routes/paymentRoutes.js`

```javascript
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
    initiatePayment,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPaymentStatus);

export default router;
```

### 3. Test with Postman or curl

```bash
# Initiate payment
curl -X POST http://localhost:5002/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "RESERVATION_ID",
    "amount": 500,
    "paymentMethod": "cash"
  }'

# Verify payment
curl -X POST http://localhost:5002/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAYMENT_ID",
    "status": "success"
  }'
```

---

## 📊 Payment Dashboard (Future)

### For Garage Owners

- Total revenue
- Pending payments
- Completed payments
- Payment history
- Refund requests

### For Car Owners

- Payment history
- Pending payments
- Receipts
- Refund status

---

## ✅ Summary

### What You Have:

✅ Payment model (already exists)
✅ Payment controller (already exists)
✅ Multiple payment methods supported
✅ Payment status tracking
✅ Transaction ID generation

### What to Implement:

1. **Frontend payment UI** (modal, buttons)
2. **Payment routes** (connect controller to API)
3. **Payment notifications** (notify on payment)
4. **Payment gateway integration** (Chapa, Telebirr - optional)

### Quick Start:

1. Add payment routes to backend
2. Add "Pay Now" button to frontend
3. Create payment modal
4. Test with cash payment
5. Later: Integrate Chapa for online payments

**The payment infrastructure is ready! Just need to connect the UI!** 💳
