# 🚀 Quick Test: Booking Management

## Why You See "No completed bookings found"

There are no reservations yet! Let's create some.

---

## Option 1: Seed Sample Data (Fastest)

Run this command to create sample bookings:

```powershell
curl -X POST http://localhost:5002/api/dev/seed-analytics
```

Then refresh the Booking Management page. You'll see bookings!

---

## Option 2: Create Real Booking (Step by Step)

### Step 1: Login as Garage Owner
- Username: `garageowner`
- Password: `garageowner123`

### Step 2: Add a Garage
1. Go to "My Garages"
2. Click "Add New Garage"
3. Fill in:
   - Name: "Test Auto Service"
   - Address: "123 Main St"
   - City: "Addis Ababa"
   - Price: 500
   - Capacity: 5
4. Submit

### Step 3: Logout and Login as Car Owner
- Username: `carowner`
- Password: `carowner123`

### Step 4: Make a Reservation
1. Go to "Find Garage"
2. Search for garages
3. Select "Test Auto Service"
4. Choose a vehicle
5. Pick date and time
6. Click "Book Service"

### Step 5: View Booking as Garage Owner
1. Logout
2. Login as `garageowner`
3. Go to "Booking Management"
4. You'll see the booking!

---

## Quick Commands

```powershell
# Seed everything at once
curl -X POST http://localhost:5002/api/dev/seed
curl -X POST http://localhost:5002/api/dev/seed-vehicles
curl -X POST http://localhost:5002/api/dev/seed-analytics

# Then refresh the page!
```

---

## What You'll See

After seeding or creating bookings, you'll see:

- Customer name
- Vehicle details
- Service date/time
- Status (pending, confirmed, completed)
- Price
- Actions (confirm, complete, cancel)

---

## Summary

**The page is working!** It just needs bookings to display.

**Fastest way:** Run `curl -X POST http://localhost:5002/api/dev/seed-analytics`

Then refresh the Booking Management page.
