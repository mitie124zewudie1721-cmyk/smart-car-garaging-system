# 📅 Booking Management - How It Works

## What is Booking Management?

This page is for **Garage Owners** to view and manage service appointments (reservations) made by car owners at their garages.

---

## Why "No completed bookings found"?

You're seeing this message because:
1. No car owners have made reservations at your garages yet, OR
2. You don't have any garages added yet, OR
3. You're logged in as the wrong user type

---

## How to Get Bookings to Show Up

### Step 1: Make Sure You're a Garage Owner

Login as: `garageowner` / `garageowner123`

### Step 2: Add a Garage

1. Go to "My Garages" page
2. Click "Add New Garage"
3. Fill in garage details:
   - Name: "Downtown Auto Service"
   - Address: "123 Main St"
   - City: "Addis Ababa"
   - Price: 500 (per hour)
   - Capacity: 5
   - Amenities: "WiFi, Waiting Area, Coffee"
   - Operating Hours: 8:00 AM - 6:00 PM

### Step 3: Car Owner Makes a Reservation

1. Logout from garage owner account
2. Login as car owner: `carowner` / `carowner123`
3. Go to "Find Garage" page
4. Search for garages near you
5. Select your garage
6. Choose a vehicle
7. Select date and time
8. Click "Book Service"

### Step 4: View Booking as Garage Owner

1. Logout from car owner account
2. Login as garage owner: `garageowner` / `garageowner123`
3. Go to "Booking Management" page
4. You'll now see the reservation!

---

## Quick Test: Seed Sample Data

To quickly test the booking management page, seed sample reservations:

```powershell
# Make sure backend is running, then:
curl -X POST http://localhost:5002/api/dev/seed-analytics
```

This creates:
- Sample garages
- Sample reservations
- Sample payments

Now refresh the Booking Management page and you should see bookings!

---

## What You'll See on Booking Management Page

### Booking Information
- Customer name
- Vehicle details
- Service date and time
- Status (pending, confirmed, completed, cancelled)
- Total price
- Payment status

### Actions You Can Take
- View booking details
- Update booking status
- Mark as completed
- Cancel booking
- Contact customer

---

## Booking Status Flow

```
1. PENDING → Car owner just made the reservation
   ↓
2. CONFIRMED → Garage owner confirms the appointment
   ↓
3. ACTIVE → Service is currently in progress
   ↓
4. COMPLETED → Service finished successfully
   ↓
5. Car owner can leave feedback
```

Or:
```
PENDING → CANCELLED (if either party cancels)
```

---

## Complete Workflow Example

### As Garage Owner:

1. **Login**: `garageowner` / `garageowner123`

2. **Add Garage**:
   - Go to "My Garages"
   - Click "Add New Garage"
   - Fill in details
   - Submit

3. **Wait for Bookings**:
   - Car owners will find your garage
   - They'll make reservations
   - You'll see them in "Booking Management"

4. **Manage Bookings**:
   - View new reservations
   - Confirm appointments
   - Update status as service progresses
   - Mark as completed when done

### As Car Owner:

1. **Login**: `carowner` / `carowner123`

2. **Add Vehicle** (if not done):
   - Go to "My Vehicles"
   - Click "Add Vehicle"
   - Fill in details

3. **Find Garage**:
   - Go to "Find Garage"
   - Search by location
   - View available garages on map

4. **Make Reservation**:
   - Select a garage
   - Choose your vehicle
   - Pick date and time
   - Submit booking

5. **View Your Reservations**:
   - Go to "My Reservations"
   - See all your bookings
   - Track status

---

## Testing Commands

### 1. Seed Everything
```powershell
# Seed garages
curl -X POST http://localhost:5002/api/dev/seed

# Seed vehicles
curl -X POST http://localhost:5002/api/dev/seed-vehicles

# Seed analytics (includes reservations)
curl -X POST http://localhost:5002/api/dev/seed-analytics
```

### 2. Check Backend Logs
Look for reservation creation logs in the backend terminal

### 3. Test API Directly
```powershell
# Get all reservations for garage owner
curl http://localhost:5002/api/reservations/garage-owner `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### "No completed bookings found"

**Possible Causes:**
1. No reservations exist yet
2. You don't own any garages
3. No car owners have booked your garages
4. You're logged in as wrong user type

**Solutions:**
1. Seed sample data: `curl -X POST http://localhost:5002/api/dev/seed-analytics`
2. Add a garage first (My Garages → Add New Garage)
3. Create a reservation as car owner
4. Make sure you're logged in as `garageowner`

### "Cannot fetch bookings"

**Possible Causes:**
1. Backend not running
2. Not authenticated
3. API endpoint error

**Solutions:**
1. Start backend: `cd backend; npm run dev`
2. Login again
3. Check backend terminal for errors

### Bookings not updating

**Solution:**
- Refresh the page
- Check backend logs
- Verify reservation status in database

---

## API Endpoints Used

### Get Garage Owner's Bookings
```
GET /api/reservations/garage-owner
Headers: Authorization: Bearer <token>
```

### Update Booking Status
```
PATCH /api/reservations/:id/status
Body: { status: "confirmed" | "active" | "completed" | "cancelled" }
```

### Get Booking Details
```
GET /api/reservations/:id
```

---

## Database Collections

### Reservations Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Car owner
  garage: ObjectId,      // Your garage
  vehicle: ObjectId,     // Car owner's vehicle
  startTime: Date,       // Service start
  endTime: Date,         // Service end
  status: String,        // pending, confirmed, active, completed, cancelled
  totalPrice: Number,
  paymentStatus: String, // pending, paid, refunded
  createdAt: Date
}
```

---

## Summary

The Booking Management page shows reservations made at your garages. To see bookings:

1. ✅ Login as garage owner
2. ✅ Add at least one garage
3. ✅ Have car owners make reservations
4. ✅ Or seed sample data for testing

**Quick Test:**
```powershell
curl -X POST http://localhost:5002/api/dev/seed-analytics
```

Then refresh the Booking Management page!

---

## Next Steps

1. Add your first garage (My Garages page)
2. Test by making a reservation as car owner
3. View and manage bookings as garage owner
4. Update booking status as service progresses
5. Mark as completed when service is done
6. Car owner can then leave feedback

The system is working - you just need to create some bookings first!
