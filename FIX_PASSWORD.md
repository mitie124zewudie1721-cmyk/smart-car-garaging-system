# Fix Password - Quick Solution

## The Problem
You're getting a 401 error when trying to login, which means the password is wrong.

## The Fix (One Command)

**Just run this:**
```powershell
.\reset-password.ps1
```

That's it! The script will:
1. ✅ List all users in your database
2. ✅ Reset password for `garageowner` to `password123`
3. ✅ Reset password for `admin` to `admin123` (if exists)
4. ✅ Reset password for `carowner` to `password123` (if exists)

## After Running the Script

**Login with:**
- Username: `garageowner`
- Password: `password123`
- URL: http://localhost:5173/login

## If Script Doesn't Work

Make sure backend is running:
```bash
cd backend
npm run dev
```

Then run the script again:
```powershell
.\reset-password.ps1
```

## Manual Alternative

If you prefer to do it manually:
```powershell
$body = @{
    username = "garageowner"
    newPassword = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/dev/reset-password" -Method Post -Body $body -ContentType "application/json"
```

## Done!

After password reset, you can test all garage owner features:
- My Garages
- Add Garage  
- Bookings
- Analytics

See `TEST_GARAGE_OWNER_EXISTING_ACCOUNT.md` for detailed testing steps.
