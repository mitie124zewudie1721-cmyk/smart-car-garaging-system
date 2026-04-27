# Approve All Pending Garages
# Quick fix to approve all garages at once

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  APPROVE ALL PENDING GARAGES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"

# Login as admin
Write-Host "Logging in as admin..." -ForegroundColor Yellow
try {
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json)
    
    $adminToken = $adminLogin.token
    Write-Host "[OK] Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to login as admin" -ForegroundColor Red
    Write-Host "Make sure backend is running and admin account exists" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get pending garages
Write-Host "Fetching pending garages..." -ForegroundColor Yellow
try {
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $pendingResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/pending" -Method GET -Headers $adminHeaders
    
    $pendingCount = $pendingResponse.count
    Write-Host "Found $pendingCount pending garage(s)" -ForegroundColor Cyan
    
    if ($pendingCount -eq 0) {
        Write-Host ""
        Write-Host "No pending garages to approve!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor Yellow
        Write-Host "  1. All garages are already approved" -ForegroundColor Gray
        Write-Host "  2. No garages have been added yet" -ForegroundColor Gray
        Write-Host ""
        Write-Host "To add a garage:" -ForegroundColor Cyan
        Write-Host "  1. Login as garage owner (username: garageowner, password: garageowner123)" -ForegroundColor White
        Write-Host "  2. Go to 'Add Garage' page" -ForegroundColor White
        Write-Host "  3. Fill in garage details and submit" -ForegroundColor White
        exit 0
    }
    
    Write-Host ""
    Write-Host "Garages to approve:" -ForegroundColor Cyan
    foreach ($garage in $pendingResponse.data) {
        Write-Host "  - $($garage.name) - Owner: $($garage.owner.username)" -ForegroundColor White
    }
    
} catch {
    Write-Host "[ERROR] Error fetching pending garages: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Approve each garage
Write-Host "Approving garages..." -ForegroundColor Yellow
$approvedCount = 0
$failedCount = 0

foreach ($garage in $pendingResponse.data) {
    try {
        $approveResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/$($garage._id)/approve" -Method PATCH -Headers $adminHeaders
        
        Write-Host "[OK] Approved: $($garage.name)" -ForegroundColor Green
        $approvedCount++
    } catch {
        Write-Host "[ERROR] Failed to approve: $($garage.name)" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total pending: $pendingCount" -ForegroundColor White
Write-Host "Approved: $approvedCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($approvedCount -gt 0) {
    Write-Host "[SUCCESS] Garages approved!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Approved garages will now appear in search results!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Login as car owner" -ForegroundColor White
    Write-Host "  2. Go to 'Find Garage' page" -ForegroundColor White
    Write-Host "  3. Search for garages" -ForegroundColor White
    Write-Host "  4. You should now see the approved garages!" -ForegroundColor White
} else {
    Write-Host "[ERROR] No garages were approved" -ForegroundColor Red
}

Write-Host ""
