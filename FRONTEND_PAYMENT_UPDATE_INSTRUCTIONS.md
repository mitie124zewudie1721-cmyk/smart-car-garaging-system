# Frontend Payment Verification Update

## Summary
The backend API is ready. Now we need to update the frontend Bookings page to show payment information and allow garage owners to verify payments.

## Changes Needed in `frontend/src/pages/GarageOwner/Bookings.tsx`

### 1. Add Payment Interface
```typescript
interface Payment {
    _id: string;
    amount: number;
    totalAmount: number;
    paymentMethod: string;
    status: 'pending' | 'success' | 'failed';
    transactionId: string;
    paymentDate?: string;
    isVerified: boolean;
    verifiedAt?: string;
    user: {
        name: string;
        email: string;
        phone?: string;
    };
}
```

### 2. Add Payment State
```typescript
const [payments, setPayments] = useState<Record<string, Payment | null>>({});
const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
```

### 3. Add Fetch Payment Function
```typescript
const fetchPaymentForBooking = async (reservationId: string) => {
    try {
        const response = await api.get(`/payments/reservation/${reservationId}`);
        return response.data.data;
    } catch (err) {
        // No payment found
        return null;
    }
};
```

### 4. Load Payments When Viewing Details
```typescript
const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    
    // Fetch payment if not already loaded
    const bookingId = getBookingId(booking);
    if (!payments[bookingId] && booking.status === 'completed') {
        const payment = await fetchPaymentForBooking(bookingId);
        setPayments(prev => ({ ...prev, [bookingId]: payment }));
    }
};
```

### 5. Add Verify Payment Handler
```typescript
const handleVerifyPayment = async (paymentId: string) => {
    setPaymentLoading(paymentId);
    try {
        await api.patch(`/payments/${paymentId}/garage-verify`);
        toast.success('Payment verified successfully');
        fetchBookings(); // Refresh bookings
        setShowDetailsModal(false);
    } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to verify payment';
        toast.error(message);
    } finally {
        setPaymentLoading(null);
    }
};
```

### 6. Add Payment Section in Modal (After Appointment Details section)
```tsx
{/* Payment Information */}
{selectedBooking.status === 'completed' && (
    <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Payment Information
        </h4>
        {payments[getBookingId(selectedBooking)] ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        payments[getBookingId(selectedBooking)]!.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : payments[getBookingId(selectedBooking)]!.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                        {payments[getBookingId(selectedBooking)]!.status.toUpperCase()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Method:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {payments[getBookingId(selectedBooking)]!.paymentMethod.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {payments[getBookingId(selectedBooking)]!.totalAmount} ETB
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {payments[getBookingId(selectedBooking)]!.transactionId}
                    </span>
                </div>
                {payments[getBookingId(selectedBooking)]!.isVerified && (
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Verified:</span>
                        <span className="text-sm text-green-600 dark:text-green-400">
                            ✓ {new Date(payments[getBookingId(selectedBooking)]!.verifiedAt!).toLocaleDateString()}
                        </span>
                    </div>
                )}
                
                {/* Verify Payment Button */}
                {payments[getBookingId(selectedBooking)]!.status === 'pending' && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleVerifyPayment(payments[getBookingId(selectedBooking)]!._id)}
                            disabled={paymentLoading === payments[getBookingId(selectedBooking)]!._id}
                            fullWidth
                        >
                            {paymentLoading === payments[getBookingId(selectedBooking)]!._id 
                                ? 'Verifying...' 
                                : '✓ Confirm Payment Received'}
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    No payment initiated yet
                </p>
            </div>
        )}
    </div>
)}
```

## Implementation Approach

Due to the file size (567 lines), I recommend:

1. **Option A**: I can create a complete new version of the Bookings.tsx file with payment integration
2. **Option B**: I can create a separate PaymentVerification component that can be imported
3. **Option C**: You manually add the code snippets above to the existing file

Which approach would you prefer?

For now, the backend is ready and will work once the frontend is updated!
