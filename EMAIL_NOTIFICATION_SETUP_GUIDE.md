# Email Notification System - Complete Setup Guide

## Overview

Your system now supports:
1. **Login:** Username + Password (no email required for login)
2. **Email Notifications:** Optional email field for sending notifications

## What's Been Done

### 1. User Model Updated ✅
- Added optional `email` field to User model
- Email is NOT required for registration or login
- Email is used ONLY for sending notifications

### 2. Email Service Created ✅
- File: `backend/src/services/emailService.js`
- Uses nodemailer to send emails
- Beautiful HTML email templates
- Supports Gmail, Outlook, and other services

## Setup Instructions

### Step 1: Install Nodemailer

```powershell
cd backend
npm install nodemailer
```

### Step 2: Configure Environment Variables

Add these lines to `backend/.env`:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Step 3: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left menu
3. Enable "2-Step Verification" if not already enabled
4. Scroll down to "App passwords"
5. Click "App passwords"
6. Select "Mail" and "Other (Custom name)"
7. Enter "Smart Garaging" as the name
8. Click "Generate"
9. Copy the 16-character password
10. Use this password in `EMAIL_PASSWORD` (not your regular Gmail password)

### Step 4: Add Email to Existing Users

Run this script to add emails to your test users:

```javascript
// backend/add-emails-to-users.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function addEmails() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Update users with emails
        const updates = [
            { username: 'carowner', email: 'carowner@test.com' },
            { username: 'garageowner', email: 'garageowner@test.com' },
            { username: 'admin', email: 'admin@test.com' },
            { username: 'demeke', email: 'demeke@test.com' },
            { username: 'kene', email: 'kene@test.com' },
        ];

        for (const update of updates) {
            const result = await User.updateOne(
                { username: update.username },
                { $set: { email: update.email } }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`✅ Updated ${update.username} with email ${update.email}`);
            } else {
                console.log(`⚠️ User ${update.username} not found or already has email`);
            }
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addEmails();
```

Run it:
```powershell
node add-emails-to-users.js
```

### Step 5: Update Notification Controller

Add email sending to the `createNotification` function in `backend/src/controllers/notificationController.js`:

```javascript
import { sendNotificationEmail } from '../services/emailService.js';
import User from '../models/User.js';

// In createNotification function, after creating notification:
export const createNotification = async ({
    recipient,
    type,
    title,
    message,
    relatedModel,
    relatedId,
    actionUrl,
    priority = 'normal',
}) => {
    try {
        // Create in-app notification
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            relatedModel,
            relatedId,
            actionUrl,
            priority,
            isRead: false,
        });

        logger.info(`Notification created: ${type} for user ${recipient}`);

        // Send email notification
        try {
            const user = await User.findById(recipient).select('name email');
            
            if (user && user.email) {
                await sendNotificationEmail({
                    to: user.email,
                    userName: user.name,
                    title,
                    message,
                    type,
                    actionUrl: actionUrl ? `${process.env.CLIENT_URL}${actionUrl}` : `${process.env.CLIENT_URL}/dashboard`,
                });
            }
        } catch (emailError) {
            logger.error(`Failed to send email: ${emailError.message}`);
            // Don't fail notification creation if email fails
        }

        return notification;
    } catch (error) {
        logger.error(`Failed to create notification: ${error.message}`);
        throw error;
    }
};
```

### Step 6: Restart Backend

```powershell
# Stop backend (Ctrl+C)
npm run dev
```

You should see:
```
✅ Email service is ready
```

## How It Works

### When Notifications Are Created

1. **In-App Notification** is created in database
2. **Email** is sent to user's email address (if they have one)
3. If email fails, in-app notification still works

### Email Template Features

- Beautiful HTML design with gradient header
- Color-coded by notification type
- Includes notification icon (emoji)
- "View in App" button
- Responsive design
- Professional footer

### Notification Types and Colors

| Type | Icon | Email Color |
|------|------|-------------|
| booking_new | 📅 | Blue |
| booking_confirmed | ✅ | Green |
| booking_cancelled | ❌ | Red |
| payment_received | 💰 | Green |
| payment_failed | ⚠️ | Orange |
| dispute_new | 🚨 | Orange |
| dispute_resolved | ✅ | Green |
| garage_approved | ✅ | Green |
| garage_rejected | ❌ | Red |
| system | ℹ️ | Blue |

## Testing

### Test 1: Create Notification with Email

```powershell
node test-notifications.js
```

Check your email inbox for the notification emails!

### Test 2: Real Scenario

1. Login as car owner
2. Make a booking
3. Login as garage owner
4. Check email - you should receive "New Booking" email
5. Accept the booking
6. Login as car owner
7. Check email - you should receive "Booking Confirmed" email

## Troubleshooting

### Problem: No Email Received

**Check 1: Email service enabled?**
```
Look for: ✅ Email service is ready
in backend logs
```

**Check 2: User has email?**
```powershell
# Check in MongoDB or run:
node add-emails-to-users.js
```

**Check 3: Gmail App Password correct?**
- Make sure you're using App Password, not regular password
- App Password is 16 characters without spaces

**Check 4: Check spam folder**
- Emails might be in spam/junk folder

### Problem: Email Service Not Ready

**Solution:**
1. Check `.env` file has all email variables
2. Make sure `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Restart backend server

### Problem: Authentication Failed

**Solution:**
1. Enable 2-Step Verification in Google Account
2. Generate new App Password
3. Update `EMAIL_PASSWORD` in `.env`
4. Restart backend

## Email Service Configuration

### Using Gmail (Recommended)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Using Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Using Custom SMTP
```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false
```

## User Registration with Email (Optional)

If you want users to provide email during registration, update the registration form:

### Frontend: `frontend/src/pages/Register.tsx`

Add email field:
```typescript
const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '', // Add this
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'car_owner',
});

// Add email input field in the form
<Input
    label="Email (Optional)"
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    placeholder="your-email@example.com"
/>
```

### Backend: Already supports email in registration

The backend already accepts email in registration, it's just optional.

## Summary

✅ Login: Username + Password (no email required)
✅ Email Field: Optional, used for notifications only
✅ Email Service: Configured with nodemailer
✅ Email Templates: Beautiful HTML emails
✅ Automatic Sending: Emails sent when notifications created
✅ Fallback: If email fails, in-app notification still works

## Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Configure `.env` with Gmail credentials
3. Run `node add-emails-to-users.js` to add emails to test users
4. Restart backend
5. Test by creating a booking
6. Check your email!

The email notification system is ready to use!
