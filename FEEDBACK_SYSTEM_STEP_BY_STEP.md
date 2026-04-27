# Feedback System - Step by Step Testing Guide

## Overview
The feedback system tracks customer satisfaction through ratings and comments, and provides performance insights for administrators.

## Prerequisites
- Backend server running on port 5002
- MongoDB connected
- Admin account created (username: `admin`, password: `admin123`)

---

## Step 1: Start the Backend Server

Open a terminal in the backend folder and run:

```powershell
cd backend
npm run dev
```

You should see:
```
✅ App and dependencies loaded successfully
Server running on http://0.0.0.0:5002
MongoDB connected successfully
```

**Keep this terminal open** - the server needs to stay running.

---

## Step 2: Seed Test Feedback Data

Open a **NEW** terminal (keep the first one running) and run:

```powershell
# Create sample feedback data
curl -X POST http://localhost:5002/api/dev/seed-feedback
```

Or use the PowerShell script:

```powershell
.\test-feedback-system.ps1
```

Expected response:
```json
{
  "success": true,
  "message": "Feedback data seeded successfully",
  "data": {
    "feedbackCount": 15,
    "averageRating": 4.2
  }
}
```

This creates 15 sample feedback entries with ratings from 1-5 stars.

---

## Step 3: View Performance Insights

### Option A: Using curl

```powershell
# Get 30-day performance insights
curl http://localhost:5002/api/admin/performance-insights?period=30 `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option B: Using the test script

The `test-feedback-system.ps1` script will:
1. Login as admin
2. Seed feedback data
3. Fetch performance insights
4. Display the results

```powershell
.\test-feedback-system.ps1
```

Expected output:
```
=== FEEDBACK SYSTEM TEST ===

Step 1: Login as admin...
✓ Login successful
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Step 2: Seed feedback data...
✓ Feedback seeded: 15 entries created

Step 3: Get performance insights...
✓ Performance Insights (Last 30 days):
  - Completion Rate: 75.5%
  - Customer Satisfaction: 80.0%
  - Average Rating: 4.2/5.0
  - Total Reservations: 45
  - Completed Reservations: 34
  - Total Feedbacks: 15
```

---

## Step 4: Understanding the Metrics

### Completion Rate
- **Formula**: (Completed Reservations / Total Reservations) × 100
- **Meaning**: Percentage of reservations that were successfully completed
- **Good Target**: Above 80%

### Customer Satisfaction
- **Formula**: (Feedbacks with 4+ stars / Total Feedbacks) × 100
- **Meaning**: Percentage of customers who gave 4 or 5 stars
- **Good Target**: Above 85%

### Average Rating
- **Formula**: Sum of all ratings / Total feedbacks
- **Meaning**: Overall average star rating
- **Good Target**: Above 4.0/5.0

---

## Step 5: Test Different Time Periods

You can query different time periods:

```powershell
# Last 7 days
curl "http://localhost:5002/api/admin/performance-insights?period=7" `
  -H "Authorization: Bearer YOUR_TOKEN"

# Last 90 days
curl "http://localhost:5002/api/admin/performance-insights?period=90" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Step 6: View in Admin Dashboard (Frontend)

1. Start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. Login as admin:
   - Username: `admin`
   - Password: `admin123`

4. Navigate to: **System Overview** page

5. You should see the performance metrics displayed in cards:
   - Completion Rate card
   - Customer Satisfaction card
   - Average Rating card

---

## API Endpoints Reference

### Seed Feedback (Development Only)
```
POST /api/dev/seed-feedback
```
Creates 15 sample feedback entries for testing.

### Get Performance Insights (Admin Only)
```
GET /api/admin/performance-insights?period=30
```
Query Parameters:
- `period`: Number of days to analyze (default: 30)

Response:
```json
{
  "success": true,
  "data": {
    "completionRate": 75.5,
    "customerSatisfaction": 80.0,
    "averageRating": 4.2,
    "totalReservations": 45,
    "completedReservations": 34,
    "totalFeedbacks": 15,
    "period": 30
  }
}
```

---

## Troubleshooting

### Error: "Cannot access 'getPerformanceInsights' before initialization"
**Solution**: The function is now properly defined before export. Restart the backend server.

### Error: "Route.get() requires a callback function"
**Solution**: The function is now properly exported. Restart the backend server.

### Error: 401 Unauthorized
**Solution**: You need to login first and include the JWT token in the Authorization header.

### No feedback data showing
**Solution**: Run the seed endpoint first: `POST /api/dev/seed-feedback`

### Metrics showing 0%
**Solution**: 
1. Make sure feedback data is seeded
2. Make sure reservations exist (seed garages and create reservations)
3. Check the time period - try a longer period like 90 days

---

## Quick Test Command

Run everything in one go:

```powershell
# Make sure backend is running first, then:
.\test-feedback-system.ps1
```

This will:
1. Login as admin
2. Seed feedback data
3. Fetch and display performance insights

---

## Next Steps

1. **Create Real Feedback**: After completing reservations, car owners can leave feedback
2. **Monitor Trends**: Check performance insights regularly to track service quality
3. **Improve Services**: Use low ratings to identify areas for improvement
4. **Frontend Integration**: View metrics in the admin dashboard UI

---

## Files Modified

- `backend/src/controllers/adminController.js` - Added `getPerformanceInsights` function
- `backend/src/routes/adminRoutes.js` - Added performance insights route
- `backend/src/routes/seedFeedback.js` - Created feedback seeding endpoint
- `backend/src/app.js` - Registered seedFeedback routes
- `test-feedback-system.ps1` - PowerShell test script

---

## Summary

The feedback system is now fully functional! You can:
- ✅ Seed test feedback data
- ✅ View performance insights via API
- ✅ Track completion rates
- ✅ Monitor customer satisfaction
- ✅ Calculate average ratings
- ✅ Filter by time period

The backend is ready. Just start the server and run the test script!
