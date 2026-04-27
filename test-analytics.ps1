# Analytics Testing Script (PowerShell)
# This script tests all analytics endpoints

$BASE_URL = "http://localhost:5002/api"
$ADMIN_TOKEN = ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Analytics Testing Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as admin
Write-Host "Step 1: Logging in as admin..." -ForegroundColor Yellow

$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $ADMIN_TOKEN = $loginResponse.token
    
    if ($ADMIN_TOKEN) {
        Write-Host "✅ Logged in successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to get token" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to login. Please make sure:" -ForegroundColor Red
    Write-Host "   1. Backend is running on port 5002"
    Write-Host "   2. Admin user is seeded (POST /api/dev/seed-admin)"
    exit 1
}

Write-Host ""

# Step 2: Seed analytics data
Write-Host "Step 2: Seeding analytics data..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $seedResponse = Invoke-RestMethod -Uri "$BASE_URL/dev/seed-analytics" -Method Post -Headers $headers
    if ($seedResponse.success) {
        Write-Host "✅ Analytics data seeded successfully" -ForegroundColor Green
        Write-Host "   Reservations: $($seedResponse.data.reservations)" -ForegroundColor Gray
        Write-Host "   Payments: $($seedResponse.data.payments)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Seeding may have failed or data already exists" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test system stats
Write-Host "Step 3: Testing system stats endpoint..." -ForegroundColor Yellow

try {
    $statsResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/stats" -Method Get -Headers $headers
    if ($statsResponse.success) {
        Write-Host "✅ System stats endpoint working" -ForegroundColor Green
        Write-Host "   Total Users: $($statsResponse.data.totalUsers)" -ForegroundColor Gray
        Write-Host "   Total Garages: $($statsResponse.data.totalGarages)" -ForegroundColor Gray
        Write-Host "   Total Reservations: $($statsResponse.data.totalReservations)" -ForegroundColor Gray
        Write-Host "   Total Revenue: $($statsResponse.data.totalRevenue) ETB" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ System stats endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test analytics endpoints
Write-Host "Step 4: Testing analytics endpoints..." -ForegroundColor Yellow

$types = @("users", "reservations", "revenue")
$periods = @("week", "month", "year")

foreach ($type in $types) {
    Write-Host "   Testing $type analytics..." -ForegroundColor Cyan
    
    foreach ($period in $periods) {
        try {
            $response = Invoke-RestMethod -Uri "$BASE_URL/admin/analytics/$type/$period" -Method Get -Headers $headers
            if ($response.success) {
                $dataCount = $response.data.Count
                Write-Host "   ✅ $type-$period working ($dataCount data points)" -ForegroundColor Green
            }
        } catch {
            Write-Host "   ❌ $type-$period failed" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173/login"
Write-Host "2. Login with admin/admin123"
Write-Host "3. Navigate to Reports page"
Write-Host "4. View analytics charts"
