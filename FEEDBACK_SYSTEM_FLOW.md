# Feedback System Flow Diagram

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    FEEDBACK SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. CAR OWNER COMPLETES SERVICE
   ↓
   [Reservation Status: "completed"]
   ↓

2. CAR OWNER LEAVES FEEDBACK
   ↓
   POST /api/feedback
   {
     reservation: "reservation_id",
     garage: "garage_id",
     rating: 5,
     comment: "Great service!"
   }
   ↓

3. FEEDBACK STORED IN DATABASE
   ↓
   [Feedback Collection]
   - rating (1-5 stars)
   - comment
   - createdAt timestamp
   ↓

4. ADMIN VIEWS PERFORMANCE INSIGHTS
   ↓
   GET /api/admin/performance-insights?period=30
   ↓

5. SYSTEM CALCULATES METRICS
   ↓
   ┌─────────────────────────────────────┐
   │  COMPLETION RATE                    │
   │  = (Completed / Total) × 100        │
   │  = (34 / 45) × 100 = 75.5%         │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │  CUSTOMER SATISFACTION              │
   │  = (4-5 stars / Total) × 100        │
   │  = (12 / 15) × 100 = 80%           │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │  AVERAGE RATING                     │
   │  = Sum of ratings / Total           │
   │  = 63 / 15 = 4.2/5.0               │
   └─────────────────────────────────────┘
   ↓

6. METRICS DISPLAYED IN ADMIN DASHBOARD
   ↓
   [Admin sees performance cards]
```

---

## Database Collections Used

### Reservations Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Car owner
  garage: ObjectId,      // Garage
  vehicle: ObjectId,     // Vehicle
  status: "completed",   // Used for completion rate
  createdAt: Date,
  // ... other fields
}
```

### Feedback Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Car owner who left feedback
  garage: ObjectId,      // Garage being reviewed
  reservation: ObjectId, // Related reservation
  rating: 5,            // 1-5 stars
  comment: "Great!",    // Optional comment
  createdAt: Date,
  // ... other fields
}
```

---

## API Endpoints

### For Testing (Development)
```
POST /api/dev/seed-feedback
→ Creates 15 sample feedback entries
```

### For Production (Admin Only)
```
GET /api/admin/performance-insights?period=30
→ Returns metrics for last 30 days
```

---

## Time Period Filtering

You can query different time ranges:

```javascript
// Last 7 days
?period=7

// Last 30 days (default)
?period=30

// Last 90 days
?period=90

// Last year
?period=365
```

The system filters by `createdAt` field:
```javascript
const daysAgo = new Date();
daysAgo.setDate(daysAgo.getDate() - period);

// Find all feedback created after this date
Feedback.find({ createdAt: { $gte: daysAgo } })
```

---

## Sample Response

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

## Frontend Integration

The metrics can be displayed in the admin dashboard:

```typescript
// Fetch performance insights
const response = await api.get('/admin/performance-insights?period=30');

// Display in cards
<Card>
  <h3>Completion Rate</h3>
  <p>{response.data.completionRate}%</p>
</Card>

<Card>
  <h3>Customer Satisfaction</h3>
  <p>{response.data.customerSatisfaction}%</p>
</Card>

<Card>
  <h3>Average Rating</h3>
  <p>{response.data.averageRating}/5.0</p>
</Card>
```

---

## Security

- ✅ Admin authentication required
- ✅ JWT token validation
- ✅ Role-based access control (admin only)
- ✅ Input validation and sanitization

---

## Error Handling

The system handles:
- Missing feedback data (returns 0%)
- No reservations (returns 0%)
- Invalid time periods (defaults to 30 days)
- Database connection errors
- Authentication failures

---

## Next Steps

1. ✅ Backend is ready
2. ✅ Test script is ready
3. ✅ API endpoints are working
4. 🔄 Frontend integration (optional)
5. 🔄 Real-time updates (optional)
6. 🔄 Email notifications (optional)

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/src/controllers/adminController.js` | Performance insights logic |
| `backend/src/routes/adminRoutes.js` | Admin API routes |
| `backend/src/routes/seedFeedback.js` | Test data seeding |
| `backend/src/models/Feedback.js` | Feedback schema |
| `test-feedback-system.ps1` | Testing script |
| `FEEDBACK_SYSTEM_STEP_BY_STEP.md` | Detailed guide |
| `FEEDBACK_QUICK_START.md` | Quick reference |

---

## Summary

The feedback system is fully functional and ready to use! Just start the backend server and run the test script to see it in action.
