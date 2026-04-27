# 📊 Feedback System & Performance Insights Guide

## Overview

The feedback system allows car owners to rate and review garages after completing a service. Performance Insights provide analytics on:
- **Completion Rate**: Percentage of reservations that are completed
- **Customer Satisfaction**: Percentage of 4+ star ratings
- **Average Rating**: Overall rating across all feedback

---

## 🚀 Quick Start

### Step 1: Seed Feedback Data

Run the PowerShell script:
```powershell
.\test-feedback-system.ps1
```

Or manually:
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed-feedback" -Method Post
```

### Step 2: View Performance Insights

**Option A: Via API**
```powershell
# Login as admin
$login = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/login" -Method Post -Body $login -ContentType "application/json"
$token = $response.token

# Get insights
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5002/api/admin/performance-insights?period=30" -Method Get -Headers $headers
```

**Option B: Via Frontend**
1. Login as admin (admin/admin123)
2. Go to System Overview or Reports page
3. View Performance Insights section

---

## 📋 API Endpoints

### 1. Seed Feedback Data
```
POST /api/dev/seed-feedback
```

**Response:**
```json
{
  "success": true,
  "message": "Seeded 20 feedback entries",
  "data": {
    "totalFeedback": 20,
    "averageRating": 4.2,
    "customerSatisfaction": 75.0,
    "feedbackByRating": {
      "5": 8,
      "4": 7,
      "3": 3,
      "2": 1,
      "1": 1
    }
  }
}
```

### 2. Get Performance Insights
```
GET /api/admin/performance-insights?period=30
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "completionRate": 85.5,
    "customerSatisfaction": 75.0,
    "averageRating": 4.2,
    "totalReservations": 100,
    "completedReservations": 85,
    "totalFeedbacks": 20,
    "period": 30
  }
}
```

### 3. Create Feedback (Car Owner)
```
POST /api/feedback
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reservationId": "60d5ec49f1b2c72b8c8e4f1a",
  "rating": 5,
  "comment": "Excellent service!"
}
```

### 4. Get Garage Feedbacks (Public)
```
GET /api/feedback/garage/:garageId?page=1&limit=10&minRating=4
```

### 5. Get My Feedbacks (Car Owner)
```
GET /api/feedback/my
Authorization: Bearer {token}
```

---

## 📊 Metrics Explained

### Completion Rate
**Formula:** `(Completed Reservations / Total Reservations) × 100`

**Example:**
- Total Reservations: 100
- Completed: 85
- Completion Rate: 85%

**What it means:**
- High rate (>80%): Good service reliability
- Low rate (<60%): Many cancellations or no-shows

### Customer Satisfaction
**Formula:** `(Feedbacks with 4+ stars / Total Feedbacks) × 100`

**Example:**
- Total Feedbacks: 20
- 4+ star ratings: 15
- Customer Satisfaction: 75%

**What it means:**
- High satisfaction (>80%): Customers are happy
- Low satisfaction (<60%): Need service improvements

### Average Rating
**Formula:** `Sum of all ratings / Total feedbacks`

**Example:**
- Ratings: [5, 4, 5, 3, 4, 5, 4, 3, 5, 4]
- Average: 4.2/5.0

**Rating Scale:**
- 5 stars: Excellent
- 4 stars: Good
- 3 stars: Average
- 2 stars: Below Average
- 1 star: Poor

---

## 🎯 How It Works

### For Car Owners

1. **Complete a Reservation**
   - Book a service
   - Complete the service
   - Reservation status changes to "completed"

2. **Submit Feedback**
   - Go to "My Reservations"
   - Find completed reservation
   - Click "Leave Feedback"
   - Rate 1-5 stars
   - Write optional comment
   - Submit

3. **View Your Feedback**
   - Go to "My Feedback" page
   - See all your submitted reviews

### For Garage Owners

1. **View Feedback**
   - Go to "My Garages"
   - Click on a garage
   - See all feedback for that garage

2. **Monitor Ratings**
   - Average rating displayed on garage card
   - Individual feedback with comments
   - Filter by rating (e.g., show only 4+ stars)

### For Admins

1. **View Performance Insights**
   - Login as admin
   - Go to System Overview
   - See completion rate and satisfaction metrics

2. **Analyze Trends**
   - View by time period (7, 30, 90 days)
   - Compare metrics over time
   - Identify improvement areas

---

## 🧪 Testing Workflow

### Complete Test

1. **Setup**
   ```powershell
   # Seed feedback data
   .\test-feedback-system.ps1
   ```

2. **Verify Data**
   - Check that feedback was created
   - Verify ratings distribution
   - Confirm satisfaction rate

3. **Test API**
   ```powershell
   # Get insights
   $headers = @{ "Authorization" = "Bearer YOUR_TOKEN" }
   Invoke-RestMethod -Uri "http://localhost:5002/api/admin/performance-insights" -Headers $headers
   ```

4. **Test Frontend**
   - Login as admin
   - View System Overview
   - Check Performance Insights section
   - Verify numbers match API response

---

## 🔧 Troubleshooting

### "No feedback data"
**Solution:** Run seed script
```powershell
.\test-feedback-system.ps1
```

### "Need users and garages first"
**Solution:** Seed users and garages first
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed" -Method Post
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed-admin" -Method Post
```

### "Completion rate is 0%"
**Solution:** Create completed reservations
- The seed script automatically creates completed reservations
- Or manually complete some reservations

### "Customer satisfaction is 0%"
**Solution:** Add feedback with ratings
- Run seed-feedback script
- Or manually submit feedback as car owner

---

## 📈 Frontend Integration

To display Performance Insights in your frontend:

```typescript
// Fetch performance insights
const fetchInsights = async () => {
    const response = await api.get('/admin/performance-insights?period=30');
    const { completionRate, customerSatisfaction, averageRating } = response.data.data;
    
    // Display in UI
    setCompletionRate(completionRate);
    setCustomerSatisfaction(customerSatisfaction);
    setAverageRating(averageRating);
};
```

**Display Example:**
```tsx
<div className="performance-insights">
    <div className="metric">
        <h3>Completion Rate</h3>
        <p>{completionRate}%</p>
    </div>
    <div className="metric">
        <h3>Customer Satisfaction</h3>
        <p>{customerSatisfaction}%</p>
    </div>
    <div className="metric">
        <h3>Average Rating</h3>
        <p>{averageRating}/5.0</p>
    </div>
</div>
```

---

## ✅ Success Checklist

- [ ] Feedback model exists
- [ ] Feedback controller implemented
- [ ] Performance insights endpoint working
- [ ] Seed script creates test data
- [ ] API returns correct metrics
- [ ] Frontend displays insights
- [ ] Car owners can submit feedback
- [ ] Garage owners can view feedback
- [ ] Admins can see performance metrics

---

## 🎉 Summary

The feedback system is now fully functional with:
- ✅ Feedback submission for completed reservations
- ✅ Performance insights API
- ✅ Completion rate calculation
- ✅ Customer satisfaction metrics
- ✅ Average rating tracking
- ✅ Seed script for testing
- ✅ Admin analytics endpoint

**Test it now:**
```powershell
.\test-feedback-system.ps1
```

Then login as admin and view the Performance Insights!
