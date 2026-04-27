# Fix: New Car Owner Cannot See Garages
# This script helps diagnose and fix the issue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX: NEW USER GARAGE SEARCH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"

Write-Host "Testing with NEW car owner account..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Register a new car owner
Write-Host "Step 1: Creating new car owner account..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "HHmmss"
$newUsername = "testcarowner$timestamp"
$newPassword = "test123"

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body (@{
        username = $newUsername
        password = $newPassword
        name = "Test Car Owner"
        role = "car_owner"
    } | ConvertTo-Json)
    
    Write-Host "✓ New account created" -ForegroundColor Green
    Write-Host "  Username: $newUsername" -ForegroundColor Gray
    Write-Host "  Password: $newPassword" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create account: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying to login with existing test account..." -ForegroundColor Yellow
    $newUsername = "testcarowner"
    $newPassword = "test123"
}

Write-Host ""

# Step 2: Login as new car owner
Write-Host "Step 2: Logging in as new car owner..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        username = $newUsername
        password = $newPassword
    } | ConvertTo-Json)
    
    $newUserToken = $loginResponse.token
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to login: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Search for garages as new user
Write-Host "Step 3: Searching for garages as NEW user..." -ForegroundColor Yellow
try {
    $newUserHeaders = @{
        "Authorization" = "Bearer $newUserToken"
        "Content-Type" = "application/json"
    }
    
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/garages/search" -Method POST -Headers $newUserHeaders -Body (@{
        lat = 9.0320
        lng = 38.7469
        radius = 100
    } | ConvertTo-Json)
    
    $garageCount = $searchResponse.data.Count
    Write-Host "Found: $garageCount garage(s)" -ForegroundColor $(if ($garageCount -gt 0) { "Green" } else { "Red" })
    
    if ($garageCount -eq 0) {
        Write-Host ""
        Write-Host "PROBLEM CONFIRMED: New user cannot see garages!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Checking if garages exist..." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "SUCCESS: New user CAN see garages!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Garages found:" -ForegroundColor Cyan
        foreach ($garage in $searchResponse.data) {
            Write-Host "  - $($garage.name) - $($garage.location.address)" -ForegroundColor White
        }
        exit 0
    }
} catch {
    Write-Host "Search failed: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Login as old car owner to compare
Write-Host "Step 4: Testing with OLD car owner account..." -ForegroundColor Yellow
try {
    $oldLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        username = "carowner"
        password = "carowner123"
    } | ConvertTo-Json)
    
    $oldUserToken = $oldLoginResponse.token
    Write-Host "✓ Logged in as old user" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to login as old user" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Search as old user
Write-Host "Step 5: Searching for garages as OLD user..." -ForegroundColor Yellow
try {
    $oldUserHeaders = @{
        "Authorization" = "Bearer $oldUserToken"
        "Content-Type" = "application/json"
    }
    
    $oldSearchResponse = Invoke-RestMethod -Uri "$baseUrl/garages/search" -Method POST -Headers $oldUserHeaders -Body (@{
        lat = 9.0320
        lng = 38.7469
        radius = 100
    } | ConvertTo-Json)
    
    $oldGarageCount = $oldSearchResponse.data.Count
    Write-Host "Found: $oldGarageCount garage(s)" -ForegroundColor $(if ($oldGarageCount -gt 0) { "Green" } else { "Red" })
    
    if ($oldGarageCount -gt 0) {
        Write-Host ""
        Write-Host "Old user CAN see garages:" -ForegroundColor Green
        foreach ($garage in $oldSearchResponse.data) {
            Write-Host "  • $($garage.name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "✗ Search failed for old user too: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($garageCount -eq 0 -and $oldGarageCount -eq 0) {
    Write-Host "ISSUE: No approved garages in database" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Green
    Write-Host "  Run: .\approve-all-garages.ps1" -ForegroundColor Cyan
} elseif ($garageCount -eq 0 -and $oldGarageCount -gt 0) {
    Write-Host "ISSUE: Backend API works, but frontend might have caching" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Green
    Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "  2. Clear localStorage:" -ForegroundColor White
    Write-Host "     - Open browser DevTools (F12)" -ForegroundColor Gray
    Write-Host "     - Go to Application tab" -ForegroundColor Gray
    Write-Host "     - Clear Storage → Clear site data" -ForegroundColor Gray
    Write-Host "  3. Hard refresh (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "  4. Try logging in again" -ForegroundColor White
} else {
    Write-Host "Success: Both users can see garages - No issue!" -ForegroundColor Green
}

Write-Host ""
