# Quick Test of Admin Endpoints

Write-Host "Testing Admin Endpoints..." -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:5002/api"

# Step 1: Login as admin
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✓ Login successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 2: Test pending garages endpoint
Write-Host "2. Testing GET /api/admin/garages/pending..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/garages/pending" -Method Get -Headers $headers
    Write-Host "   ✓ Endpoint works!" -ForegroundColor Green
    Write-Host "   Found $($response.count) pending garages" -ForegroundColor White
    
    if ($response.count -gt 0) {
        Write-Host ""
        Write-Host "   Pending Garages:" -ForegroundColor White
        foreach ($garage in $response.data) {
            Write-Host "   - Name: $($garage.name)" -ForegroundColor Cyan
            Write-Host "     ID: $($garage._id)" -ForegroundColor Gray
            Write-Host "     Status: $($garage.verificationStatus)" -ForegroundColor Yellow
            Write-Host "     Owner: $($garage.owner.username)" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Step 3: Try to approve first garage
        $firstGarageId = $response.data[0]._id
        Write-Host "3. Testing PATCH /api/admin/garages/$firstGarageId/approve..." -ForegroundColor Yellow
        
        try {
            $approveResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/garages/$firstGarageId/approve" -Method Patch -Headers $headers
            Write-Host "   ✓ Approval works!" -ForegroundColor Green
            Write-Host "   New status: $($approveResponse.data.verificationStatus)" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Approval failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   No pending garages to test approval" -ForegroundColor Yellow
        Write-Host "   Add a garage first as garage owner" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Complete!" -ForegroundColor Cyan
