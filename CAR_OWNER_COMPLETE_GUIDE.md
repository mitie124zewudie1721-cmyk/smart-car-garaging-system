# Car Owner Complete Testing Guide

## 🎯 Car Owner Role Overview

**Car Owner** is a user role for customers who want to book garage services for their vehicles.

### What Car Owners Can Do:
- ✅ Add and manage their vehicles
- ✅ Search for nearby garages
- ✅ Book service appointments
- ✅ View their reservations
- ✅ Rate and review garages

### What Car Owners CANNOT Do:
- ❌ Add or manage garages
- ❌ View garage analytics
- ❌ Manage other users' bookings

---

## 🚀 Quick Setup

### Step 1: Create Car Owner Account

Run this command:
```powershell
.\setup-accounts.ps1
```

Or register manually:
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

### Step 2: Login
- URL: http://localhost:5173/login
- Username: `carowner`
- Password: `carowner123`

---

## 📋 Car Owner Features Testing

### Feature 1: Vehicle Management

**Location**: My Vehicles page (sidebar)

#### Add a Vehicle

1. Click "My Vehicles" in sidebar
2. Click "+ Add Vehicle" button
3. Fill in the form:
   ```
   Plate Number: AA-12345
   Make: Toyota
   Model: Corolla
   Year: 2020 (optional)
   Color: White (optional)
   Vehicle Type: Sedan (dropdown)
   Size Category: Medium (dropdown)
   ```
4. Click "Add Vehicle"

**Expected Result:**
- ✅ Success toast appears
- ✅ Vehicle appears in the list
- ✅ Can see vehicle details

#### View Vehicles

1. Go to "My Vehicles"
2. See all your vehicles in cards

**Expected Result:**
- ✅ All vehicles displayed
- ✅ Shows: Make, Model, Plate, Year, Color, Size
- ✅ Delete button available

#### Delete a Vehicle

1. Go to "My Vehicles"
2. Click "Delete" on any vehicle
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Vehicle removed from list
- ✅ Success toast appears

---

### Feature 2: Find Garages

**Location**: Find Garage page (sidebar)

#### Search for Nearby Garages

1. Click "Find Garage" in sidebar
2. Allow location access when prompted
3. View nearby garages on map and list

**Expected Result:**
- ✅ Map shows your location
- ✅ Garages appear as markers on map
- ✅ List shows garage details
- ✅ Can see: Name, Address, Price, Rating, Available Slots

#### Filter Garages

1. On Find Garage page
2. Adjust search radius (slider)
3. Select amenities (checkboxes)
4. Click "Search"

**Expected Result:**
- ✅ Results update based on filters
- ✅ Map updates with filtered garages
- ✅ List shows filtered results

---

### Feature 3: Book Service Appointment

**Location**: Find Garage page → Click "Reserve Now"

#### Make a Reservation

1. Go to "Find Garage"
2. Find a garage you like
3. Click "Reserve Now" button
4. Fill in the booking form:
   ```
   Select Vehicle: Choose from your vehicles
   Start Time: Select date and time
   End Time: Select date and time (after start)
   Notes: Optional notes about service needed
   ```
5. Click "Confirm Reservation"

**Expected Result:**
- ✅ Modal opens with booking form
- ✅ Your vehicles appear in dropdown
- ✅ Can select date and time
- ✅ Success toast after booking
- ✅ Modal closes

**Important Notes:**
- You must have at least one vehicle added
- Start time must be in the future
- End time must be after start time

---

### Feature 4: View Reservations

**Location**: My Reservations page (sidebar)

#### View All Reservations

1. Click "My Reservations" in sidebar
2. See all your bookings

**Expected Result:**
- ✅ List of all reservations
- ✅ Shows: Garage name, Vehicle, Date/Time, Status, Price
- ✅ Status badges (Pending, Confirmed, Active, Completed, Cancelled)

#### Filter by Status

1. On My Reservations page
2. Click status filter buttons (All, Pending, Confirmed, etc.)

**Expected Result:**
- ✅ List filters by selected status
- ✅ Count updates

