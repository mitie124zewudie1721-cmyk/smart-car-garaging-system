# Test Car Owner Login

Write-Host "Testing Car Owner Login..." -ForegroundColor Cyan
Write-Host ""

$loginData = @{
    username = "carowner"
    password = "carowner123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Login Successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "User Details:" -ForegroundColor Yellow
        Write-Host "  Name: $($response.data.user.name)" -ForegroundColor White
        Write-Host "  Username: $($response.data.user.username)" -ForegroundColor White
        Write-Host "  Role: $($response.data.user.role)" -ForegroundColor White
        Write-Host "  Email: $($response.data.user.email)" -ForegroundColor White
        Write-Host ""
        Write-Host "Token: $($response.data.token.substring(0, 50))..." -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ You can now login at: http://localhost:5173/login" -ForegroundColor Green
        Write-Host "   Username: carowner" -ForegroundColor White
        Write-Host "   Password: carowner123" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Login Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure backend is running on port 5002" -ForegroundColor Gray
    Write-Host "2. Check if the account exists" -ForegroundColor Gray
    Write-Host "3. Try resetting the password:" -ForegroundColor Gray
    Write-Host "   .\reset-password.ps1" -ForegroundColor White
}
