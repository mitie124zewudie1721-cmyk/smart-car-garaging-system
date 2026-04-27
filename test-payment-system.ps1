# Test Payment System
# This script tests the payment API endpoints

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Payment System Test Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"

# Step 1: Login as car owner
Write-Host "Step 1: Login as car owner..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
    username = "carowner1"
    password = "carowner123"
} | ConvertTo-Json) -ContentType "application/json"

if ($loginResponse.success) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit
}

# Step 2: Get user's reservations
Write-Host ""
Write-Host "Step 2: Getting reservations..." -ForegroundColor Yellow
try {
    $reservations = Invoke-RestMethod -Uri "$baseUrl/reservations/my" -Method Get -Headers $headers
    
    if ($reservations.data.Count -eq 0) {
        Write-Host "✗ No reservations found. Please create a booking first." -ForegroundColor Red
        Write-Host ""
        Write-Host "To create a booking:" -ForegroundColor Cyan
        Write-Host "1. Login as car owner" -ForegroundColor White
        Write-Host "2. Go to Find Garage" -ForegroundColor White
        Write-Host "3. Book a service" -ForegroundColor White
        Write-Host "4. Login as garage owner and confirm the booking" -ForegroundColor White
        exit
    }
    
    Write-Host "✓ Found $($reservations.data.Count) reservation(s)" -ForegroundColor Green
    
    # Find a confirmed reservation that's not paid
    $unpaidReservation = $reservations.data | Where-Object { 
        $_.status -eq "confirmed" -and $_.paymentStatus -ne "paid" 
    } | Select-Object -First 1
    
    if ($null -eq $unpaidReservation) {
        Write-Host ""
        Write-Host "Looking for any confirmed reservation..." -ForegroundColor Yellow
        $unpaidReservation = $reservations.data | Where-Object { 
            $_.status -eq "confirmed" 
        } | Select-Object -First 1
    }
    
    if ($null -eq $unpaidReservation) {
        Write-Host "✗ No confirmed reservations found" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available reservations:" -ForegroundColor Cyan
        foreach ($res in $reservations.data) {
            Write-Host "  - ID: $($res._id)" -ForegroundColor White
            Write-Host "    Status: $($res.status)" -ForegroundColor White
            Write-Host "    Payment: $($res.paymentStatus)" -ForegroundColor White
            Write-Host "    Price: $($res.totalPrice) ETB" -ForegroundColor White
            Write-Host ""
        }
        Write-Host "Please confirm a booking first (login as garage owner)" -ForegroundColor Yellow
        exit
    }
    
    Write-Host ""
    Write-Host "Selected reservation:" -ForegroundColor Cyan
    Write-Host "  ID: $($unpaidReservation._id)" -ForegroundColor White
    Write-Host "  Status: $($unpaidReservation.status)" -ForegroundColor White
    Write-Host "  Payment Status: $($unpaidReservation.paymentStatus)" -ForegroundColor White
    Write-Host "  Price: $($unpaidReservation.totalPrice) ETB" -ForegroundColor White
    
} catch {
    Write-Host "✗ Failed to get reservations: $_" -ForegroundColor Red
    exit
}

# Step 3: Initiate payment
Write-Host ""
Write-Host "Step 3: Initiating payment..." -ForegroundColor Yellow
try {
    $paymentData = @{
        reservationId = $unpaidReservation._id
        amount = $unpaidReservation.totalPrice
        paymentMethod = "cash"
    } | ConvertTo-Json
    
    $paymentResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method Post -Headers $headers -Body $paymentData
    
    if ($paymentResponse.success) {
        Write-Host "✓ Payment initiated successfully" -ForegroundColor Green
        Write-Host "  Payment ID: $($paymentResponse.data._id)" -ForegroundColor White
        Write-Host "  Transaction ID: $($paymentResponse.data.transactionId)" -ForegroundColor White
        Write-Host "  Status: $($paymentResponse.data.status)" -ForegroundColor White
        $paymentId = $paymentResponse.data._id
    } else {
        Write-Host "✗ Payment initiation failed" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "✗ Failed to initiate payment: $_" -ForegroundColor Red
    exit
}

# Step 4: Verify payment
Write-Host ""
Write-Host "Step 4: Verifying payment..." -ForegroundColor Yellow
try {
    $verifyData = @{
        paymentId = $paymentId
        status = "success"
    } | ConvertTo-Json
    
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/payments/verify" -Method Post -Headers $headers -Body $verifyData
    
    if ($verifyResponse.success) {
        Write-Host "✓ Payment verified successfully" -ForegroundColor Green
        Write-Host "  Status: $($verifyResponse.data.status)" -ForegroundColor White
        Write-Host "  Payment Date: $($verifyResponse.data.paymentDate)" -ForegroundColor White
    } else {
        Write-Host "✗ Payment verification failed" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "✗ Failed to verify payment: $_" -ForegroundColor Red
    exit
}

# Step 5: Get payment status
Write-Host ""
Write-Host "Step 5: Getting payment status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/payments/$paymentId" -Method Get -Headers $headers
    
    if ($statusResponse.success) {
        Write-Host "✓ Payment status retrieved" -ForegroundColor Green
        Write-Host "  Payment ID: $($statusResponse.data._id)" -ForegroundColor White
        Write-Host "  Amount: $($statusResponse.data.amount) ETB" -ForegroundColor White
        Write-Host "  Method: $($statusResponse.data.paymentMethod)" -ForegroundColor White
        Write-Host "  Status: $($statusResponse.data.status)" -ForegroundColor White
        Write-Host "  Transaction ID: $($statusResponse.data.transactionId)" -ForegroundColor White
    } else {
        Write-Host "✗ Failed to get payment status" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Failed to get payment status: $_" -ForegroundColor Red
}

# Step 6: Get all user payments
Write-Host ""
Write-Host "Step 6: Getting all user payments..." -ForegroundColor Yellow
try {
    $allPayments = Invoke-RestMethod -Uri "$baseUrl/payments/my-payments" -Method Get -Headers $headers
    
    if ($allPayments.success) {
        Write-Host "✓ Found $($allPayments.count) payment(s)" -ForegroundColor Green
        foreach ($payment in $allPayments.data) {
            Write-Host ""
            Write-Host "  Payment ID: $($payment._id)" -ForegroundColor White
            Write-Host "  Amount: $($payment.amount) ETB" -ForegroundColor White
            Write-Host "  Method: $($payment.paymentMethod)" -ForegroundColor White
            Write-Host "  Status: $($payment.status)" -ForegroundColor White
            Write-Host "  Date: $($payment.paymentDate)" -ForegroundColor White
        }
    } else {
        Write-Host "✗ Failed to get payments" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Failed to get payments: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Payment System Test Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check frontend: http://localhost:5173" -ForegroundColor White
Write-Host "2. Login as car owner" -ForegroundColor White
Write-Host "3. Go to My Reservations" -ForegroundColor White
Write-Host "4. Click 'Pay Now' on confirmed booking" -ForegroundColor White
Write-Host "5. Select payment method and confirm" -ForegroundColor White
Write-Host "6. Check notification as garage owner" -ForegroundColor White
Write-Host ""
