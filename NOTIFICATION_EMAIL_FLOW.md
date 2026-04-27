# 📧 Notification + Email Flow - How It Works

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTION                                  │
│  (e.g., Car Owner makes a booking)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND: reservationController.js                  │
│  - Creates reservation in database                             │
│  - Calls: createNotification(data)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│           BACKEND: notificationController.js                    │
│  createNotification() function                                  │
│                                                                 │
│  Step 1: Create in-app notification                            │
│  ✅ Notification saved to MongoDB                              │
│                                                                 │
│  Step 2: Fetch user from database                              │
│  ✅ Get user email, name, username                             │
│                                                                 │
│  Step 3: Check if user has email                               │
│  ✅ If yes → Send email (async)                                │
│  ⚠️  If no → Skip email, log message                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND: emailService.js                           │
│  sendNotificationEmail() function                               │
│                                                                 │
│  - Checks if email service is enabled                          │
│  - Creates beautiful HTML email                                │
│  - Sends via nodemailer (Gmail)                                │
│  - Logs success/failure                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    ↓               ↓
        ┌───────────────────┐   ┌───────────────────┐
        │   IN-APP          │   │   EMAIL           │
        │   NOTIFICATION    │   │   NOTIFICATION    │
        │                   │   │                   │
        │ • Bell icon       │   │ • Gmail inbox     │
        │ • Red badge       │   │ • HTML email      │
        │ • Notification    │   │ • Color-coded     │
        │   list            │   │ • "View in App"   │
        │                   │   │   button          │
        └───────────────────┘   └───────────────────┘
                    ↓               ↓
        ┌───────────────────┐   ┌───────────────────┐
        │ User clicks       │   │ User clicks       │
        │ bell icon         │   │ email link        │
        │      ↓            │   │      ↓            │
        │ Sees notification │   │ Opens app         │
        └───────────────────┘   └───────────────────┘
```

---

## Code Flow

### 1. Notification Creation (Any Controller)

```javascript
// Example: reservationController.js
import { createNotification } from '../controllers/notificationController.js';

