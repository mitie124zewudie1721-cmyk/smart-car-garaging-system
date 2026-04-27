# Garage Owner Payment Verification Guide

## Current Status
The garage owner's Bookings page (`frontend/src/pages/GarageOwner/Bookings.tsx`) currently shows booking details but does NOT have payment verification functionality yet.

## Where to Add Payment Verification

### Option 1: Add "View Payment" Button (Recommended)
Add a button next to "View Details" that shows payment information and allows verification.

### Option 2: Add Payment Section in Details Modal
Extend the existing "View Details" modal to include a payment section at the bottom.

## What Needs to be Added

### 1. Fetch Payment Data
Add an API call to get payment information for a booking:
```typescript
const fetchPaymentForBooking = async (reservationId: string) => {
    try {
        const response = await api.get(`/payments/reservation/${reservationId}`);
        return response.data.data;
    } catch (err) {
        // No payment found yet
        return null;
    }
};
```

### 2. Payment Verification Button
For completed bookings with pending payments, show:
```typescript
{booking.status === 'completed' && hasPayment && payment.status === 'pending' && (
    <Button
        variant="success"
        size="sm"
        onClick={() => handleVerifyPayment(paymentId)}
    >
        Confirm Payment Received
    </Button>
)}
```

### 3. Payment Details Display
Show payment information:
- Payment Method (Cash, Telebirr, CBE Birr, Bank Transfer)
- Amount
- Status (Pending, Success, Failed)
- Transaction ID
- Payment Date (if verified)

### 4. Verify Payment API Call
```typescript
const handleVerifyPayment = async (paymentId: string) => {
    try {
        await api.patch(`/payments/${paymentId}/verify`, {
            status: 'success'
        });
        toast.success('Payment verified successfully');
        fetchBookings(); // Refresh
    } catch (err) {
        toast.error('Failed to verify payment');
    }
};
```

## Backend API Endpoints Needed

### 1. Get Payment by Reservation
```
GET /api/payments/reservation/:reservationId
```

### 2. Verify Payment
```
PATCH /api/payments/:paymentId/verify
Body: { status: 'success' }
```

## Implementation Steps

1. Add payment state to Bookings component
2. Fetch payment data when viewing booking details
3. Add "View Payment" or payment section in modal
4. Add "Confirm Payment" button for pending payments
5. Implement verify payment handler
6. Test the flow:
   - Car owner makes payment
   - Garage owner sees payment in booking details
   - Garage owner confirms payment received
   - Payment status updates to "success"

## Quick Implementation

Would you like me to:
1. Add the payment verification feature to the Bookings page?
2. Create a separate "Payments" page for garage owners?
3. Add payment receipt generation (PDF)?

Let me know and I'll implement it for you!
