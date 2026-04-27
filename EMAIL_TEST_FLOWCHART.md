# Email Notification Testing - Visual Flowchart

## Quick Visual Guide

```
START HERE
    ↓
┌─────────────────────────────────────────┐
│ Step 1: Install Package                 │
│ Command: npm install nodemailer         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: Get Gmail App Password          │
│ 1. Go to myaccount.google.com/security  │
│ 2. Enable 2-Step Verification           │
│ 3. Generate App Password                │
│ 4. Copy 16-character password           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Configure .env File             │
│ Add:                                    │
│ EMAIL_SERVICE=gmail                     │
│ EMAIL_USER=your@gmail.com               │
│ EMAIL_PASSWORD=16charpassword           │
│ ENABLE_EMAIL_NOTIFICATIONS=true         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Add Emails to Users             │
│ Command: node add-emails-to-users.js    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Restart Backend                 │
│ Command: npm run dev                    │
│ Look for: ✅ Email service is ready     │
└─────────────────────────────────────────┘
    ↓
    ├─────────────────┬─────────────────┐
    ↓                 ↓                 ↓
┌─────────┐    ┌──────────┐    ┌──────────┐
│ Quick   │    │ Script   │    │ Real     │
│ Test    │    │ Test     │    │ Scenario │
└─────────┘    └──────────┘    └──────────┘
    ↓                 ↓                 ↓
```

---

## Testing Methods Comparison

### Method 1: Quick Test (EASIEST) ⭐

```
Command: node test-notifications.js
         ↓
Creates 3 notifications
         ↓
Sends 3 emails
         ↓
Check your inbox!
```

**Time:** 30 seconds
**Difficulty:** Easy
**Best for:** First-time testing

---

### Method 2: Real Scenario (COMPLETE)

```
Login as car owner
         ↓
Make a booking
         ↓
System creates notification
         ↓
Email sent to garage owner
         ↓
Check garage owner's email
```

**Time:** 2 minutes
**Difficulty:** Medium
**Best for:** Full system test

---

## What Happens When Email is Sent

```
User Action (e.g., Make Booking)
         ↓
Backend Controller
         ↓
Create Notification Function
         ↓
    ┌───┴───┐
    ↓       ↓
Save to    Send Email
Database   (nodemailer)
    ↓       ↓
    ↓   Gmail SMTP
    ↓       ↓
Bell Icon  User's Email
in App     Inbox
```

---

## Success Indicators

### ✅ Backend Logs Show:

```
✅ Email service is ready
✅ Email sent: 📅 New Booking Request to kene@test.com
```

### ✅ Email Inbox Shows:

```
From: Smart Garaging
Subject: 📅 New Booking Request
[Beautiful HTML email with colors]
```

### ✅ In-App Shows:

```
Bell icon: 🔔 3
Dropdown: List of notifications
```

---

## Troubleshooting Decision Tree

```
Email not received?
    ↓
Check backend logs
    ↓
    ├─ "Email service is disabled"
    │       ↓
    │   Check .env file
    │   ENABLE_EMAIL_NOTIFICATIONS=true?
    │
    ├─ "Invalid login"
    │       ↓
    │   Check App Password
    │   16 characters? No spaces?
    │
    ├─ "User has no email"
    │       ↓
    │   Run: node add-emails-to-users.js
    │
    └─ "✅ Email sent"
            ↓
        Check spam folder
        Check email address
```

---

## Complete Setup Checklist

```
□ 1. npm install nodemailer
□ 2. Gmail App Password generated
□ 3. .env configured
□ 4. Users have emails
□ 5. Backend restarted
□ 6. "✅ Email service is ready" shown
□ 7. Test script run
□ 8. Email received
```

---

## Quick Commands Reference

### Setup:
```powershell
cd backend
npm install nodemailer
node add-emails-to-users.js
npm run dev
```

### Test:
```powershell
node test-notifications.js
```

### Check:
- Backend logs: Look for "✅ Email sent"
- Email inbox: Check for "Smart Garaging" emails
- Spam folder: If not in inbox

---

## Email Template Preview

```
┌──────────────────────────────────────┐
│ ████████████████████████████████████ │ ← Purple gradient
│ Smart Garaging                       │
│ Your Garage Service Platform         │
├──────────────────────────────────────┤
│                                      │
│ Hello kene,                          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 📅 New Booking Request           │ │ ← Blue box
│ │                                  │ │
│ │ You have a new booking request   │ │
│ │ for Oil Change service           │ │
│ └──────────────────────────────────┘ │
│                                      │
│      ┌──────────────────┐            │
│      │  View in App     │            │ ← Button
│      └──────────────────┘            │
│                                      │
├──────────────────────────────────────┤
│ © 2026 Smart Garaging System         │
│ This is an automated notification    │
└──────────────────────────────────────┘
```

---

## Summary

**Fastest Way to Test:**
1. Run: `node test-notifications.js`
2. Check your email
3. Done!

**If it works:**
- ✅ You'll see "✅ Email sent" in logs
- ✅ You'll receive 3 beautiful emails
- ✅ System is ready!

**If it doesn't work:**
- Check backend logs for errors
- Verify .env configuration
- Check spam folder
- Follow troubleshooting guide
