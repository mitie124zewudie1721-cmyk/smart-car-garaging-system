# Password Reset Script
# Resets password for existing users

$BASE_URL = "http://localhost:5002/api/dev"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Password Reset Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: List all users
Write-Host "Step 1: Listing all users..." -ForegroundColor Yellow
Write-Host ""

try {
    $usersResponse = Invoke-RestMethod -Uri "$BASE_URL/list-users" -Method Get
    
    if ($usersResponse.success) {
        Write-Host "✅ Found $($usersResponse.count) users:" -ForegroundColor Green
        Write-Host ""
        
        foreach ($user in $usersResponse.data) {
            Write-Host "  Username: $($user.username)" -ForegroundColor White
            Write-Host "  Name: $($user.name)" -ForegroundColor Gray
            Write-Host "  Role: $($user.role)" -ForegroundColor Gray
            Write-Host "  Created: $($user.createdAt)" -ForegroundColor Gray
            Write-Host "  ---" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "❌ Failed to list users" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure backend is running on port 5002" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Reset password for garageowner
Write-Host "Step 2: Resetting password for 'garageowner'..." -ForegroundColor Yellow

$resetData = @{
    username = "garageowner"
    newPassword = "garageowner123"
} | ConvertTo-Json

try {
    $resetResponse = Invoke-RestMethod -Uri "$BASE_URL/reset-password" -Method Post -Body $resetData -ContentType "application/json"
    
    if ($resetResponse.success) {
        Write-Host "✅ Password reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New credentials:" -ForegroundColor Yellow
        Write-Host "  Username: garageowner" -ForegroundColor White
        Write-Host "  Password: garageowner123" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now login at: http://localhost:5173/login" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to reset password" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 3: Reset password for admin (if exists)
Write-Host "Step 3: Resetting password for 'admin' (if exists)..." -ForegroundColor Yellow

$adminResetData = @{
    username = "admin"
    newPassword = "admin123"
} | ConvertTo-Json

try {
    $adminResetResponse = Invoke-RestMethod -Uri "$BASE_URL/reset-password" -Method Post -Body $adminResetData -ContentType "application/json"
    
    if ($adminResetResponse.success) {
        Write-Host "✅ Admin password reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Admin credentials:" -ForegroundColor Yellow
        Write-Host "  Username: admin" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Admin user not found (this is okay if not created yet)" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Reset password for carowner (if exists)
Write-Host "Step 4: Resetting password for 'carowner' (if exists)..." -ForegroundColor Yellow

$carOwnerResetData = @{
    username = "carowner"
    newPassword = "password123"
} | ConvertTo-Json

try {
    $carOwnerResetResponse = Invoke-RestMethod -Uri "$BASE_URL/reset-password" -Method Post -Body $carOwnerResetData -ContentType "application/json"
    
    if ($carOwnerResetResponse.success) {
        Write-Host "✅ Car owner password reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Car owner credentials:" -ForegroundColor Yellow
        Write-Host "  Username: carowner" -ForegroundColor White
        Write-Host "  Password: password123" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Car owner user not found (this is okay if not created yet)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Password Reset Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary of Accounts:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Garage Owner:" -ForegroundColor Cyan
Write-Host "  Username: garageowner" -ForegroundColor White
Write-Host "  Password: garageowner123" -ForegroundColor White
Write-Host ""
Write-Host "Admin:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Car Owner:" -ForegroundColor Cyan
Write-Host "  Username: carowner" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "Login at: http://localhost:5173/login" -ForegroundColor Green
