# Complete Setup Guide - All Accounts

## The Issue

You're logged in as a **Garage Owner** but trying to add vehicles. Vehicles can only be added by **Car Owners**.

## Solution: Create Both Account Types

### Account 1: Garage Owner (For Managing Garages)
### Account 2: Car Owner (For Booking Services & Managing Vehicles)

---

## 🚀 Quick Setup (2 Accounts)

### Step 1: Register Garage Owner

1. **Logout** (if logged in)
2. Go to: http://localhost:5173/register
3. Fill in:
   ```
   Name: Garage Owner
   Username: garageowner
   Email: garage@example.com
   Phone: +251911111111
   Password: garageowner123
   Confirm Password: garageowner123
   Role: Garage Owner ← IMPORTANT!
   ```
4. Click "Register"
5. **Logout** after registration

### Step 2: Register Car Owner

1. Go to: http://localhost:5173/register
2. Fill in:
   ```
   Name: Car Owner
   Username: carowner
   Email: car@example.com
   Phone: +251922222222
   Password: carowner123
   Confirm Password: carowner123
   Role: Car Owner ← IMPORTANT!
   ```
3. Click "Register"

---

## 📋 What Each Account Can Do

### Garage Owner Account
**Username**: `garageowner`  
**Password**: `garageowner123`

**Can Do:**
- ✅ Add/Edit/Delete Garages
- ✅ View Analytics
- ✅ View Bookings for their garages
- ✅ Manage garage details

**Cannot Do:**
- ❌ Add vehicles
- ❌ Make reservations
- ❌ Book services

### Car Owner Account
**Username**: `carowner`  
**Password**: `carowner123`

**Can Do:**
- ✅ Add/Edit/Delete Vehicles
- ✅ Search for garages
- ✅ Book service appointments
- ✅ View reservations
- ✅ Manage vehicles

**Cannot Do:**
- ❌ Add garages
- ❌ View garage analytics
- ❌ Manage other's bookings

---

## 🎯 Testing Workflow

### As Garage Owner:

1. **Login**: `garageowner` / `garageowner123`
2. **Add Garage**:
   - Go to "Add Garage"
   - Fill in details with coordinates
   - Example: Jimma (Lat: 7.6779, Lng: 36.8219)
3. **View Analytics**: Check your garage statistics
4. **Logout**

### As Car Owner:

1. **Login**: `carowner` / `carowner123`
2. **Add Vehicle**:
   - Go to "My Vehicles"
   - Click "+ Add Vehicle"
   - Fill in: AA-12345, Toyota, Corolla
   - Type: Sedan, Size: Medium
3. **Find Garage**:
   - Go to "Find Garage"
   - Allow location or enter coordinates
   - Search for nearby garages
4. **Book Service**:
   - Click "Book Service" on a garage
   - Select your vehicle
   - Choose date and time
   - Submit booking

---

## 🔧 Quick Commands

### Create Car Owner via API (If Registration Fails)

```powershell
$carOwnerData = @{
    name = "Car Owner"
    username = "carowner"
    email = "car@example.com"
    password = "carowner123"
    role = "car_owner"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $carOwnerData -ContentType "application/json"
```

### Create Garage Owner via API

```powershell
$garageOwnerData = @{
    name = "Garage Owner"
    username = "garageowner"
    email = "garage@example.com"
    password = "garageowner123"
    role = "garage_owner"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method Post -Body $garageOwnerData -ContentType "application/json"
```

### Seed Vehicles for Car Owner

After logging in as car owner, run:
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed-vehicles" -Method Post
```

---

## 📊 Complete Testing Checklist

### Garage Owner Tasks
- [ ] Register garage owner account
- [ ] Login as garage owner
- [ ] Add a garage with coordinates
- [ ] View "My Garages" list
- [ ] Edit garage details
- [ ] View analytics dashboard
- [ ] Check bookings page
- [ ] Logout

### Car Owner Tasks
- [ ] Register car owner account
- [ ] Login as car owner
- [ ] Add a vehicle
- [ ] View "My Vehicles" list
- [ ] Search for garages
- [ ] Book a service appointment
- [ ] View "My Reservations"
- [ ] Logout

### Admin Tasks (Optional)
- [ ] Seed admin: `POST http://localhost:5002/api/dev/seed-admin`
- [ ] Login as admin (admin/admin123)
- [ ] View system overview
- [ ] Manage users
- [ ] View reports

---

## 🐛 Troubleshooting

### "User not found" when resetting password
**Cause**: User doesn't exist in database  
**Solution**: Register the account first using the registration page

### "No vehicles found" when booking
**Cause**: Logged in as garage owner, not car owner  
**Solution**: Logout and login as car owner

### Can't add vehicles
**Cause**: Logged in as garage owner  
**Solution**: Logout and login as car owner

### Can't add garages
**Cause**: Logged in as car owner  
**Solution**: Logout and login as garage owner

---

## 🎉 Summary

**Two Different Accounts for Two Different Purposes:**

1. **Garage Owner** (`garageowner`/`garageowner123`)
   - Manages garages
   - Views analytics
   - Handles bookings

2. **Car Owner** (`carowner`/`carowner123`)
   - Manages vehicles
   - Books services
   - Makes reservations

**You need BOTH accounts to test the complete system!**

---

## 🔗 Quick Links

- Register: http://localhost:5173/register
- Login: http://localhost:5173/login
- Forgot Password: http://localhost:5173/forgot-password

---

## ✅ Current Status

Based on your situation:
- ✅ Backend is running
- ✅ Frontend is running
- ❌ Garage owner account needs to be registered
- ❌ Car owner account needs to be registered

**Next Step**: Register both accounts using the registration page!
