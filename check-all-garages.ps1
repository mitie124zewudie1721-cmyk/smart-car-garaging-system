# Check All Garages in Database
# Diagnoses why search returns 0 garages

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHECKING ALL GARAGES IN DATABASE" -ForegroundColor Cyan
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
    Write-Host "✓ Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to login as admin" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check pending garages
Write-Host "Checking PENDING garages..." -ForegroundColor Yellow
try {
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $pendingResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/pending" -Method GET -Headers $adminHeaders
    
    Write-Host "Pending garages: $($pendingResponse.count)" -ForegroundColor $(if ($pendingResponse.count -gt 0) { "Yellow" } else { "Gray" })
    
    if ($pendingResponse.count -gt 0) {
        foreach ($garage in $pendingResponse.data) {
            Write-Host "  • $($garage.name)" -ForegroundColor White
            Write-Host "    Status: $($garage.verificationStatus)" -ForegroundColor Yellow
            Write-Host "    Location: $($garage.location.address)" -ForegroundColor Gray
            Write-Host "    Coordinates: [$($garage.location.coordinates[0]), $($garage.location.coordinates[1])]" -ForegroundColor Gray
            Write-Host "    Available Slots: $($garage.availableSlots)" -ForegroundColor Gray
            Write-Host "    Active: $($garage.isActive)" -ForegroundColor Gray
            Write-Host ""
        }
    }
} catch {
    Write-Host "✗ Error checking pending garages: $_" -ForegroundColor Red
}

Write-Host ""

# Login as garage owner to check their garages
Write-Host "Checking garage owner's garages..." -ForegroundColor Yellow
try {
    $ownerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        username = "garageowner"
        password = "garageowner123"
    } | ConvertTo-Json)
    
    $ownerToken = $ownerLogin.token
    $ownerHeaders = @{
        "Authorization" = "Bearer $ownerToken"
    }
    
    $myGaragesResponse = Invoke-RestMethod -Uri "$baseUrl/garages/my" -Method GET -Headers $ownerHeaders
    
    Write-Host "Total garages owned: $($myGaragesResponse.count)" -ForegroundColor Cyan
    
    if ($myGaragesResponse.count -gt 0) {
        foreach ($garage in $myGaragesResponse.data) {
            Write-Host ""
            Write-Host "  Garage: $($garage.name)" -ForegroundColor White
            Write-Host "  Status: $($garage.verificationStatus)" -ForegroundColor $(if ($garage.verificationStatus -eq "approved") { "Green" } elseif ($garage.verificationStatus -eq "pending") { "Yellow" } else { "Red" })
            Write-Host "  Location: $($garage.location.address)" -ForegroundColor Gray
            
            if ($garage.location.coordinates) {
                Write-Host "  Coordinates: [$($garage.location.coordinates[0]), $($garage.location.coordinates[1])]" -ForegroundColor Gray
            } else {
                Write-Host "  Coordinates: MISSING!" -ForegroundColor Red
            }
            
            Write-Host "  Available Slots: $($garage.availableSlots)" -ForegroundColor Gray
            Write-Host "  Capacity: $($garage.capacity)" -ForegroundColor Gray
            Write-Host "  Active: $($garage.isActive)" -ForegroundColor Gray
            Write-Host "  ID: $($garage._id)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  No garages found!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking garage owner's garages: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Count approved garages
$approvedCount = 0
if ($myGaragesResponse.data) {
    $approvedCount = ($myGaragesResponse.data | Where-Object { $_.verificationStatus -eq "approved" }).Count
}

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Pending: $($pendingResponse.count)" -ForegroundColor Yellow
Write-Host "  Approved: $approvedCount" -ForegroundColor Green
Write-Host ""

if ($pendingResponse.count -gt 0) {
    Write-Host "ISSUE: Garages are PENDING, not APPROVED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Green
    Write-Host "  Run: .\approve-all-garages.ps1" -ForegroundColor Cyan
} elseif ($approvedCount -eq 0) {
    Write-Host "ISSUE: No garages exist in database!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Green
    Write-Host "  1. Login as garage owner" -ForegroundColor White
    Write-Host "  2. Add a garage" -ForegroundColor White
    Write-Host "  3. Login as admin and approve it" -ForegroundColor White
} elseif ($approvedCount -gt 0) {
    Write-Host "ISSUE: Garages exist and are approved, but search fails!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "  1. availableSlots = 0 (search requires > 0)" -ForegroundColor Gray
    Write-Host "  2. isActive = false" -ForegroundColor Gray
    Write-Host "  3. Coordinates are invalid or missing" -ForegroundColor Gray
    Write-Host "  4. Geospatial index not created" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check the garage details above for issues!" -ForegroundColor Cyan
}

Write-Host ""
