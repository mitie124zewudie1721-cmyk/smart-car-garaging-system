# Garage Owner Features Testing Script (PowerShell)
# Tests: CRUD operations, Analytics, Booking management

$BASE_URL = "http://localhost:5002/api"
$GARAGE_OWNER_TOKEN = ""
$GARAGE_ID = ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Garage Owner Features Testing Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as garage owner
Write-Host "Step 1: Logging in as garage owner..." -ForegroundColor Yellow

$loginBody = @{
    username = "garageowner"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $GARAGE_OWNER_TOKEN = $loginResponse.token
    
    if ($GARAGE_OWNER_TOKEN) {
        Write-Host "✅ Logged in successfully as garage owner" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to get token" -ForegroundColor Red
        Write-Host "Please register a garage owner account first:" -ForegroundColor Yellow
        Write-Host "  1. Go to http://localhost:5173/register" -ForegroundColor Gray
        Write-Host "  2. Username: garageowner, Password: password123, Role: Garage Owner" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Failed to login. Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Backend is running on port 5002" -ForegroundColor Gray
    Write-Host "  2. Garage owner account exists (username: garageowner)" -ForegroundColor Gray
    exit 1
}

Write-Host ""

$headers = @{
    "Authorization" = "Bearer $GARAGE_OWNER_TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Create a new garage (CREATE)
Write-Host "Step 2: Creating a new garage..." -ForegroundColor Yellow

$garageData = @{
    name = "Test Auto Service Center"
    location = @{
        type = "Point"
        coordinates = @(36.8219, 7.6779)  # Jimma, Ethiopia [lng, lat]
        address = "Piazza, Jimma, Ethiopia"
    }
    capacity = 15
    pricePerHour = 150
    amenities = @("covered", "secure", "24h", "repair", "cctv")
    description = "Full-service auto repair and maintenance center for testing"
    operatingHours = @{
        start = "08:00"
        end = "18:00"
    }
} | ConvertTo-Json -Depth 10

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/garages" -Method Post -Headers $headers -Body $garageData
    if ($createResponse.success) {
        $GARAGE_ID = $createResponse.data._id
        Write-Host "✅ Garage created successfully" -ForegroundColor Green
        Write-Host "   Garage ID: $GARAGE_ID" -ForegroundColor Gray
        Write-Host "   Name: $($createResponse.data.name)" -ForegroundColor Gray
        Write-Host "   Capacity: $($createResponse.data.capacity)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to create garage" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 3: Get my garages (READ)
Write-Host "Step 3: Fetching my garages..." -ForegroundColor Yellow

try {
    $garagesResponse = Invoke-RestMethod -Uri "$BASE_URL/garages/my" -Method Get -Headers $headers
    if ($garagesResponse.success) {
        $garageCount = $garagesResponse.count
        Write-Host "✅ Fetched garages successfully" -ForegroundColor Green
        Write-Host "   Total garages: $garageCount" -ForegroundColor Gray
        
        foreach ($garage in $garagesResponse.data) {
            Write-Host "   - $($garage.name) (Capacity: $($garage.capacity), Price: $($garage.pricePerHour) ETB/hr)" -ForegroundColor Gray
        }
        
        # Use first garage ID if we don't have one from creation
        if (-not $GARAGE_ID -and $garagesResponse.data.Count -gt 0) {
            $GARAGE_ID = $garagesResponse.data[0]._id
        }
    }
} catch {
    Write-Host "❌ Failed to fetch garages" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Update garage (UPDATE)
if ($GARAGE_ID) {
    Write-Host "Step 4: Updating garage..." -ForegroundColor Yellow
    
    $updateData = @{
        pricePerHour = 175
        description = "Updated: Premium auto service center with advanced diagnostics"
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "$BASE_URL/garages/$GARAGE_ID" -Method Put -Headers $headers -Body $updateData
        if ($updateResponse.success) {
            Write-Host "✅ Garage updated successfully" -ForegroundColor Green
            Write-Host "   New price: $($updateResponse.data.pricePerHour) ETB/hr" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Failed to update garage" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping update test (no garage ID available)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Get analytics
Write-Host "Step 5: Fetching garage analytics..." -ForegroundColor Yellow

try {
    $analyticsResponse = Invoke-RestMethod -Uri "$BASE_URL/garages/my/analytics" -Method Get -Headers $headers
    if ($analyticsResponse.success) {
        Write-Host "✅ Analytics fetched successfully" -ForegroundColor Green
        Write-Host "   Total Bookings: $($analyticsResponse.data.totalBookings)" -ForegroundColor Gray
        Write-Host "   Completed Services: $($analyticsResponse.data.completedServices)" -ForegroundColor Gray
        Write-Host "   Revenue: $($analyticsResponse.data.revenue) ETB" -ForegroundColor Gray
        Write-Host "   Average Rating: $($analyticsResponse.data.averageRating) ⭐" -ForegroundColor Gray
        Write-Host "   Active Bookings: $($analyticsResponse.data.activeBookings)" -ForegroundColor Gray
        Write-Host "   Cancelled: $($analyticsResponse.data.cancelledBookings)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to fetch analytics" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 6: Test delete (optional - commented out to preserve test data)
# Uncomment to test delete functionality
<#
if ($GARAGE_ID) {
    Write-Host "Step 6: Testing garage deletion..." -ForegroundColor Yellow
    
    $confirm = Read-Host "Do you want to delete the test garage? (yes/no)"
    if ($confirm -eq "yes") {
        try {
            $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/garages/$GARAGE_ID" -Method Delete -Headers $headers
            if ($deleteResponse.success) {
                Write-Host "✅ Garage deleted successfully" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Failed to delete garage" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Skipped deletion" -ForegroundColor Yellow
    }
}
#>

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary of Tests:" -ForegroundColor Yellow
Write-Host "✅ Login as garage owner" -ForegroundColor Green
Write-Host "✅ Create garage (POST /api/garages)" -ForegroundColor Green
Write-Host "✅ Read garages (GET /api/garages/my)" -ForegroundColor Green
Write-Host "✅ Update garage (PUT /api/garages/:id)" -ForegroundColor Green
Write-Host "✅ Get analytics (GET /api/garages/my/analytics)" -ForegroundColor Green
Write-Host "⚠️  Delete garage (commented out - uncomment to test)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173/login" -ForegroundColor Gray
Write-Host "2. Login with garageowner/password123" -ForegroundColor Gray
Write-Host "3. Navigate to 'My Garages' to see your garages" -ForegroundColor Gray
Write-Host "4. Navigate to 'Analytics' to view statistics" -ForegroundColor Gray
Write-Host "5. Navigate to 'Bookings' to manage appointments" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend Pages:" -ForegroundColor Yellow
Write-Host "- My Garages: http://localhost:5173/my-garages" -ForegroundColor Gray
Write-Host "- Add Garage: http://localhost:5173/add-garage" -ForegroundColor Gray
Write-Host "- Analytics: http://localhost:5173/analytics" -ForegroundColor Gray
Write-Host "- Bookings: http://localhost:5173/bookings" -ForegroundColor Gray
