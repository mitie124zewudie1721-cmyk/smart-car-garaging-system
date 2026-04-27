# PowerShell script to restart frontend dev server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTART FRONTEND DEV SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: You need to manually restart the frontend server!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor Green
Write-Host "1. Find the terminal/PowerShell window running 'npm run dev'" -ForegroundColor White
Write-Host "2. Press Ctrl + C to stop the server" -ForegroundColor White
Write-Host "3. Run this command:" -ForegroundColor White
Write-Host ""
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. After server restarts, go to browser and press:" -ForegroundColor White
Write-Host "   Ctrl + Shift + R (hard refresh)" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to show if frontend is running
Write-Host "Checking if frontend is running on port 5173..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Frontend IS running on http://localhost:5173" -ForegroundColor Green
    Write-Host "  You MUST restart it to see the new buttons!" -ForegroundColor Red
} catch {
    Write-Host "✗ Frontend is NOT running" -ForegroundColor Red
    Write-Host "  Start it with: cd frontend; npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "What you'll see after restart:" -ForegroundColor Green
Write-Host "- Each garage card will have TWO buttons side-by-side" -ForegroundColor White
Write-Host "- Left: 'View Details' (outline style)" -ForegroundColor White
Write-Host "- Right: 'Reserve Now' (primary blue style)" -ForegroundColor White
Write-Host ""
