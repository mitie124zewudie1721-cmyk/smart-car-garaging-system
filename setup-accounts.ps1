# Complete Account Setup Script
# Creates both Garage Owner and Car Owner accounts

$BASE_URL = "http://localhost:5002/api"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Account Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Garage Owner
Write-Host "Step 1: Creating Garage Owner account..." -ForegroundColor Yellow

$garageOwnerData = @{
    name = "Garage Owner"
    username = "garageowner"
    email = "garage@example.com"
    phone = "+251911111111"
    password = "garageowner123"
    role = "garage_owner"
} | ConvertTo-Json

try {
    $garageResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $garageOwnerData -ContentType "application/json"
    
    if ($garageResponse.success) {
        Write-Host "✅ Garage Owner created successfully!" -ForegroundColor Green
        Write-Host "   Username: garageowner" -ForegroundColor Gray
        Write-Host "   Password: garageowner123" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*duplicate*") {
        Write-Host "⚠️  Garage Owner already exists (this is okay)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create Garage Owner" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 2: Create Car Owner
Write-Host "Step 2: Creating Car Owner account..." -ForegroundColor Yellow

$carOwnerData = @{
    name = "Car Owner"
    username = "carowner"
    email = "car@example.com"
    phone = "+251922222222"
    password = "carowner123"
    role = "car_owner"
} | ConvertTo-Json

try {
    $carResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $carOwnerData -ContentType "application/json"
    
    if ($carResponse.success) {
        Write-Host "✅ Car Owner created successfully!" -ForegroundColor Green
        Write-Host "   Username: carowner" -ForegroundColor Gray
        Write-Host "   Password: carowner123" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*duplicate*") {
        Write-Host "⚠️  Car Owner already exists (this is okay)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create Car Owner" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 3: Create Admin (optional)
Write-Host "Step 3: Creating Admin account..." -ForegroundColor Yellow

try {
    $adminResponse = Invoke-RestMethod -Uri "$BASE_URL/dev/seed-admin" -Method Post
    
    if ($adminResponse.success) {
        Write-Host "✅ Admin created successfully!" -ForegroundColor Green
        Write-Host "   Username: admin" -ForegroundColor Gray
        Write-Host "   Password: admin123" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Message -like "*duplicate*") {
        Write-Host "⚠️  Admin already exists (this is okay)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Could not create admin (optional)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Your Accounts:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Garage Owner (Manage Garages)" -ForegroundColor Cyan
Write-Host "   Username: garageowner" -ForegroundColor White
Write-Host "   Password: garageowner123" -ForegroundColor White
Write-Host "   Use for: Adding garages, viewing analytics" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Car Owner (Book Services)" -ForegroundColor Cyan
Write-Host "   Username: carowner" -ForegroundColor White
Write-Host "   Password: carowner123" -ForegroundColor White
Write-Host "   Use for: Adding vehicles, booking services" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Admin (System Management)" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host "   Use for: User management, reports" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Login at: http://localhost:5173/login" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Login as garageowner → Add garages" -ForegroundColor Gray
Write-Host "2. Logout → Login as carowner → Add vehicles" -ForegroundColor Gray
Write-Host "3. Search garages → Book service" -ForegroundColor Gray
