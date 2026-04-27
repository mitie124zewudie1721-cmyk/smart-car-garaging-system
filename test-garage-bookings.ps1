# Test Garage Owner Bookings Fix
# This script tests the new /reservations/garage-bookings endpoint

$baseUrl = "http://localhost:5002/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Garage Owner Bookings Fix" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login as garage owner
Write-Host "Step 1: Login as garage owner..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
    username = "garageowner"
    password = "garageowner123"
} | ConvertTo-Json) -ContentType "application/json" -SessionVariable session

$token = $loginResponse.token
Write-Host "✓ Logged in as garage owner" -ForegroundColor Green

# Step 2: Get garage bookings using new endpoint
Write-Host "`nStep 2: Fetching garage bookings..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $bookingsResponse = Invoke-RestMethod -Uri "$baseUrl/reservations/garage-bookings" -Method Get -Headers $headers
    
    Write-Host "✓ Successfully fetched bookings" -ForegroundColor Green
    Write-Host "`nTotal bookings found: $($bookingsResponse.data.Count)" -ForegroundColor Cyan
    
    if ($bookingsResponse.data.Count -gt 0) {
        Write-Host "`nBooking Details:" -ForegroundColor Cyan
        foreach ($booking in $bookingsResponse.data) {
            Write-Host "  - Garage: $($booking.garage.name)" -ForegroundColor White
            Write-Host "    Customer: $($booking.user.name)" -ForegroundColor White
            Write-Host "    Status: $($booking.status)" -ForegroundColor White
            Write-Host "    Price: $($booking.totalPrice) ETB" -ForegroundColor White
            Write-Host "    Start: $($booking.startTime)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "`nNo bookings found yet." -ForegroundColor Yellow
        Write-Host "This is normal if no car owner has made a reservation yet." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ Failed to fetch bookings" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