// When booking is created
await createNotification({
    recipient: garageOwnerId,
    title: 'New Booking Request',
    message: `You have a new booking request for ${serviceType}`,
    type: 'booking_new',
    actionUrl: `/bookings/${reservation._id}`,
});
```

### 2. Notification Controller (UPDATED)

```javascript
// notificationController.js
export const createNotification = async (data) => {
    // Step 1: Create in-app notification
    const notification = await Notification.create(data);
    
    // Step 2: Fetch user
    const user = await User.findById(data.recipient).select('email name username');
    
    // Step 3: Send email if user has email
    if (user && user.email) {
        sendNotificationEmail({
            to: user.email,
            userName: user.name || user.username,
            title: data.title,
            message: data.message,
            type: data.type,
            actionUrl: data.actionUrl,
        });
    }
    
    return notification;
};
```

### 3. Email Service

```javascript
// emailService.js
export const sendNotificationEmail = async ({
    to, userName, title, message, type, actionUrl
}) => {
    // Create beautiful HTML email
    const html = `
        <html>
            <body>
                <h1>Smart Garaging</h1>
                <p>Hello ${userName},</p>
                <div style="background: ${getColor(type)}">
                    <h2>${getIcon(type)} ${title}</h2>
                    <p>${message}</p>
                </div>
                <a href="${actionUrl}">View in App</a>
            </body>
        </html>
    `;
    
    // Send via nodemailer
    await transporter.sendMail({
        from: 'Smart Garaging',
        to: to,
        subject: `${getIcon(type)} ${title}`,
        html: html,
    });
};
```

---

## Notification Types & Email Styles

### 1. Booking Notifications

**Type:** `booking_new`
- **Icon:** 📅
- **Color:** Blue (#e3f2fd)
- **Sent to:** Garage Owner
- **When:** Car owner makes booking

**Type:** `booking_confirmed`
- **Icon:** ✅
- **Color:** Green (#e8f5e9)
- **Sent to:** Car Owner
- **When:** Garage owner confirms booking

**Type:** `booking_cancelled`
- **Icon:** ❌
- **Color:** Red (#ffebee)
- **Sent to:** Both
- **When:** Either party cancels

---

### 2. Payment Notifications

**Type:** `payment_received`
- **Icon:** 💰
- **Color:** Green (#e8f5e9)
- **Sent to:** Garage Owner
- **When:** Payment successful

**Type:** `payment_failed`
- **Icon:** ⚠️
- **Color:** Orange (#fff3e0)
- **Sent to:** Car Owner
- **When:** Payment fails

---

### 3. Dispute Notifications

**Type:** `dispute_new`
- **Icon:** 🚨
- **Color:** Orange (#fff3e0)
- **Sent to:** Garage Owner
- **When:** Car owner files dispute

**Type:** `dispute_resolved`
- **Icon:** ✅
- **Color:** Green (#e8f5e9)
- **Sent to:** Both
- **When:** Admin resolves dispute

---

### 4. Admin Notifications

**Type:** `garage_approved`
- **Icon:** ✅
- **Color:** Green (#e8f5e9)
- **Sent to:** Garage Owner
- **When:** Admin approves garage

**Type:** `garage_rejected`
- **Icon:** ❌
- **Color:** Red (#ffebee)
- **Sent to:** Garage Owner
- **When:** Admin rejects garage

---

### 5. System Notifications

**Type:** `system`
- **Icon:** ℹ️
- **Color:** Blue (#e3f2fd)
- **Sent to:** Any user
- **When:** System announcements

---

## Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Notification</title>
</head>
<body style="background: #f4f4f4; padding: 20px;">
    <table width="600" style="background: white; border-radius: 8px;">
        <!-- HEADER -->
        <tr>
            <td style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px;">
                <h1 style="color: white;">Smart Garaging</h1>
                <p style="color: white;">Your Garage Service Platform</p>
            </td>
        </tr>
        
        <!-- CONTENT -->
        <tr>
            <td style="padding: 40px;">
                <p>Hello {userName},</p>
                
                <div style="background: {color}; border-left: 4px solid {borderColor}; padding: 20px;">
                    <h2>{icon} {title}</h2>
                    <p>{message}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{actionUrl}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 30px; border-radius: 6px;">
                        View in App
                    </a>
                </div>
            </td>
        </tr>
        
        <!-- FOOTER -->
        <tr>
            <td style="background: #f8f9fa; padding: 20px; text-align: center;">
                <p>© 2026 Smart Garaging System</p>
                <p>This is an automated notification</p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Configuration

### .env Variables

```env
# Email Service Configuration
EMAIL_SERVICE=gmail                                    # Email provider
EMAIL_USER=your-email@gmail.com                       # Your Gmail
EMAIL_PASSWORD=abcdefghijklmnop                       # 16-char App Password
EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com> # From address
ENABLE_EMAIL_NOTIFICATIONS=true                       # Enable/disable
```

---

## Error Handling

### Graceful Degradation

```javascript
try {
    // Create notification (always succeeds)
    const notification = await Notification.create(data);
    
    try {
        // Try to send email (may fail)
        if (user && user.email) {
            await sendNotificationEmail(...);
        }
    } catch (emailError) {
        // Log error but don't fail notification
        logger.error('Email failed', emailError);
    }
    
    return notification; // Always returns notification
} catch (error) {
    // Only fails if notification creation fails
    throw error;
}
```

### What This Means:

✅ **Notification always works** (in-app)
✅ **Email is bonus** (if configured)
✅ **System never breaks** (graceful errors)

---

## Testing Checklist

### Quick Test:
```powershell
□ npm install nodemailer
□ Configure .env with EMAIL_ variables
□ node add-emails-to-users.js
□ npm run dev (check for "✅ Email service is ready")
□ node test-notifications.js
□ Check email inbox
```

### Real Test:
```powershell
□ Login as car owner
□ Make a booking
□ Check garage owner email
□ Verify email received
□ Check in-app notification
□ Verify bell icon shows badge
```

---

## Success Indicators

### Backend Logs:
```
✅ Email service is ready
Notification created: 507f1f77bcf86cd799439011 for user 699c9b02b0cecc433145fbe7
✅ Email notification queued for user 699c9b02b0cecc433145fbe7 (kene@test.com)
✅ Email sent: 📅 New Booking Request to kene@test.com (message-id)
```

### Email Received:
- ✅ Beautiful HTML email
- ✅ Purple gradient header
- ✅ Color-coded notification box
- ✅ "View in App" button
- ✅ Professional footer

### In-App:
- ✅ Bell icon in navbar
- ✅ Red badge with count
- ✅ Notification in list
- ✅ Click to view details

---

## Summary

### What You Have:

1. **Dual Notification System:**
   - In-app notifications (bell icon)
   - Email notifications (inbox)

2. **Automatic Email Sending:**
   - Every notification creates email
   - No manual work needed
   - Graceful error handling

3. **Beautiful HTML Emails:**
   - Color-coded by type
   - Emoji icons
   - Professional design
   - "View in App" button

4. **Production Ready:**
   - Async email sending
   - Error logging
   - Configurable via .env
   - Works even if email fails

**The system is complete and ready to use!** 🎉
