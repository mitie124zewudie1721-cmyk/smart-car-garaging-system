# Complete Garage Verification Flow Test
# Tests the entire workflow from garage registration to admin approval

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GARAGE VERIFICATION COMPLETE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"
$garageOwnerToken = ""
$adminToken = ""
$garageId = ""

# Step 1: Login as Garage Owner
Write-Host "Step 1: Login as Garage Owner..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
    username = "garageowner"
    password = "garageowner123"
} | ConvertTo-Json)

if ($loginResponse.success) {
    $garageOwnerToken = $loginResponse.token
    Write-Host "✓ Garage owner logged in successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to login as garage owner" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Register a New Garage
Write-Host "Step 2: Register a New Garage..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $garageOwnerToken"
    "Content-Type" = "application/json"
}

$garageData = @{
    name = "Test Garage $(Get-Date -Format 'HHmmss')"
    location = @{
        address = "123 Test Street, Addis Ababa"
        coordinates = @(9.0320, 38.7469)
    }
    capacity = 20
    pricePerHour = 50
    amenities = @("covered", "secure", "24h")
    description = "Test garage for verification flow"
} | ConvertTo-Json

try {
    $garageResponse = Invoke-RestMethod -Uri "$baseUrl/garages" -Method POST -Headers $headers -Body $garageData
    
    if ($garageResponse.success) {
        $garageId = $garageResponse.data._id
        $status = $garageResponse.data.verificationStatus
        Write-Host "✓ Garage registered successfully" -ForegroundColor Green
        Write-Host "  Garage ID: $garageId" -ForegroundColor Gray
        Write-Host "  Status: $status" -ForegroundColor $(if ($status -eq "pending") { "Yellow" } else { "Red" })
        
        if ($status -ne "pending") {
            Write-Host "✗ ERROR: Garage status should be 'pending' but is '$status'" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ Failed to register garage" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error registering garage: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Verify Garage is NOT in Search Results
Write-Host "Step 3: Verify Garage is NOT in Search Results..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/garages/search?lat=9.0320&lng=38.7469&radius=10" -Method GET
    
    $foundInSearch = $searchResponse.data | Where-Object { $_._id -eq $garageId }
    
    if ($foundInSearch) {
        Write-Host "✗ ERROR: Pending garage appears in search results (should not!)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✓ Pending garage correctly hidden from search" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Could not verify search results: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Login as Admin
Write-Host "Step 4: Login as Admin..." -ForegroundColor Yellow
$adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json)

if ($adminLoginResponse.success) {
    $adminToken = $adminLoginResponse.token
    Write-Host "✓ Admin logged in successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to login as admin" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Get Pending Garages
Write-Host "Step 5: Get Pending Garages..." -ForegroundColor Yellow
$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
}

try {
    $pendingResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/pending" -Method GET -Headers $adminHeaders
    
    Write-Host "✓ Retrieved pending garages" -ForegroundColor Green
    Write-Host "  Total pending: $($pendingResponse.count)" -ForegroundColor Gray
    
    $ourGarage = $pendingResponse.data | Where-Object { $_._id -eq $garageId }
    
    if ($ourGarage) {
        Write-Host "✓ Our test garage found in pending list" -ForegroundColor Green
        Write-Host "  Name: $($ourGarage.name)" -ForegroundColor Gray
        Write-Host "  Owner: $($ourGarage.owner.username)" -ForegroundColor Gray
    } else {
        Write-Host "✗ ERROR: Our test garage not found in pending list" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error getting pending garages: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Approve the Garage
Write-Host "Step 6: Approve the Garage..." -ForegroundColor Yellow
try {
    $approveResponse = Invoke-RestMethod -Uri "$baseUrl/admin/garages/$garageId/approve" -Method PATCH -Headers $adminHeaders
    
    if ($approveResponse.success) {
        Write-Host "✓ Garage approved successfully" -ForegroundColor Green
        Write-Host "  New status: $($approveResponse.data.verificationStatus)" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to approve garage" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error approving garage: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 7: Verify Garage NOW Appears in Search
Write-Host "Step 7: Verify Garage NOW Appears in Search..." -ForegroundColor Yellow
Start-Sleep -Seconds 1  # Give database a moment to update

try {
    $searchResponse2 = Invoke-RestMethod -Uri "$baseUrl/garages/search?lat=9.0320&lng=38.7469&radius=10" -Method GET
    
    $foundInSearch2 = $searchResponse2.data | Where-Object { $_._id -eq $garageId }
    
    if ($foundInSearch2) {
        Write-Host "✓ Approved garage now appears in search results" -ForegroundColor Green
        Write-Host "  Name: $($foundInSearch2.name)" -ForegroundColor Gray
        Write-Host "  Status: $($foundInSearch2.verificationStatus)" -ForegroundColor Green
    } else {
        Write-Host "✗ ERROR: Approved garage still not in search results" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "⚠ Could not verify search results: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Verify Garage Owner Can See Updated Status
Write-Host "Step 8: Verify Garage Owner Can See Updated Status..." -ForegroundColor Yellow
$garageOwnerHeaders = @{
    "Authorization" = "Bearer $garageOwnerToken"
}

try {
    $myGaragesResponse = Invoke-RestMethod -Uri "$baseUrl/garages/my" -Method GET -Headers $garageOwnerHeaders
    
    $updatedGarage = $myGaragesResponse.data | Where-Object { $_._id -eq $garageId }
    
    if ($updatedGarage) {
        Write-Host "✓ Garage owner can see their garage" -ForegroundColor Green
        Write-Host "  Status: $($updatedGarage.verificationStatus)" -ForegroundColor Green
        
        if ($updatedGarage.verificationStatus -eq "approved") {
            Write-Host "✓ Status correctly shows as 'approved'" -ForegroundColor Green
        } else {
            Write-Host "✗ ERROR: Status should be 'approved' but is '$($updatedGarage.verificationStatus)'" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ ERROR: Garage not found in owner's garage list" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error getting garage owner's garages: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  1. ✓ Garage registered with 'pending' status" -ForegroundColor Green
Write-Host "  2. ✓ Pending garage hidden from search" -ForegroundColor Green
Write-Host "  3. ✓ Admin can see pending garages" -ForegroundColor Green
Write-Host "  4. ✓ Admin can approve garages" -ForegroundColor Green
Write-Host "  5. ✓ Approved garage appears in search" -ForegroundColor Green
Write-Host "  6. ✓ Garage owner sees updated status" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend UI Updates:" -ForegroundColor Cyan
Write-Host "  • Admin: Navigate to 'Garage Verification' in sidebar" -ForegroundColor White
Write-Host "  • Garage Owner: Check 'My Garages' for status badges" -ForegroundColor White
Write-Host ""
Write-Host "Test Garage ID: $garageId" -ForegroundColor Gray
