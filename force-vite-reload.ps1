# Force Vite to reload the updated file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FORCE VITE CACHE CLEAR & RESTART" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules/.vite") {
    Remove-Item -Path "frontend/node_modules/.vite" -Recurse -Force
    Write-Host "✓ Cleared frontend/node_modules/.vite" -ForegroundColor Green
} else {
    Write-Host "  No .vite cache found" -ForegroundColor Gray
}

if (Test-Path "frontend/.vite") {
    Remove-Item -Path "frontend/.vite" -Recurse -Force
    Write-Host "✓ Cleared frontend/.vite" -ForegroundColor Green
} else {
    Write-Host "  No .vite folder found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 2: Verifying the file has BOTH buttons..." -ForegroundColor Yellow
$fileContent = Get-Content "frontend/src/pages/CarOwner/FindGarage.tsx" -Raw
if ($fileContent -match "Reserve Now") {
    Write-Host "✓ File contains 'Reserve Now' button" -ForegroundColor Green
} else {
    Write-Host "✗ File MISSING 'Reserve Now' button!" -ForegroundColor Red
    exit 1
}

if ($fileContent -match "View Details") {
    Write-Host "✓ File contains 'View Details' button" -ForegroundColor Green
} else {
    Write-Host "✗ File MISSING 'View Details' button!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CACHE CLEARED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOW YOU MUST:" -ForegroundColor Yellow
Write-Host "1. Stop the frontend dev server (Ctrl+C)" -ForegroundColor White
Write-Host "2. Start it again:" -ForegroundColor White
Write-Host ""
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""
Write-Host "You will see TWO buttons on each garage card!" -ForegroundColor Green
Write-Host ""
