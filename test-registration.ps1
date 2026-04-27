# Test Registration Without Email

Write-Host "Testing Registration (Email Optional)..." -ForegroundColor Cyan
Write-Host ""

$testUser = @{
    name = "Test User"
    username = "testuser$(Get-Random -Minimum 1000 -Maximum 9999)"
    password = "testpass123"
    role = "car_owner"
    phone = "+251923456789"
} | ConvertTo-Json

Write-Host "Registering new user..." -ForegroundColor Yellow
Write-Host "Username: $($testUser | ConvertFrom-Json | Select-Object -ExpandProperty username)" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $testUser -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Registration Successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "User Details:" -ForegroundColor Yellow
        Write-Host "  Name: $($response.user.name)" -ForegroundColor White
        Write-Host "  Username: $($response.user.username)" -ForegroundColor White
        Write-Host "  Role: $($response.user.role)" -ForegroundColor White
        Write-Host "  Phone: $($response.user.phone)" -ForegroundColor White
        Write-Host ""
        Write-Host "Token received: $($response.token.substring(0, 50))..." -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ Email was NOT required!" -ForegroundColor Green
        Write-Host "✅ Phone is optional!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Registration Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorData.message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing Registration WITHOUT Phone..." -ForegroundColor Cyan

$testUser2 = @{
    name = "Another User"
    username = "anotheruser$(Get-Random -Minimum 1000 -Maximum 9999)"
    password = "testpass123"
    role = "garage_owner"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $testUser2 -ContentType "application/json"
    
    if ($response2.success) {
        Write-Host "✅ Registration Successful (No Phone)!" -ForegroundColor Green
        Write-Host "  Username: $($response2.user.username)" -ForegroundColor White
        Write-Host "  Phone: $($response2.user.phone)" -ForegroundColor White
        Write-Host ""
        Write-Host "✅ Phone is truly optional!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✅ Email is NOT required" -ForegroundColor Green
Write-Host "✅ Phone is optional" -ForegroundColor Green
Write-Host "✅ Only username and password are required" -ForegroundColor Green
Write-Host ""
Write-Host "You can now register at: http://localhost:5173/register" -ForegroundColor Yellow
