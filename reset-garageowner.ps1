# Quick Reset for Garage Owner Password
# Sets password to: garageowner123

$BASE_URL = "http://localhost:5002/api/dev"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resetting Garage Owner Password" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$resetData = @{
    username = "garageowner"
    newPassword = "garageowner123"
} | ConvertTo-Json

try {
    Write-Host "Resetting password..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$BASE_URL/reset-password" -Method Post -Body $resetData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Password has been reset!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Login Credentials:" -ForegroundColor Yellow
        Write-Host "  Username: garageowner" -ForegroundColor White
        Write-Host "  Password: garageowner123" -ForegroundColor White
        Write-Host ""
        Write-Host "Login at: http://localhost:5173/login" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Backend is running on port 5002" -ForegroundColor Gray
    Write-Host "  2. User 'garageowner' exists in database" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
