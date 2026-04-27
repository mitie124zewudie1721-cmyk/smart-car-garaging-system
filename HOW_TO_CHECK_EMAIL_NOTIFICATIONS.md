# How to Check Email Notifications - Step by Step

## Complete Testing Guide

Follow these steps EXACTLY to test if email notifications are working.

---

## PART 1: Setup (One-Time Only)

### Step 1: Install Nodemailer Package

Open PowerShell in the backend folder:

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm install nodemailer
```

**Expected Output:**
```
added 1 package, and audited 123 packages in 3s
```

---

### Step 2: Get Gmail App Password

1. **Open Google Account Settings:**
   - Go to: https://myaccount.google.com/security

2. **Enable 2-Step Verification:**
   - Scroll down to "2-Step Verification"
   - Click and follow the steps to enable it
   - You'll need your phone for verification

3. **Generate App Password:**
   - After enabling 2-Step, scroll down to "App passwords"
   - Click "App passwords"
   - Select "Mail" from first dropdown
   - Select "Other (Custom name)" from second dropdown
   - Type: "Smart Garaging"
   - Click "Generate"
   - **COPY THE 16-CHARACTER PASSWORD** (looks like: abcd efgh ijkl mnop)
   - Remove spaces: abcdefghijklmnop

---

### Step 3: Configure Email in .env File

1. **Open file:** `backend/.env`

2. **Add these lines at the end:**

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

3. **Replace:**
   - `your-actual-email@gmail.com` → Your real Gmail address
   - `abcdefghijklmnop` → The 16-character App Password you copied

4. **Save the file** (Ctrl+S)

---

### Step 4: Add Email Addresses to Test Users

Run this command:

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
node add-emails-to-users.js
```

**Expected Output:**
```
📧 Adding Email Addresses to Users

Connecting to MongoDB...
✅ Connected to MongoDB

Updating users with email addresses...

✅ Updated "carowner" with email: carowner@test.com
✅ Updated "garageowner" with email: garageowner@test.com
✅ Updated "admin" with email: admin@test.com
✅ Updated "demeke" with email: demeke@test.com
✅ Updated "kene" with email: kene@test.com

📊 Summary:
   Updated: 5
   Already had email: 0
   Not found: 0
   Total processed: 5
```

---

### Step 5: Restart Backend Server

1. **Stop the backend** (if running):
   - Press `Ctrl+C` in the backend terminal

2. **Start it again:**

```powershell
npm run dev
```

3. **Look for this line in the output:**

```
✅ Email service is ready
```

**If you see this, email service is configured correctly!**

**If you see:**
```
⚠️ Email service is disabled or not configured
```
**Go back to Step 3 and check your .env file.**

---

## PART 2: Testing (Check if Emails Work)

### Test Method 1: Quick Test with Script

This is the EASIEST way to test:

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
node test-notifications.js
```

**What happens:**
1. Script creates 3 test notifications for user "kene"
2. Emails are sent to kene@test.com
3. Check your email inbox!

**Expected Output:**
```
🔔 Testing Notification System

Connecting to MongoDB...
✅ Connected to MongoDB

Found garage owner: kene (699c9b02b0cecc433145fbe7)

Creating test notifications...
✅ Created 3 test notifications

📊 Notification Summary:
   User: kene
   User ID: 699c9b02b0cecc433145fbe7
   Unread Notifications: 3
   Total Notifications: 3
