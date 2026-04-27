# Test Email Notifications - Simple 5-Step Guide

## Just Follow These 5 Steps

### Step 1: Install Package (30 seconds)

Open PowerShell:

```powershell
cd C:\Users\hp\Desktop\ALL\smart-car-garaging-system\backend
npm install nodemailer
```

Wait for it to finish.

---

### Step 2: Get Gmail Password (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification" → Turn it ON
3. Click "App passwords"
4. Select "Mail" and "Other"
5. Type "Smart Garaging"
6. Click "Generate"
7. **COPY the 16-character password** (example: abcdefghijklmnop)

---

### Step 3: Edit .env File (1 minute)

1. Open file: `backend/.env`
2. Add these lines at the end:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=paste-16-char-password-here
EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

3. Replace `your-email@gmail.com` with YOUR Gmail
4. Replace `paste-16-char-password-here` with the password from Step 2
5. Save file (Ctrl+S)

---

### Step 4: Add Emails to Users (30 seconds)

```powershell
node add-emails-to-users.js
```

You should see:
```
✅ Updated "carowner" with email: carowner@test.com
✅ Updated "garageowner" with email: garageowner@test.com
✅ Updated "admin" with email: admin@test.com
```

---

### Step 5: Test It! (30 seconds)

**Restart backend:**
```powershell
npm run dev
```

**Look for this line:**
```
✅ Email service is ready
```

**Run test:**
```powershell
node test-notifications.js
```

**Check your email inbox!**

You should receive 3 emails from "Smart Garaging":
- 📅 New Booking Request
- ✅ Booking Confirmed
- 💰 Payment Received

---

## ✅ Success!

If you received the emails, **email notifications are working!**

---

## ❌ Didn't Work?

### Check 1: Backend Logs

Look for:
```
✅ Email sent: 📅 New Booking Request to kene@test.com
```

If you see this, email was sent. Check spam folder.

### Check 2: Error Messages

If you see:
```
❌ Failed to send email
```

**Solution:**
- Make sure you used App Password (not regular password)
- Make sure password has no spaces
- Make sure 2-Step Verification is enabled

### Check 3: Email Service

If you see:
```
⚠️ Email service is disabled
```

**Solution:**
- Check .env file
- Make sure `ENABLE_EMAIL_NOTIFICATIONS=true`
- Restart backend

---

## Quick Reference

### Commands:
```powershell
# Install
npm install nodemailer

# Add emails
node add-emails-to-users.js

# Start backend
npm run dev

# Test
node test-notifications.js
```

### What to Check:
1. Backend logs: "✅ Email service is ready"
2. Backend logs: "✅ Email sent"
3. Email inbox: 3 emails from "Smart Garaging"
4. Spam folder: If not in inbox

---

## That's It!

Just 5 steps and you're done. The system will automatically send emails whenever:
- New booking is made
- Booking is confirmed
- Payment is received
- Dispute is filed
- And more!

All emails are beautiful HTML with colors, icons, and buttons!
