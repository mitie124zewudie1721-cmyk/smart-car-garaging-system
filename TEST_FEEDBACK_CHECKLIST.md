# ✅ Feedback System Testing Checklist

## Before You Start

- [ ] MongoDB is running
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] You're in the project root directory

---

## Testing Steps

### Step 1: Start Backend Server
- [ ] Open terminal
- [ ] Run: `cd backend`
- [ ] Run: `npm run dev`
- [ ] Wait for: "MongoDB connected successfully"
- [ ] **Keep this terminal open**

### Step 2: Run Test Script
- [ ] Open **NEW** terminal (don't close the first one)
- [ ] Make sure you're in project root
- [ ] Run: `.\test-feedback-system.ps1`

### Step 3: Verify Results
- [ ] See "Success! Feedback seeded"
- [ ] See "Logged in as admin"
- [ ] See "Performance Insights Retrieved!"
- [ ] See metrics:
  - [ ] Completion Rate (should be around 75%)
  - [ ] Customer Satisfaction (should be around 80%)
  - [ ] Average Rating (should be around 4.2/5.0)

---

## Expected Output

```
✅ Step 1: Seeding feedback data...
   Success! Feedback seeded
   Total Feedback: 15
   Average Rating: 4.2/5
   Customer Satisfaction: 80%

✅ Step 2: Logging in as admin...
   Logged in as admin

✅ Step 3: Fetching Performance Insights...
   Performance Insights Retrieved!
   
   Completion Rate: 75.5%
   Customer Satisfaction: 80.0%
   Average Rating: 4.2/5.0
   
   Total Reservations: 45
   Completed: 34
   Total Feedback: 15

✅ Testing Complete!
```

---

## If Something Goes Wrong

### ❌ Backend won't start
**Check:**
- [ ] Is MongoDB running?
- [ ] Is port 5002 available?
- [ ] Did you run `npm install`?

**Fix:**
```powershell
# Check if something is using port 5002
netstat -ano | findstr :5002

# If needed, change port in backend/.env
PORT=5003
```

### ❌ Test script fails
**Check:**
- [ ] Is backend running?
- [ ] Are you in the project root?
- [ ] Does admin account exist?

**Fix:**
```powershell
# Create admin account
curl -X POST http://localhost:5002/api/dev/seed-admin
```

### ❌ "Cannot access 'getPerformanceInsights'"
**Fix:**
- [ ] Restart the backend server
- [ ] The code is already fixed, just needs a restart

### ❌ Metrics show 0%
**Check:**
- [ ] Did the seed-feedback endpoint run successfully?
- [ ] Are there reservations in the database?

**Fix:**
```powershell
# Seed garages first
curl -X POST http://localhost:5002/api/dev/seed

# Seed analytics (includes reservations)
curl -X POST http://localhost:5002/api/dev/seed-analytics

# Then seed feedback
curl -X POST http://localhost:5002/api/dev/seed-feedback
```

---

## Manual Testing (Alternative)

If the script doesn't work, test manually:

### 1. Create Admin
```powershell
curl -X POST http://localhost:5002/api/dev/seed-admin
```
- [ ] Response: "Admin user created"

### 2. Login
```powershell
curl -X POST http://localhost:5002/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'
```
- [ ] Response includes `"token": "eyJ..."`
- [ ] Copy the token

### 3. Seed Feedback
```powershell
curl -X POST http://localhost:5002/api/dev/seed-feedback
```
- [ ] Response: "Seeded X feedback entries"

### 4. Get Insights
```powershell
curl "http://localhost:5002/api/admin/performance-insights?period=30" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Response includes completionRate, customerSatisfaction, averageRating

---

## Success Criteria

You've successfully tested the feedback system if:

- ✅ Backend starts without errors
- ✅ Test script runs without errors
- ✅ You see performance metrics
- ✅ Metrics show reasonable values (not all 0%)
- ✅ No error messages in either terminal

---

## What's Next?

After successful testing:

- [ ] View metrics in admin dashboard (frontend)
- [ ] Create real feedback by completing reservations
- [ ] Monitor trends over time
- [ ] Adjust time periods to see different ranges

---

## Quick Reference

| What | Command |
|------|---------|
| Start backend | `cd backend; npm run dev` |
| Run test | `.\test-feedback-system.ps1` |
| Seed admin | `curl -X POST http://localhost:5002/api/dev/seed-admin` |
| Seed feedback | `curl -X POST http://localhost:5002/api/dev/seed-feedback` |
| Health check | `curl http://localhost:5002/health` |

---

## Documentation

- `HOW_TO_TEST_FEEDBACK.md` - Simple guide
- `FEEDBACK_QUICK_START.md` - Quick start
- `FEEDBACK_SYSTEM_STEP_BY_STEP.md` - Detailed steps
- `FEEDBACK_SYSTEM_READY.md` - Status summary

---

**Ready to test? Start with Step 1!** 🚀
