# 🎯 Feedback System - Quick Start

## What You Need to Do

### 1️⃣ Start Backend Server
```powershell
cd backend
npm run dev
```
✅ Wait for: "MongoDB connected successfully"

---

### 2️⃣ Run Test Script
Open a **NEW** terminal and run:
```powershell
.\test-feedback-system.ps1
```

---

## What You'll See

```
========================================
Feedback System Test
========================================

Step 1: Seeding feedback data...
Success! Feedback seeded
Total Feedback: 15
Average Rating: 4.2/5
Customer Satisfaction: 80%

Step 2: Logging in as admin...
Logged in as admin

Step 3: Fetching Performance Insights...
Performance Insights Retrieved!

Completion Rate: 75.5%
Customer Satisfaction: 80.0%
Average Rating: 4.2/5.0

Total Reservations: 45
Completed: 34
Total Feedback: 15

Testing Complete!
```

---

## What Each Metric Means

| Metric | What It Shows | Good Target |
|--------|---------------|-------------|
| **Completion Rate** | % of reservations completed successfully | > 80% |
| **Customer Satisfaction** | % of customers who gave 4-5 stars | > 85% |
| **Average Rating** | Overall star rating | > 4.0/5.0 |

---

## That's It! 🎉

The feedback system is working if you see the metrics above.

For detailed information, see: `FEEDBACK_SYSTEM_STEP_BY_STEP.md`
