# Debug Garage Search Issue
# Checks why no garages are found

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GARAGE SEARCH DEBUG SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"

# Step 1: Login as admin
Write-Host "Step 1: Login as admin..." -ForegroundColor Yellow
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

# Step 2: Check all garages in database
Write-Host "Step 2: Checking all garages in database..." -ForegroundColor Yellow
try {
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    # Get pending garages
    $pendingResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/pending" -Method GET -Headers $adminHeaders
    
    Write-Host "Pending garages: $($pendingResponse.count)" -ForegroundColor Yellow
    
    if ($pendingResponse.count -gt 0) {
        Write-Host ""
        Write-Host "FOUND THE PROBLEM!" -ForegroundColor Red
        Write-Host "You have $($pendingResponse.count) garage(s) waiting for approval!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Garages in PENDING status:" -ForegroundColor Yellow
        foreach ($garage in $pendingResponse.data) {
            Write-Host "  • $($garage.name) - Owner: $($garage.owner.username)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Green
        Write-Host "  1. Login as admin" -ForegroundColor White
        Write-Host "  2. Go to 'Garage Verification' page" -ForegroundColor White
        Write-Host "  3. Approve the garages" -ForegroundColor White
        Write-Host ""
        Write-Host "OR run this command to approve all:" -ForegroundColor Green
        Write-Host "  .\approve-all-garages.ps1" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "No pending garages found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "PROBLEM: No garages exist in database!" -ForegroundColor Red
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Green
        Write-Host "  1. Login as garage owner" -ForegroundColor White
        Write-Host "  2. Add a garage" -ForegroundColor White
        Write-Host "  3. Login as admin and approve it" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Error checking garages: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Try to search for garages
Write-Host "Step 3: Testing garage search..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/garages/search" -Method POST -ContentType "application/json" -Body (@{
        lat = 9.0320
        lng = 38.7469
        radius = 100
    } | ConvertTo-Json)
    
    Write-Host "Search returned: $($searchResponse.data.Count) garages" -ForegroundColor $(if ($searchResponse.data.Count -gt 0) { "Green" } else { "Red" })
    
    if ($searchResponse.data.Count -eq 0) {
        Write-Host ""
        Write-Host "CONFIRMED: No approved garages in search results" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Search failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEBUG COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
