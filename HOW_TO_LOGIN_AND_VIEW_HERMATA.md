# How to Login and View CarGarage Hermata

## Step-by-Step Guide

### Step 1: Register the Garage

First, run the registration script:

```powershell
.\register-hermata-garage.ps1
```

This creates:
- **Username**: `hermata_garage`
- **Password**: `HermataGarage2024!`
- **Role**: Garage Owner

---

## Option A: Login as Garage Owner

### 1. Open the Frontend

Go to: `http://localhost:5173`

### 2. Click "Login"

### 3. Enter Credentials

```
Username: hermata_garage
Password: HermataGarage2024!
```

### 4. What You'll See

After login, you'll be redirected to the Garage Owner Dashboard where you can:

- **View Your Garage**: See CarGarage Hermata details
- **Manage Bookings**: See incoming reservations
- **View Analytics**: Check revenue and statistics
- **Manage Disputes**: Handle customer disputes
- **Update Profile**: Edit garage information

**Note**: The garage will show "Pending Approval" status until an admin approves it.

---

## Option B: Login as Admin to Approve

### 1. Login as Admin

```
Username: admin
Password: password123
```

### 2. Go to "Garage Verification"

Click on the sidebar menu: **Garage Verification**

### 3. Find CarGarage Hermata

You'll see a list of pending garages. Look for:
- **Name**: CarGarage Hermata
- **Location**: Hermata, Jimma
- **Status**: Pending

### 4. Click "View Details"

Review the garage information:
- Services offered
- Pricing
- Operating hours
- Location
- Contact details

### 5. Click "Approve"

This will:
- Change status to "Approved"
- Make the garage visible to car owners
- Send notification to garage owner

---

## Option C: Login as Car Owner to Book

### 1. Create Car Owner Account

Go to registration and create account:
```
Username: [your_username]
Password: [your_password]
Role: Car Owner
```

### 2. Login

Use your car owner credentials

### 3. Search for Garages

Click "Find Garage" in the sidebar

### 4. Search Near Jimma

Enter location: **Jimma** or **Hermata**

### 5. View CarGarage Hermata

You'll see:
- **Name**: CarGarage Hermata
- **Location**: Hermata, Jimma
- **Rating**: ⭐ (if has reviews)
- **Distance**: X km from your location
- **Services**: Car Wash, Oil Change, etc.

### 6. Click "View Details"

See full information:
- All services and prices
- Operating hours
- Contact information
- Reviews and ratings
- Location on map

### 7. Book a Service

1. Select service (e.g., Car Wash - 300 ETB)
2. Choose date and time
3. Select your vehicle
4. Click "Book Now"
5. Confirm booking
6. Make payment

---

## Quick Login Reference

### Garage Owner (Hermata)
```
URL: http://localhost:5173/login
Username: hermata_garage
Password: HermataGarage2024!
```

### Admin
```
URL: http://localhost:5173/login
Username: admin
Password: password123
```

### Car Owner (Example)
```
URL: http://localhost:5173/login
Username: mitie12
Password: password123
```

---

## What Each User Sees

### Garage Owner Dashboard
```
📊 Dashboard
├── 📈 Analytics
│   ├── Total Revenue
│   ├── Bookings This Month
│   └── Average Rating
├── 📅 Bookings
│   ├── Pending Requests
│   ├── Confirmed Bookings
│   └── Completed Services
├── 🏢 My Garage
│   ├── Garage Details
│   ├── Services & Pricing
│   └── Operating Hours
├── ⚠️ Disputes
│   └── Customer Disputes
└── 👤 Profile
    └── Account Settings
```

### Admin Dashboard
```
🔧 Admin Panel
├── 📊 System Overview
│   ├── Total Users
│   ├── Total Garages
│   └── Total Bookings
├── ✅ Garage Verification
│   ├── Pending Garages
│   └── Approved Garages
├── 👥 User Management
│   ├── All Users
│   └── User Roles
└── ⚖️ Dispute Management
    └── All Disputes
```

### Car Owner Dashboard
```
🚗 Car Owner
├── 🔍 Find Garage
│   ├── Search by Location
│   ├── Filter by Service
│   └── View on Map
├── 📅 My Reservations
│   ├── Upcoming Bookings
│   ├── Past Bookings
│   └── Cancelled Bookings
├── 🚙 My Vehicles
│   ├── Add Vehicle
│   └── Manage Vehicles
├── ⚠️ Disputes
│   └── File Dispute
└── 👤 Profile
    └── Account Settings
```

---

## Viewing Garage Details

### From Garage Owner Account

1. Login as `hermata_garage`
2. Click "My Garage" in sidebar
3. You'll see:
   - Garage name and description
   - Location and contact
   - Services and pricing
   - Operating hours
   - Approval status
   - Edit button

### From Admin Account

1. Login as `admin`
2. Click "Garage Verification"
3. Find "CarGarage Hermata"
4. Click "View Details"
5. You'll see:
   - All garage information
   - Owner details
   - Registration date
   - Approve/Reject buttons

### From Car Owner Account

1. Login as car owner
2. Click "Find Garage"
3. Search for "Jimma" or "Hermata"
4. Click on "CarGarage Hermata"
5. You'll see:
   - Services and prices
   - Operating hours
   - Location on map
   - Reviews and ratings
   - "Book Now" button

---

## Troubleshooting

### Can't See the Garage?

**If you're a car owner:**
- Make sure the garage is approved by admin
- Check if you're searching in the right location (Jimma)
- Try searching with different keywords

**If you're the garage owner:**
- Check if your garage is approved
- Look for "Pending Approval" status
- Contact admin for approval

### Login Not Working?

1. Check username and password
2. Make sure backend is running (`npm run dev` in backend folder)
3. Make sure frontend is running (`npm run dev` in frontend folder)
4. Clear browser cache and try again

### Garage Not Showing in Search?

1. Login as admin
2. Go to Garage Verification
3. Find CarGarage Hermata
4. Click "Approve"
5. Logout and login as car owner
6. Search again

---

## Quick Test Flow

### Complete Test (5 minutes)

```powershell
# 1. Register garage
.\register-hermata-garage.ps1

# 2. Open browser
# Go to http://localhost:5173

# 3. Login as admin
# Username: admin, Password: password123

# 4. Approve garage
# Garage Verification → CarGarage Hermata → Approve

# 5. Logout and login as car owner
# Username: mitie12, Password: password123

# 6. Search and book
# Find Garage → Search "Jimma" → CarGarage Hermata → Book Service
```

---

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002
- **Login Page**: http://localhost:5173/login
- **Register Page**: http://localhost:5173/register
- **Find Garage**: http://localhost:5173/find-garage

---

## Need Help?

Check these guides:
- `REGISTER_HERMATA_GARAGE.md` - Full registration details
- `COMPLETE_SETUP_GUIDE.md` - System setup
- `QUICK_START_CAR_OWNER.md` - Car owner guide
- `QUICK_START_GARAGE_OWNER.md` - Garage owner guide
