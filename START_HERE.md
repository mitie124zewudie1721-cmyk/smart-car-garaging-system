# 🚀 START HERE - Feedback System Testing

## Your Error
```
PS C:\Users\hp> .\test-feedback-system.ps1
The term '.\test-feedback-system.ps1' is not recognized
```

**Problem:** You're in the wrong folder!

---

## Solution: Go to Your Project Folder First

### Step 1: Open PowerShell and Navigate to Project

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system
```

### Step 2: Start Backend (Keep This Running)

```powershell
cd backend
npm run dev
```

**Wait for:** "MongoDB connected successfully"

**Keep this window open!**

### Step 3: Open NEW PowerShell Window

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system
.\test-feedback-system.ps1
```

---

## Even Simpler: Use curl Commands

If the script still doesn't work, just use these commands:

### 1. Start Backend First
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm run dev
```

### 2. In NEW PowerShell, Test the System

```powershell
# Test 1: Seed feedback data
curl -X POST http://localhost:5002/api/dev/seed-feedback

# Test 2: Login as admin
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}'

# Test 3: Get insights (replace YOUR_TOKEN with token from step 2)
curl "http://localhost:5002/api/admin/performance-insights?period=30" -H "Authorization: Bearer YOUR_TOKEN"
```

---

## What You Should See

After running the seed-feedback command:
```json
{
  "success": true,
  "message": "Seeded 15 feedback entries",
  "data": {
    "totalFeedback": 15,
    "averageRating": 4.2,
    "customerSatisfaction": 80
  }
}
```

After getting performance insights:
```json
{
  "success": true,
  "data": {
    "completionRate": 75.5,
    "customerSatisfaction": 80.0,
    "averageRating": 4.2
  }
}
```

---

## Quick Commands (Copy & Paste)

**Terminal 1 - Start Backend:**
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm run dev
```

**Terminal 2 - Test Feedback:**
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system
curl -X POST http://localhost:5002/api/dev/seed-feedback
```

---

## That's It!

The feedback system is working if you see the JSON response with metrics.

**Key Point:** Always navigate to your project folder first before running any commands!
