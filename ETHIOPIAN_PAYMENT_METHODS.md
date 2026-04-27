# Ethiopian Payment Methods Implementation

## Supported Payment Methods

Your system now supports all major Ethiopian payment methods:

### 1. Telebirr 📱
**Payment Method**: `telebirr`
**Type**: Mobile Money
**Status**: Integration ready (placeholder implementation)

```javascript
// Usage
{
  "reservationId": "...",
  "paymentMethod": "telebirr"
}
```

**How it works:**
- User selects Telebirr
- System creates payment record
- Status set to 'processing'
- Awaits Telebirr API integration

### 2. Commercial Bank of Ethiopia (CBE Birr) 🏦
**Payment Method**: `cbe_birr`
**Type**: Bank Transfer / Mobile Banking
**Status**: Manual verification

```javascript
// Usage
{
  "reservationId": "...",
  "paymentMethod": "cbe_birr"
}
```

**How it works:**
- User selects CBE Birr
- System creates payment with 'pending' status
- User transfers money to garage account
- Garage owner verifies and confirms payment

### 3. Abysinia Bank 🏦
**Payment Method**: `abyssinia_bank`
**Type**: Bank Transfer
**Status**: Manual verification

```javascript
// Usage
{
  "reservationId": "...",
  "paymentMethod": "abyssinia_bank"
}
```

**How it works:**
- User selects Abysinia Bank
- System creates payment with 'pending' status
- User transfers money to garage account
- Garage owner verifies and confirms payment

### 4. Cash 💵
**Payment Method**: `cash`
**Type**: Physical Cash
**Status**: Manual verification

```javascript
// Usage
{
  "reservationId": "...",
  "paymentMethod": "cash"
}
```

**How it works:**
- User selects Cash
- System creates payment with 'pending' status
- User pays cash at garage
- Garage owner confirms payment received

---

## Payment Flow for Each Method

### Telebirr Flow
```
1. User clicks "Pay with Telebirr"
2. POST /api/payments/initiate { paymentMethod: "telebirr" }
3. System creates payment (status: processing)
4. [Future] Redirect to Telebirr payment page
5. [Future] Telebirr webhook confirms payment
6. System updates status to 'success'
7. Notification sent to user and garage
```

### Bank Transfer Flow (CBE / Abysinia)
```
1. User clicks "Pay with CBE Birr" or "Pay with Abysinia Bank"
2. POST /api/payments/initiate { paymentMethod: "cbe_birr" }
3. System creates payment (status: pending)
4. System displays:
   - Garage bank account details
   - Payment reference number
   - Amount to transfer
5. User transfers money via bank
6. User uploads transfer receipt (optional)
7. Garage owner verifies payment
8. POST /api/payments/verify { paymentId, status: "success" }
9. System updates payment status
10. Notification sent to user
```

### Cash Flow
```
1. User clicks "Pay with Cash"
2. POST /api/payments/initiate { paymentMethod: "cash" }
3. System creates payment (status: pending)
4. System displays:
   - Payment reference number
   - Amount to pay
   - Garage location
5. User goes to garage and pays cash
6. Garage owner confirms payment received
7. POST /api/payments/verify { paymentId, status: "success" }
8. System updates payment status
9. Notification sent to user
```

---

## Backend Implementation

### Payment Model (Already Configured)

```javascript
paymentMethod: {
  type: String,
  enum: [
    'telebirr',        // ✅ Telebirr
    'cbe_birr',        // ✅ CBE Birr
    'abyssinia_bank',  // ✅ Abysinia Bank
    'cash',            // ✅ Cash
    'chapa',           // Chapa gateway
    'bank_transfer',   // Generic bank
    'mobile_money',    // Generic mobile
    'mpesa'            // M-Pesa
  ],
  required: true
}
```

### Payment Service (Already Implemented)

The `paymentService.initiatePayment()` handles all methods:

```javascript
// For Telebirr
if (paymentMethod === 'telebirr') {
    result = await this.initiateTelebirrPayment(payment, user);
}

// For Cash, CBE, Abysinia
else if (['cash', 'cbe_birr', 'abyssinia_bank', 'bank_transfer'].includes(paymentMethod)) {
    payment.status = 'pending';
    payment.description = `${paymentMethod} payment - awaiting confirmation`;
    await payment.save();
}
```

