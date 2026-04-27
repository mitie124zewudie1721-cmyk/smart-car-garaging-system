# Email Notifications - Quick Start

## What You Have Now

✅ **Login System:** Username + Password (no email required for login)
✅ **Email Field:** Added to User model (optional)
✅ **Email Service:** Created with beautiful HTML templates
✅ **Scripts:** Ready to add emails and test

## 3-Step Setup

### Step 1: Install Package (1 minute)

```powershell
cd backend
npm install nodemailer
```

### Step 2: Configure Email (2 minutes)

Add to `backend/.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

**Get Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Click "App passwords"
4. Generate password for "Mail" / "Other"
5. Copy the 16-character password
6. Use it in `EMAIL_PASSWORD`

### Step 3: Add Emails to Users (30 seconds)

```powershell
cd backend
node add-emails-to-users.js
```

This adds emails to your test users:
- carowner@test.com
- garageowner@test.com
- admin@test.com

### Step 4: Restart Backend

```powershell
npm run dev
```

Look for: `✅ Email service is ready`

## Test It!

### Quick Test:
```powershell
node test-notifications.js
```

Check your email inbox! You should receive 3 notification emails.

### Real Test:
1. Login as car owner
2. Make a booking
3. Check garage owner's email
4. You'll receive "New Booking" email!

## How It Works

```
User Action → Create Notification → Send Email
                    ↓                    ↓
              In-App Bell          User's Email
```

**Example:**
1. Car owner makes booking
2. System creates notification for garage owner
3. Garage owner sees bell icon (🔔) in app
4. Garage owner receives email at garageowner@test.com

## Email Features

✅ Beautiful HTML design
✅ Color-coded by type
✅ Includes emoji icons
✅ "View in App" button
✅ Professional footer
✅ Responsive design

## When Emails Are Sent

- 📅 New booking request
- ✅ Booking confirmed
- ❌ Booking cancelled
- 💰 Payment received
- 🚨 Dispute filed
- ✅ Dispute resolved
- ✅ Garage approved
- ❌ Garage rejected

## Troubleshooting

### No Email Received?

**Check 1:** Email service enabled?
```
Look for: ✅ Email service is ready
in backend logs
```

**Check 2:** User has email?
```powershell
node add-emails-to-users.js
```

**Check 3:** Check spam folder

**Check 4:** Gmail App Password correct?
- Use App Password, not regular password
- 16 characters, no spaces

### Email Service Not Ready?

1. Check `.env` has all variables
2. Make sure `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Restart backend

## Summary

Your system now has:
- ✅ Username/password login (no email required)
- ✅ Optional email field for notifications
- ✅ Automatic email sending
- ✅ Beautiful email templates
- ✅ In-app notifications + Email notifications

Just follow the 4 steps above and you're done!
