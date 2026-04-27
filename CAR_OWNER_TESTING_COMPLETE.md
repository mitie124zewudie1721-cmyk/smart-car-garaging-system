# 🚗 Car Owner Features - Complete Testing Guide

## ✅ ISSUE FIXED: Reservation Form Now Loads Vehicles

The issue where vehicles weren't showing in the reservation form has been fixed. The `FindGarage.tsx` page now:
- Fetches user vehicles from the API on page load
- Passes vehicles to the ReservationForm component
- Displays vehicles in the dropdown when booking

---

## 🎯 Car Owner Role Overview

Car owners can:
- ✅ Add and manage vehicles
- ✅ Search for nearby garages
- ✅ Book service appointments
- ✅ View and manage reservations

---

## 🚀 Quick Start Guide

### Step 1: Create Car Owner Account

**Option A: Use Setup Script (Recommended)**
```powershell
.\setup-accounts.ps1
```

**Option B: Register Manually**
1. Go to: http://localhost:5173/register
2. Fill in:
   - Name: Car Owner
   - Username: `carowner`
   - Email: car@example.com
   - Phone: +251922222222
   - Password: `carowner123`
   - Confirm Password: `carowner123`
   - Role: **Car Owner** ← IMPORTANT!
3. Click "Register"

### Step 2: Login
- URL: http://localhost:5173/login
- Username: `carowner`
- Password: `carowner123`

---

## 📋 Feature Testing Workflow

### Feature 1: Vehicle Management ✅

**Test: Add a Vehicle**

1. Click "My Vehicles" in sidebar
2. Click "+ Add Vehicle" button
3. Fill in the form:
   ```
   Plate Number: AA-12345
   Make: Toyota
   Model: Corolla
   Year: 2020
   Color: White
   Vehicle Type: Sedan (dropdown)
   Size Category: Medium (dropdown)
   ```
4. Click "Add Vehicle"

**Expected Results:**
- ✅ Success toast: "Vehicle added successfully"
- ✅ Vehicle appears in the list immediately
- ✅ Shows: Make, Model, Plate, Year, Color, Size

**Test: Add Multiple Vehicles**

Add these test vehicles:
```
Vehicle 1: Toyota Corolla, AA-12345, Sedan, Medium
Vehicle 2: Honda CR-V, BB-67890, SUV, Large
Vehicle 3: Ford F-150, CC-11111, Pickup, Extra Large
```

**Test: Delete a Vehicle**

1. Click "Delete" on any vehicle
2. Confirm deletion in dialog
3. Vehicle should be removed from list

---

### Feature 2: Find Garages ✅

**Test: Search for Nearby Garages**

1. Click "Find Garage" in sidebar
2. Allow location access when browser prompts
3. Wait for garages to load

**Expected Results:**
- ✅ Toast: "Your location detected"
- ✅ Map shows your location marker
- ✅ Garages appear as markers on map
- ✅ List shows garage cards with:
  - Name
  - Address
  - Distance (km)
  - Price per hour
  - Available slots
  - Rating
  - Amenities
  - "Reserve Now" button

**Test: Filter Garages**

1. Adjust radius slider (1-50 km)
2. Select amenities (covered, secure, 24h, etc.)
3. Click "Search Garages"
4. Results update based on filters

---

### Feature 3: Book Service Appointment ✅ (FIXED)

**Prerequisites:**
- ✅ Must have at least one vehicle added
- ✅ Must be logged in as car owner
- ✅ Garages must exist in database

**Test: Make a Reservation**

1. Go to "Find Garage" page
2. Find a garage you like
3. Click "Reserve Now" button
4. **Verify vehicles load in dropdown** ← THIS WAS THE BUG
5. Fill in the booking form:
   ```
   Select Vehicle: Choose from YOUR vehicles (should show all your vehicles)
   Start Time: Tomorrow at 9:00 AM
   End Time: Tomorrow at 11:00 AM
   Notes: Oil change and tire rotation needed
   ```
6. Click "Confirm Reservation"

**Expected Results:**
- ✅ Modal opens with title "Reserve at [Garage Name]"
- ✅ **Vehicles dropdown shows all your vehicles** ← FIXED
- ✅ Each vehicle shows: "Make Model (PlateNumber)"
- ✅ Can select start and end date/time
- ✅ Success toast: "Reservation created successfully!"
- ✅ Modal closes automatically
- ✅ Another toast: "Reservation created! Check My Reservations."