```

**Check Backend Logs:**
Look for these lines in your backend terminal:
```
✅ Email sent: 📅 New Booking Request to kene@test.com (message-id)
✅ Email sent: ✅ Booking Confirmed to kene@test.com (message-id)
✅ Email sent: 💰 Payment Received to kene@test.com (message-id)
```

**Check Your Email:**
1. Open your email inbox (the Gmail you configured)
2. Look for 3 emails from "Smart Garaging"
3. Subject lines:
   - 📅 New Booking Request
   - ✅ Booking Confirmed
   - 💰 Payment Received

**If you received the emails: ✅ EMAIL NOTIFICATIONS ARE WORKING!**

---

### Test Method 2: Real Scenario Test

This tests the complete flow:

#### Step 1: Update Garage Owner Email

First, let's make sure the garage owner has YOUR email address:

```powershell
# In MongoDB or create a script
# We'll update garageowner's email to YOUR email
```

Or manually in MongoDB:
1. Open MongoDB Compass
2. Connect to your database
3. Find `users` collection
4. Find user with username "garageowner"
5. Edit the document
6. Set `email` field to YOUR Gmail address
7. Save

#### Step 2: Make a Booking

1. **Open browser:** http://localhost:5173

2. **Login as Car Owner:**
   - Username: `carowner`
   - Password: `carowner123`

3. **Find a Garage:**
   - Click "Find Garage" in sidebar
   - Search for garages
   - Click "Book Now" on any garage

4. **Fill Booking Form:**
   - Select vehicle
   - Choose service type
   - Pick date and time
   - Click "Submit Booking"

#### Step 3: Check Email

**Immediately check YOUR email inbox!**

You should receive an email:
- **Subject:** 📅 New Booking Request
- **From:** Smart Garaging
- **Content:** Beautiful HTML email with booking details

**If you received it: ✅ REAL SCENARIO WORKS!**

---

## PART 3: Check Backend Logs

### What to Look For

When email is sent, you'll see these logs in backend terminal:

**Success:**
```
✅ Email sent: 📅 New Booking Request to garageowner@test.com (1234567890@gmail.com)
```

**Failure:**
```
❌ Failed to send email to garageowner@test.com: Invalid login: 535-5.7.8 Username and Password not accepted
```

---

## PART 4: Troubleshooting

### Problem 1: "Email service is disabled"

**Solution:**
1. Check `backend/.env` file
2. Make sure `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Make sure all EMAIL_ variables are set
4. Restart backend

---

### Problem 2: "Invalid login" or "Authentication failed"

**Solution:**
1. Make sure you're using **App Password**, not regular Gmail password
2. App Password should be 16 characters
3. No spaces in the password
4. Generate a new App Password and try again

---

### Problem 3: No Email Received

**Check 1: Spam Folder**
- Check your spam/junk folder
- Mark as "Not Spam" if found there

**Check 2: Backend Logs**
- Look for "✅ Email sent" in backend logs
- If you see it, email was sent successfully
- Check spam folder again

**Check 3: Email Address**
- Make sure user has email in database
- Run: `node add-emails-to-users.js` again

**Check 4: Gmail Settings**
- Make sure "Less secure app access" is OFF (we're using App Password)
- Make sure 2-Step Verification is ON

---

### Problem 4: "User has no email address"

**Solution:**
```powershell
node add-emails-to-users.js
```

This adds emails to all test users.

---

## PART 5: Verify Everything Works

### Checklist

Use this checklist to verify:

```
□ Step 1: Nodemailer installed (npm install nodemailer)
□ Step 2: Gmail App Password generated
□ Step 3: .env file configured with EMAIL_ variables
□ Step 4: Test users have email addresses (node add-emails-to-users.js)
□ Step 5: Backend restarted (npm run dev)
□ Step 6: Backend shows "✅ Email service is ready"
□ Step 7: Test script run (node test-notifications.js)
□ Step 8: Backend logs show "✅ Email sent"
□ Step 9: Email received in inbox
□ Step 10: Real booking test works
```

---

## PART 6: What Emails Look Like

### Email Structure

```
┌─────────────────────────────────────────┐
│ Smart Garaging                          │ ← Purple gradient header
│ Your Garage Service Platform            │
├─────────────────────────────────────────┤
│ Hello kene,                             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 New Booking Request              │ │ ← Color-coded box
│ │                                     │ │
│ │ You have a new booking request for  │ │
│ │ Oil Change service                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│        [View in App]                    │ ← Button
│                                         │
│ You can also view this notification    │
│ in your dashboard...                    │
├─────────────────────────────────────────┤
│ © 2026 Smart Garaging System           │ ← Footer
│ This is an automated notification      │
└─────────────────────────────────────────┘
```

### Email Colors by Type

- 📅 **New Booking** - Blue background
- ✅ **Confirmed** - Green background
- ❌ **Cancelled** - Red background
- 💰 **Payment** - Green background
- 🚨 **Dispute** - Orange background

---

## Summary

### Quick Test (Easiest):
```powershell
cd backend
node test-notifications.js
```
Then check your email!

### Real Test:
1. Login as car owner
2. Make a booking
3. Check garage owner's email
4. Email should arrive immediately

### Success Indicators:
- ✅ Backend logs: "✅ Email sent"
- ✅ Email in inbox
- ✅ Beautiful HTML email with colors and button

**If you see all three: EMAIL NOTIFICATIONS ARE WORKING!**

---

## Need Help?

If emails still don't work after following all steps:

1. **Share backend logs** (the part with email sending)
2. **Share .env EMAIL_ variables** (hide the password)
3. **Tell me what error you see**

I'll help you debug!
