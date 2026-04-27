# Test Feedback System and Performance Insights

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Feedback System Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:5002/api"

# Step 1: Seed feedback data
Write-Host "Step 1: Seeding feedback data..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/dev/seed-feedback" -Method Post
    
    if ($response.success) {
        Write-Host "Success! Feedback seeded" -ForegroundColor Green
        Write-Host "Total Feedback: $($response.data.totalFeedback)" -ForegroundColor White
        Write-Host "Average Rating: $($response.data.averageRating)/5" -ForegroundColor White
        Write-Host "Customer Satisfaction: $($response.data.customerSatisfaction)%" -ForegroundColor White
    }
} catch {
    Write-Host "Failed to seed feedback" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 2: Login as admin
Write-Host "Step 2: Logging in as admin..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Logged in as admin" -ForegroundColor Green
} catch {
    Write-Host "Login failed" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 3: Get Performance Insights
Write-Host "Step 3: Fetching Performance Insights..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $insights = Invoke-RestMethod -Uri "$BASE_URL/admin/performance-insights?period=30" -Method Get -Headers $headers
    
    if ($insights.success) {
        Write-Host "Performance Insights Retrieved!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Completion Rate: $($insights.data.completionRate)%" -ForegroundColor Yellow
        Write-Host "Customer Satisfaction: $($insights.data.customerSatisfaction)%" -ForegroundColor Yellow
        Write-Host "Average Rating: $($insights.data.averageRating)/5.0" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Total Reservations: $($insights.data.totalReservations)" -ForegroundColor White
        Write-Host "Completed: $($insights.data.completedReservations)" -ForegroundColor White
        Write-Host "Total Feedback: $($insights.data.totalFeedbacks)" -ForegroundColor White
    }
} catch {
    Write-Host "Failed to get performance insights" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Complete!" -ForegroundColor Cyan