#### Cancel a Reservation

1. Go to "My Reservations"
2. Find a pending/confirmed reservation
3. Click "Cancel" button
4. Confirm cancellation

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Status changes to "Cancelled"
- ✅ Success toast appears

---

## 🎯 Complete Testing Workflow

### End-to-End Test

1. **Setup**
   - Register as car owner
   - Login

2. **Add Vehicle**
   - Go to "My Vehicles"
   - Add: Toyota Corolla, AA-12345

3. **Find Garage**
   - Go to "Find Garage"
   - Allow location
   - See nearby garages

4. **Book Service**
   - Click "Reserve Now" on a garage
   - Select your vehicle
   - Choose tomorrow's date, 9:00 AM - 11:00 AM
   - Add note: "Oil change needed"
   - Confirm booking

5. **View Reservation**
   - Go to "My Reservations"
   - See your booking
   - Status should be "Pending"

6. **Add More Vehicles**
   - Go to "My Vehicles"
   - Add: Honda CR-V, BB-67890
   - Add: Ford F-150, CC-11111

7. **Make Another Booking**
   - Go to "Find Garage"
   - Find different garage
   - Book with different vehicle

---

## 🐛 Troubleshooting

### "No vehicles found" when booking
**Cause**: No vehicles added yet  
**Solution**: Go to "My Vehicles" and add a vehicle first

### Can't see any garages
**Cause**: No garages in database  
**Solution**: 
1. Logout
2. Login as garage owner
3. Add some garages
4. Logout and login back as car owner

### Location not detected
**Cause**: Browser blocked location access  
**Solution**: 
1. Allow location in browser settings
2. Or use default location (Jimma)

### Booking form doesn't open
**Cause**: JavaScript error or missing vehicles  
**Solution**: 
1. Check browser console (F12)
2. Make sure you have vehicles added
3. Refresh the page

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
```

---

## ✅ Feature Checklist

### Vehicle Management
- [ ] Can add vehicle
- [ ] Vehicle appears in list
- [ ] Can view vehicle details
- [ ] Can delete vehicle
- [ ] Form validation works

### Find Garages
- [ ] Can see nearby garages
- [ ] Map displays correctly
- [ ] Can filter by radius
- [ ] Can filter by amenities
- [ ] Garage details show correctly

### Book Service
- [ ] Can open booking form
- [ ] Vehicles appear in dropdown
- [ ] Can select date/time
- [ ] Can add notes
- [ ] Booking succeeds
- [ ] Validation works (future dates, end > start)

### View Reservations
- [ ] Can see all reservations
- [ ] Can filter by status
- [ ] Can cancel reservation
- [ ] Status updates correctly

---

## 🔗 Quick Links

- Login: http://localhost:5173/login
- My Vehicles: http://localhost:5173/vehicles
- Find Garage: http://localhost:5173/find-garage
- My Reservations: http://localhost:5173/my-reservations

---

## 📞 API Endpoints Used

### Vehicles
- `GET /api/vehicles/my` - Get my vehicles
- `POST /api/vehicles` - Add vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Garages
- `POST /api/garages/search` - Search nearby garages

### Reservations
- `GET /api/reservations/my` - Get my reservations
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/:id/cancel` - Cancel reservation

---

## 🎉 Success Criteria

You've successfully tested Car Owner features when:
- ✅ Can register and login as car owner
- ✅ Can add, view, and delete vehicles
- ✅ Can search for nearby garages
- ✅ Can book service appointments
- ✅ Can view and manage reservations
- ✅ All features work without errors

---

## 🆚 Car Owner vs Garage Owner

| Feature | Car Owner | Garage Owner |
|---------|-----------|--------------|
| Add Vehicles | ✅ YES | ❌ NO |
| Add Garages | ❌ NO | ✅ YES |
| Book Services | ✅ YES | ❌ NO |
| View Own Reservations | ✅ YES | ❌ NO |
| View Garage Bookings | ❌ NO | ✅ YES |
| View Analytics | ❌ NO | ✅ YES |

**Remember**: You need BOTH account types to test the complete system!