**Test: Validation**

Try these invalid scenarios:

1. **No vehicle selected**
   - Leave vehicle dropdown empty
   - Click "Confirm Reservation"
   - Should show error: "Please select a vehicle"

2. **Past start time**
   - Select yesterday's date
   - Should show error: "Start time must be in the future"

3. **End time before start time**
   - End time: 9:00 AM
   - Start time: 11:00 AM
   - Should show error: "End time must be after start time"

---

### Feature 4: View Reservations ✅

**Test: View All Reservations**

1. Click "My Reservations" in sidebar
2. See all your bookings

**Expected Results:**
- ✅ List of reservation cards
- ✅ Each card shows:
  - Garage name
  - Vehicle (Make Model - Plate)
  - Start and end date/time
  - Status badge (Pending, Confirmed, Active, Completed, Cancelled)
  - Total price
  - Cancel button (for pending/confirmed)

**Test: Filter by Status**

1. Click status filter buttons at top
2. Try: All, Pending, Confirmed, Active, Completed, Cancelled
3. List updates to show only selected status

**Test: Cancel a Reservation**

1. Find a "Pending" or "Confirmed" reservation
2. Click "Cancel" button
3. Confirm in dialog
4. Status changes to "Cancelled"
5. Success toast appears

---

## 🎯 Complete End-to-End Test

Follow this complete workflow:

### 1. Setup Phase
```
✅ Register as car owner (carowner/carowner123)
✅ Login successfully
✅ See car owner dashboard
```

### 2. Add Vehicles
```
✅ Go to "My Vehicles"
✅ Add: Toyota Corolla, AA-12345, Sedan, Medium
✅ Add: Honda CR-V, BB-67890, SUV, Large
✅ Verify both vehicles appear in list
```

### 3. Find Garages
```
✅ Go to "Find Garage"
✅ Allow location access
✅ See nearby garages on map and list
✅ Adjust radius to 20 km
✅ Select amenities: covered, secure, 24h
✅ Click "Search Garages"
✅ Results update
```

### 4. Book Service (CRITICAL TEST)
```
✅ Click "Reserve Now" on a garage
✅ Modal opens
✅ **Verify vehicles dropdown shows: Toyota Corolla and Honda CR-V** ← KEY TEST
✅ Select: Toyota Corolla (AA-12345)
✅ Start: Tomorrow 9:00 AM
✅ End: Tomorrow 11:00 AM
✅ Notes: "Oil change needed"
✅ Click "Confirm Reservation"
✅ Success toast appears
✅ Modal closes
```

### 5. View Reservation
```
✅ Go to "My Reservations"
✅ See your booking
✅ Status: Pending
✅ Shows correct garage, vehicle, time
```

### 6. Book Another Service
```
✅ Go back to "Find Garage"
✅ Find different garage
✅ Click "Reserve Now"
✅ **Select: Honda CR-V (BB-67890)** ← Test different vehicle
✅ Different time slot
✅ Confirm booking
✅ Go to "My Reservations"
✅ See both bookings
```

---

## 🐛 Troubleshooting

### Issue: "No vehicles found" in reservation form

**FIXED!** This was the main bug. The page now fetches vehicles on load.

**If you still see this:**
1. Make sure you're logged in as `carowner` (not garageowner or admin)
2. Go to "My Vehicles" and add at least one vehicle
3. Refresh the "Find Garage" page
4. Try booking again

### Issue: Can't see any garages

**Cause:** No garages in database

**Solution:**
1. Logout
2. Login as garage owner (garageowner/garageowner123)
3. Add some garages with coordinates
4. Logout and login back as car owner

**Or seed garages:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed" -Method Post
```

### Issue: Location not detected

**Cause:** Browser blocked location access

**Solution:**
1. Click the location icon in browser address bar
2. Allow location access
3. Refresh the page

**Or:** The system uses Jimma, Ethiopia as default location if geolocation fails

### Issue: Booking form doesn't open

**Check:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Make sure backend is running on port 5002
4. Make sure you have vehicles added

---

## 📊 Test Data Examples

### Sample Vehicles
```
Vehicle 1:
- Plate: AA-12345
- Make: Toyota
- Model: Corolla
- Year: 2020
- Type: Sedan
- Size: Medium

Vehicle 2:
- Plate: BB-67890
- Make: Honda
- Model: CR-V
- Year: 2021
- Type: SUV
- Size: Large

