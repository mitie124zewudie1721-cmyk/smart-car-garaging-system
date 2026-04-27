# Direct check of garage status via garage owner

$baseUrl = "http://localhost:5002/api"

Write-Host "Checking garage status..." -ForegroundColor Cyan
Write-Host ""

# Login as garage owner
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
    username = "garageowner"
    password = "garageowner123"
} | ConvertTo-Json)

$headers = @{
    "Authorization" = "Bearer $($login.token)"
}

# Get garages
$response = Invoke-RestMethod -Uri "$baseUrl/garages/my" -Method GET -Headers $headers

Write-Host "Total garages: $($response.count)" -ForegroundColor Yellow
Write-Host ""

if ($response.count -eq 0) {
    Write-Host "NO GARAGES FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to add a garage first:" -ForegroundColor Yellow
    Write-Host "  1. Login as garage owner" -ForegroundColor White
    Write-Host "  2. Go to 'Add Garage' page" -ForegroundColor White
    Write-Host "  3. Fill in garage details" -ForegroundColor White
    Write-Host "  4. Submit" -ForegroundColor White
} else {
    foreach ($garage in $response.data) {
        Write-Host "Garage: $($garage.name)" -ForegroundColor White
        Write-Host "  ID: $($garage._id)" -ForegroundColor Gray
        Write-Host "  Status: $($garage.verificationStatus)" -ForegroundColor $(if ($garage.verificationStatus -eq "approved") { "Green" } else { "Yellow" })
        Write-Host "  Active: $($garage.isActive)" -ForegroundColor $(if ($garage.isActive) { "Green" } else { "Red" })
        Write-Host "  Available Slots: $($garage.availableSlots)" -ForegroundColor Cyan
        Write-Host "  Capacity: $($garage.capacity)" -ForegroundColor Cyan
        Write-Host "  Location: $($garage.location.address)" -ForegroundColor Gray
        
        if ($garage.location.coordinates) {
            Write-Host "  Coordinates: [$($garage.location.coordinates[0]), $($garage.location.coordinates[1])]" -ForegroundColor Gray
        } else {
            Write-Host "  Coordinates: MISSING!" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    # Count by status
    $approved = ($response.data | Where-Object { $_.verificationStatus -eq "approved" }).Count
    $pending = ($response.data | Where-Object { $_.verificationStatus -eq "pending" }).Count
    $rejected = ($response.data | Where-Object { $_.verificationStatus -eq "rejected" }).Count
    
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Approved: $approved" -ForegroundColor Green
    Write-Host "  Pending: $pending" -ForegroundColor Yellow
    Write-Host "  Rejected: $rejected" -ForegroundColor Red
}