---

## Frontend Implementation Needed

### 1. Payment Method Selection

```tsx
const paymentMethods = [
  { value: 'telebirr', label: 'Telebirr', icon: '📱' },
  { value: 'cbe_birr', label: 'CBE Birr', icon: '🏦' },
  { value: 'abyssinia_bank', label: 'Abysinia Bank', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' }
];

<select onChange={(e) => setPaymentMethod(e.target.value)}>
  {paymentMethods.map(method => (
    <option key={method.value} value={method.value}>
      {method.icon} {method.label}
    </option>
  ))}
</select>
```

### 2. Payment Instructions Display

```tsx
{paymentMethod === 'cbe_birr' && (
  <div className="payment-instructions">
    <h3>CBE Birr Payment Instructions</h3>
    <p>Account Number: {garage.cbeAccount}</p>
    <p>Account Name: {garage.name}</p>
    <p>Amount: {totalAmount} ETB</p>
    <p>Reference: {transactionId}</p>
  </div>
)}

{paymentMethod === 'cash' && (
  <div className="payment-instructions">
    <h3>Cash Payment Instructions</h3>
    <p>Please pay {totalAmount} ETB at the garage</p>
    <p>Location: {garage.location}</p>
    <p>Reference: {transactionId}</p>
  </div>
)}
```

### 3. Payment Verification (Garage Owner)

```tsx
const verifyPayment = async (paymentId) => {
  await api.post('/payments/verify', {
    paymentId,
    status: 'success'
  });
};

<button onClick={() => verifyPayment(payment.id)}>
  Confirm Payment Received
</button>
```

---

## API Endpoints

### Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer {token}

{
  "reservationId": "6645c12e9d8c3f0c7c2d1234",
  "paymentMethod": "telebirr" | "cbe_birr" | "abyssinia_bank" | "cash"
}

Response:
{
  "success": true,
  "data": {
    "payment": {
      "id": "...",
      "amount": 500,
      "serviceFee": 12.5,
      "tax": 75,
      "totalAmount": 587.5,
      "paymentMethod": "cbe_birr",
      "status": "pending",
      "transactionId": "TXN-..."
    }
  }
}
```

### Verify Payment (Garage Owner / Admin)
```http
POST /api/payments/verify
Authorization: Bearer {token}

{
  "paymentId": "6645d45e9d8c3f0c7c2d5678",
  "status": "success"
}

Response:
{
  "success": true,
  "message": "Payment status updated",
  "data": {
    "id": "...",
    "status": "success",
    "paymentDate": "2026-03-06T10:30:00Z"
  }
}
```

---

## Testing

### Test Telebirr Payment
```powershell
curl -X POST http://localhost:5002/api/payments/initiate `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "reservationId": "RESERVATION_ID",
    "paymentMethod": "telebirr"
  }'
```

### Test CBE Birr Payment
```powershell
curl -X POST http://localhost:5002/api/payments/initiate `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "reservationId": "RESERVATION_ID",
    "paymentMethod": "cbe_birr"
  }'
```

### Test Cash Payment
```powershell
curl -X POST http://localhost:5002/api/payments/initiate `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "reservationId": "RESERVATION_ID",
    "paymentMethod": "cash"
  }'
```

---

## Next Steps

1. ✅ Payment methods configured in model
2. ✅ Payment service handles all methods
3. ⚠️ Add Telebirr API integration
4. ⚠️ Add bank account fields to Garage model
5. ⚠️ Implement frontend payment method selection
6. ⚠️ Implement payment instructions display
7. ⚠️ Implement garage owner payment verification UI

---

## Garage Model Updates Needed

Add bank account fields to Garage model:

```javascript
// In Garage model
bankAccounts: {
  cbe: {
    accountNumber: String,
    accountName: String
  },
  abyssinia: {
    accountNumber: String,
    accountName: String
  }
}
```

This allows each garage to have their own bank accounts for receiving payments.
