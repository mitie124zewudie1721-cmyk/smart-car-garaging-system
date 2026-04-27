@echo off
echo ========================================
echo Feedback System Test
echo ========================================
echo.

echo Step 1: Seeding feedback data...
curl -X POST http://localhost:5002/api/dev/seed-feedback
echo.

echo Step 2: Logging in as admin...
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > temp_token.json
echo.

echo Step 3: Getting performance insights...
echo Note: You need to manually copy the token from temp_token.json and run:
echo curl "http://localhost:5002/api/admin/performance-insights?period=30" -H "Authorization: Bearer YOUR_TOKEN"
echo.

echo Check temp_token.json for your admin token
echo.

pause
