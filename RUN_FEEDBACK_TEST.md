# 🎯 Where to Run the Feedback Test

## You Need to Be in the Project Directory!

You're currently here:
```
C:\Users\hp>
```

But you need to be here:
```
C:\Users\hp\Desktop\ALL\smart-car-garaging-system>
```

---

## Step-by-Step Instructions

### 1. Navigate to Your Project Folder

```powershell
cd Desktop\ALL\smart-car-garaging-system
```

### 2. Start Backend (Terminal 1)

```powershell
cd backend
npm run dev
```

Keep this terminal open!

### 3. Run Test Script (Terminal 2)

Open a NEW PowerShell window and run:

```powershell
cd Desktop\ALL\smart-car-garaging-system
.\test-feedback-system.ps1
```

---

## Full Commands

Copy and paste these commands:

### Terminal 1 (Backend):
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm run dev
```

### Terminal 2 (Test Script):
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system
.\test-feedback-system.ps1
```

---

## Alternative: Manual Testing with curl

If you prefer to test manually without the script:

### 1. Start Backend
```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm run dev
```

### 2. In a NEW terminal, run these commands:

```powershell
# Seed feedback data
curl -X POST http://localhost:5002/api/dev/seed-feedback

# Login as admin
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}'

# Copy the token from the response, then:
curl "http://localhost:5002/api/admin/performance-insights?period=30" -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Quick Summary

**The issue:** You're in the wrong directory (`C:\Users\hp`)

**The solution:** Navigate to your project folder first:
```powershell
cd Desktop\ALL\smart-car-garaging-system
```

Then run the test script:
```powershell
.\test-feedback-system.ps1
```

---

## Visual Guide

```
❌ Wrong:
C:\Users\hp> .\test-feedback-system.ps1
(File not found - you're in the wrong folder!)

✅ Correct:
C:\Users\hp> cd Desktop\ALL\smart-car-garaging-system
C:\Users\hp\Desktop\ALL\smart-car-garaging-system> .\test-feedback-system.ps1
(File found - script runs!)
```

---

## Need Help?

If you're not sure where your project is located, run:

```powershell
dir Desktop\ALL\smart-car-garaging-system
```

This will show you if the folder exists. If it does, navigate there and run the script!
