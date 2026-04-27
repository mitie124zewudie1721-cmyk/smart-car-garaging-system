# Password Reset Guide

## Problem
Getting 401 (Unauthorized) error when trying to login, which means the password is incorrect.

## Solution

### Option 1: Run the Password Reset Script (Recommended)

**Step 1: Make sure backend is running**
```bash
cd backend
npm run dev
```

**Step 2: Run the reset script**
```powershell
.\reset-password.ps1
```

This will reset passwords for all existing accounts:
- `garageowner` → password: `password123`
- `admin` → password: `admin123`
- `carowner` → password: `password123`

**Step 3: Login**
Go to http://localhost:5173/login and use:
- Username: `garageowner`
- Password: `password123`

---

### Option 2: Manual API Call

**Reset password using cURL or PowerShell:**

```powershell
# Reset garageowner password
$body = @{
    username = "garageowner"
    newPassword = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/dev/reset-password" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Or using cURL:**
```bash
curl -X POST http://localhost:5002/api/dev/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"garageowner","newPassword":"password123"}'
```

---

### Option 3: List All Users First

To see what users exist in your database:

```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/list-users" -Method Get
```

This will show all users with their usernames and roles.

---

## New API Endpoints

### Reset Password
```
POST /api/dev/reset-password
Body: {
  "username": "garageowner",
  "newPassword": "password123"
}
```

### List Users
```
GET /api/dev/list-users
```

---

## After Password Reset

Once password is reset, you can:

1. **Login** at http://localhost:5173/login
   - Username: `garageowner`
   - Password: `password123`

2. **Test Garage Owner Features:**
   - My Garages
   - Add Garage
   - Bookings
   - Analytics

3. **Follow Testing Guides:**
   - `TEST_GARAGE_OWNER_EXISTING_ACCOUNT.md`
   - `GARAGE_OWNER_TESTING_GUIDE.md`

---

## Troubleshooting

### Script fails with "Cannot reach server"
**Solution:** Make sure backend is running on port 5002
```bash
cd backend
npm run dev
```

### User not found
**Solution:** The user doesn't exist. Register a new account at http://localhost:5173/register

### Still getting 401 after reset
**Solution:** 
1. Clear browser cache and localStorage
2. Try in incognito/private window
3. Check backend logs for errors

---

## Default Passwords (After Reset)

| Username | Password | Role |
|----------|----------|------|
| garageowner | password123 | Garage Owner |
| admin | admin123 | Admin |
| carowner | password123 | Car Owner |

---

## Security Note

⚠️ **Important:** This password reset endpoint is for development only. Remove it in production!

The endpoint is under `/api/dev/` which should be removed before deploying to production.