Vehicle 3:
- Plate: CC-11111
- Make: Ford
- Model: F-150
- Year: 2019
- Type: Pickup
- Size: Extra Large
```

### Sample Booking
```
Garage: Jimma Auto Service Center
Vehicle: Toyota Corolla (AA-12345)
Start: Tomorrow 9:00 AM
End: Tomorrow 11:00 AM
Notes: Oil change and tire rotation needed
Expected Price: ~200 ETB (depends on garage rate)
```

---

## ✅ Success Checklist

Mark each item as you test:

### Vehicle Management
- [ ] Can add vehicle
- [ ] Vehicle appears in list immediately
- [ ] Can view vehicle details
- [ ] Can delete vehicle
- [ ] Form validation works (required fields)

### Find Garages
- [ ] Can see nearby garages
- [ ] Map displays correctly with markers
- [ ] Can filter by radius
- [ ] Can filter by amenities
- [ ] Garage details show correctly
- [ ] Distance calculation works

### Book Service (CRITICAL)
- [ ] Can open booking modal
- [ ] **Vehicles appear in dropdown** ← MAIN FIX
- [ ] Can select vehicle from list
- [ ] Can select date/time
- [ ] Can add notes
- [ ] Booking succeeds
- [ ] Validation works (future dates, end > start)
- [ ] Success messages appear

### View Reservations
- [ ] Can see all reservations
- [ ] Can filter by status
- [ ] Can cancel reservation
- [ ] Status updates correctly
- [ ] Shows correct vehicle and garage info

---

## 🔗 Quick Links

- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- My Vehicles: http://localhost:5173/vehicles
- Find Garage: http://localhost:5173/find-garage
- My Reservations: http://localhost:5173/my-reservations

---

## 📞 API Endpoints

### Vehicles
- `GET /api/vehicles/my` - Get my vehicles (used by FindGarage page)
- `POST /api/vehicles` - Add vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Garages
- `POST /api/garages/search` - Search nearby garages

### Reservations
- `GET /api/reservations/my` - Get my reservations
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/:id/cancel` - Cancel reservation

---

## 🎉 What Was Fixed

### Before (Bug):
```typescript
<ReservationForm
    garageId={selectedGarage._id}
    vehicles={[]}  // ❌ Empty array - no vehicles!
    onSuccess={handleReservationSuccess}
/>
```

### After (Fixed):
```typescript
// Added state for vehicles
const [vehicles, setVehicles] = useState<Vehicle[]>([]);

// Added useEffect to fetch vehicles
useEffect(() => {
    const fetchVehicles = async () => {
        const response = await api.get('/vehicles/my');
        setVehicles(response.data.data || []);
    };
    fetchVehicles();
}, []);

// Pass real vehicles to form
<ReservationForm
    garageId={selectedGarage._id}
    vehicles={vehicles}  // ✅ Real vehicles from API!
    onSuccess={handleReservationSuccess}
/>
```

---

## 🆚 Role Comparison

| Feature | Car Owner | Garage Owner | Admin |
|---------|-----------|--------------|-------|
| Add Vehicles | ✅ YES | ❌ NO | ❌ NO |
| Add Garages | ❌ NO | ✅ YES | ❌ NO |
| Book Services | ✅ YES | ❌ NO | ❌ NO |
| View Own Reservations | ✅ YES | ❌ NO | ❌ NO |
| View Garage Bookings | ❌ NO | ✅ YES | ✅ YES |
| View Analytics | ❌ NO | ✅ YES | ✅ YES |
| Manage Users | ❌ NO | ❌ NO | ✅ YES |

---

## 🎓 Testing Tips

1. **Always test with fresh data** - Add new vehicles and make new bookings
2. **Test validation** - Try invalid inputs to ensure errors show
3. **Check console** - Open browser DevTools (F12) to see API calls and errors
4. **Test different vehicles** - Make sure dropdown shows all your vehicles
5. **Test multiple bookings** - Book different garages with different vehicles
6. **Test cancellation** - Cancel a booking and verify status changes

---

## ✨ You're Done When...

- ✅ Can register and login as car owner
- ✅ Can add multiple vehicles
- ✅ Can search for garages with filters
- ✅ **Can see vehicles in booking dropdown** ← KEY SUCCESS METRIC
- ✅ Can successfully book service appointments
- ✅ Can view all reservations
- ✅ Can cancel reservations
- ✅ All features work without errors

**The main bug (vehicles not loading) is now FIXED!** 🎉
