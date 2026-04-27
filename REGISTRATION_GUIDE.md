# 📝 Registration & Login Guide

## ✅ Current Status

Your registration and login system is already properly configured:

### Registration Form
- ✅ **Email is NOT required** (completely removed from backend)
- ✅ **Phone is optional**
- ✅ **Professional design** with glassmorphism effect
- ✅ **Password visibility toggle**
- ✅ **Form validation**
- ✅ **Role selection** (Car Owner or Garage Owner)

### Login Form
- ✅ **Username and password only**
- ✅ **Professional design** matching registration
- ✅ **Password visibility toggle**
- ✅ **Remember me checkbox**
- ✅ **Forgot password link**

---

## 🎯 How to Register

### Option 1: Via Web Interface (Recommended)

1. **Go to registration page:**
   - URL: http://localhost:5173/register

2. **Fill in the form:**
   ```
   Full Name: Your Name
   Username: yourusername (letters, numbers, underscore only)
   Password: ******** (minimum 8 characters)
   Confirm Password: ********
   Phone Number: +251912345678 (OPTIONAL - you can leave this empty)
   Account Type: Choose "Car Owner" or "Garage Owner"
   ```

3. **Click "Create Account"**

4. **You'll be automatically logged in and redirected!**

### Option 2: Via API (For Testing)

```powershell
$newUser = @{
    name = "John Doe"
    username = "johndoe"
    password = "password123"
    role = "car_owner"
    phone = "+251912345678"  # Optional - can be omitted
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $newUser -ContentType "application/json"
```

### Option 3: Without Phone Number

```powershell
$newUser = @{
    name = "Jane Smith"
    username = "janesmith"
    password = "password123"
    role = "garage_owner"
    # No phone number - it's optional!
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $newUser -ContentType "application/json"
```

---

## 🔐 How to Login

### Via Web Interface

1. **Go to login page:**
   - URL: http://localhost:5173/login

2. **Enter credentials:**
   ```
   Username: yourusername
   Password: ********
   ```

3. **Click "Sign In"**

4. **You'll be redirected based on your role:**
   - Car Owner → Dashboard
   - Garage Owner → My Garages
   - Admin → System Overview

---

## 📋 Required vs Optional Fields

### Registration

| Field | Required? | Notes |
|-------|-----------|-------|
| Full Name | ✅ Required | Minimum 2 characters |
| Username | ✅ Required | 3-30 characters, letters/numbers/underscore only |
| Password | ✅ Required | Minimum 8 characters |
| Confirm Password | ✅ Required | Must match password |
| Account Type | ✅ Required | Car Owner or Garage Owner |
| Phone Number | ❌ Optional | Format: +251912345678 |
| Email | ❌ Not Used | Completely removed from system |

### Login

| Field | Required? |
|-------|-----------|
| Username | ✅ Required |
| Password | ✅ Required |

---

## 🎨 Form Features

### Registration Form Features
- ✅ Modern glassmorphism design
- ✅ Real-time validation
- ✅ Password strength indicator
- ✅ Show/hide password toggle
- ✅ Role selection dropdown
- ✅ Auto-redirect after registration
- ✅ Error messages for invalid input
- ✅ Loading state during submission

### Login Form Features
- ✅ Clean, professional design
- ✅ Show/hide password toggle
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Auto-redirect based on role
- ✅ Error handling
- ✅ Loading state

---

## 🐛 Troubleshooting

### "Username is already taken"
**Solution:** Choose a different username. Usernames must be unique.

### "Password must be at least 8 characters"
**Solution:** Use a longer password (minimum 8 characters).

### "Username cannot contain spaces"
**Solution:** Remove spaces from username. Use letters, numbers, and underscores only.

### "Invalid phone number format"
**Solution:** 
- Use format: +251912345678
- Or leave it empty (it's optional!)

### Registration form not showing
**Solution:**
1. Make sure frontend is running: `npm run dev` in frontend folder
2. Go to: http://localhost:5173/register
3. Clear browser cache (Ctrl+Shift+Delete)

### Can't login after registration
**Solution:**
1. Make sure you're using the correct username (case-insensitive)
2. Check password (case-sensitive)
3. Try resetting password: `.\reset-password.ps1`

---

## 🧪 Test Accounts

### Car Owner
- Username: `carowner`
- Password: `carowner123`
- Role: Car Owner

### Garage Owner
- Username: `garageowner`
- Password: `garageowner123`
- Role: Garage Owner

### Admin
- Username: `admin`
- Password: `admin123`
- Role: Admin

---

## 📸 What You Should See

### Registration Page
- Title: "Create Account"
- Subtitle: "Join Smart Garaging today"
- Dark theme with glassmorphism effect
- All input fields with labels
- Blue "Create Account" button
- Link to login page at bottom

### Login Page
- Title: "Welcome Back"
- Subtitle: "Sign in to continue"
- Username and password fields
- Remember me checkbox
- Forgot password link
- Blue "Sign In" button
- Link to registration page at bottom

---

## ✅ Summary

Your registration and login system is already configured correctly:

1. ✅ **Email is NOT required** - completely removed
2. ✅ **Phone is optional** - can be left empty
3. ✅ **Professional design** - modern glassmorphism UI
4. ✅ **Proper validation** - username, password rules
5. ✅ **Role-based access** - Car Owner, Garage Owner, Admin
6. ✅ **Auto-redirect** - based on user role
7. ✅ **Password security** - hashed with bcrypt
8. ✅ **Token-based auth** - JWT tokens

**You can register new users right now at:**
http://localhost:5173/register

**No email required! Just username, password, and optionally phone number.**
