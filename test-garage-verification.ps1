# Test Garage Verification Workflow

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Garage Verification Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:5002/api"

# Step 1: Login as admin
Write-Host "Step 1: Logging in as admin..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $adminToken = $loginResponse.token
    Write-Host "✓ Logged in as admin" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 2: Get pending garages
Write-Host "Step 2: Fetching pending garages..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

try {
    $pendingGarages = Invoke-RestMethod -Uri "$BASE_URL/admin/garages/pending" -Method Get -Headers $headers
    
    if ($pendingGarages.success) {
        Write-Host "✓ Found $($pendingGarages.count) pending garages" -ForegroundColor Green
        
        if ($pendingGarages.count -gt 0) {
            Write-Host ""
            Write-Host "Pending Garages:" -ForegroundColor White
            foreach ($garage in $pendingGarages.data) {
                Write-Host "  - ID: $($garage._id)" -ForegroundColor White
                Write-Host "    Name: $($garage.name)" -ForegroundColor White
                Write-Host "    Owner: $($garage.owner.name) ($($garage.owner.username))" -ForegroundColor White
                Write-Host "    Status: $($garage.verificationStatus)" -ForegroundColor Yellow
                Write-Host ""
            }
            
            # Step 3: Approve first garage
            if ($pendingGarages.count -gt 0) {
                $firstGarageId = $pendingGarages.data[0]._id
                
                Write-Host "Step 3: Approving garage $firstGarageId..." -ForegroundColor Yellow
                
                try {
                    $approveResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/garages/$firstGarageId/approve" -Method Patch -Headers $headers
                    
                    if ($approveResponse.success) {
                        Write-Host "✓ Garage approved successfully!" -ForegroundColor Green
                        Write-Host "  Status: $($approveResponse.data.verificationStatus)" -ForegroundColor Green
                        Write-Host "  Verified at: $($approveResponse.data.verificationDate)" -ForegroundColor White
                    }
                } catch {
                    Write-Host "✗ Failed to approve garage" -ForegroundColor Red
                    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "No pending garages found. Add a garage first!" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "✗ Failed to get pending garages" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test rejection, use:" -ForegroundColor White
Write-Host 'curl -X PATCH http://localhost:5002/api/admin/garages/GARAGE_ID/reject \' -ForegroundColor Gray
Write-Host '  -H "Authorization: Bearer YOUR_TOKEN" \' -ForegroundColor Gray
Write-Host '  -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '  -d ''{"reason":"Invalid license document"}''' -ForegroundColor Gray
