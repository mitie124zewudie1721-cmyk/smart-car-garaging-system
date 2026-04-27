# Test Garage Owner Features - Existing Account

## Your Existing Account
- Username: `garageowner`
- Password: `password123`
- Role: Garage Owner

## Step-by-Step Testing Guide

### Step 1: Login
1. Go to: `http://localhost:5173/login`
2. Enter:
   - Username: `garageowner`
   - Password: `password123`
3. Click "Login"

**Expected:** You should be redirected to the dashboard

---

### Step 2: Test Garage CRUD - Create

**Add a New Garage:**

1. Click "My Garages" in the sidebar (or go to `http://localhost:5173/my-garages`)
2. Click the "+ Add New Garage" button
3. Fill in the form:
   ```
   Garage Name: Jimma Auto Service Center
   Address: Piazza, Jimma, Ethiopia
   Capacity: 20
   Price per Hour: 150
   Description: Full-service auto repair and maintenance center
   Amenities: Check boxes for covered, secure, 24h, repair, cctv
   ```
4. Click "Add Garage"

**Expected Results:**
- ✅ Success toast: "Garage added successfully!"
- ✅ Redirected to "My Garages" page
- ✅ Your new garage appears in the list

---

### Step 3: Test Garage CRUD - Read

**View Your Garages:**

1. You should already be on "My Garages" page
2. Look at the garage cards displayed

**Expected Results:**
- ✅ See all your garages in a grid layout
- ✅ Each card shows:
  - Garage name
  - Address
  - Capacity and available slots
  - Price per hour
  - Amenities
  - Edit and Delete buttons

---

### Step 4: Test Garage CRUD - Update

**Edit a Garage:**

1. On "My Garages" page, click "Edit" button on any garage
2. Change some details (e.g., change price from 150 to 175)
3. Click "Update Garage"

**Expected Results:**
- ✅ Success toast: "Garage updated successfully!"
- ✅ Redirected back to "My Garages"
- ✅ Changes are visible in the garage card

---

### Step 5: Test Analytics Dashboard

**View Your Analytics:**

1. Click "Analytics" in the sidebar (or go to `http://localhost:5173/analytics`)
2. View the dashboard

**Expected Results:**
- ✅ See 6 metric cards:
  - Total Bookings
  - Completed Services
  - Total Revenue (in ETB)
  - Average Rating (with star)
  - Active Bookings
  - Cancelled Bookings
- ✅ See Performance Insights section with:
  - Completion Rate progress bar
  - Customer Satisfaction progress bar

**Note:** If you don't have any bookings yet, the numbers will be 0. To get real data:
- You need car owners to make reservations for your garages
- Or run the analytics seed script: `POST http://localhost:5002/api/dev/seed-analytics`

---

### Step 6: Test Booking Management

**View Bookings:**

1. Click "Bookings" in the sidebar (or go to `http://localhost:5173/bookings`)
2. View all appointments for your garages

**Expected Results:**
- ✅ See all bookings for your garages
- ✅ Filter buttons at top: All, Pending, Confirmed, Active, Completed, Cancelled
- ✅ Each booking card shows:
  - Garage name and address
  - Customer name and phone
  - Vehicle details
  - Start and end time
  - Price
  - Status badge
  - Action buttons (Accept/Reject for pending, etc.)

**Note:** If you see "No bookings yet", you need:
1. At least one garage created (done in Step 2)
2. Car owners to make reservations

---

### Step 7: Test Delete (Optional)

**Delete a Garage:**

1. Go to "My Garages"
2. Click "Delete" button on a garage you want to remove
3. Confirm the deletion in the popup

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Success toast: "Garage deleted successfully!"
- ✅ Garage removed from the list

---

## Quick API Test (Optional)

If you want to test via API directly:

### 1. Get Your Token
Login and copy the token from browser localStorage:
```javascript
// In browser console (F12)
localStorage.getItem('token')
```

### 2. Test Endpoints

**Get My Garages:**
```bash
curl -X GET http://localhost:5002/api/garages/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Analytics:**
```bash
curl -X GET http://localhost:5002/api/garages/my/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Garage:**
```bash
curl -X POST http://localhost:5002/api/garages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Garage",
    "location": {
      "type": "Point",
      "coordinates": [36.8219, 7.6779],
      "address": "Jimma, Ethiopia"
    },
    "capacity": 10,
    "pricePerHour": 100,
    "amenities": ["covered", "secure"]
  }'
```

---

## Troubleshooting

### Issue: "My Garages" page is empty
**Solution:** 
- Add a garage using Step 2
- Check browser console for errors (F12)
- Verify you're logged in as garage owner

### Issue: Analytics shows all zeros
**Solution:** 
- This is normal if you don't have bookings yet
- Create some test bookings as a car owner
- Or seed analytics data: `POST http://localhost:5002/api/dev/seed-analytics`

### Issue: Bookings page is empty
**Solution:**
- Create at least one garage first
- Have car owners make reservations
- Bookings will appear automatically

### Issue: Cannot add garage - validation error
**Solution:**
- Make sure all required fields are filled
- Capacity must be at least 1
- Price cannot be negative
- Name must be at least 3 characters

### Issue: "Garage not found or you are not the owner"
**Solution:**
- You can only edit/delete garages you created
- Make sure you're logged in as the correct garage owner

---

## Testing Checklist

Use this checklist to track your testing:

- [ ] Login successful with existing account
- [ ] Can view "My Garages" page
- [ ] Can add a new garage
- [ ] New garage appears in the list
- [ ] Can edit garage details
- [ ] Changes are saved and visible
- [ ] Can view analytics dashboard
- [ ] All 6 metric cards display
- [ ] Performance insights show progress bars
- [ ] Can view bookings page
- [ ] Can filter bookings by status
- [ ] Can delete a garage (optional)

---

## What to Expect

### If You Just Created Your Account:
- My Garages: Empty (add your first garage)
- Analytics: All zeros (no bookings yet)
- Bookings: Empty (no reservations yet)

### After Adding Garages:
- My Garages: Shows your garages
- Analytics: Still zeros (need bookings)
- Bookings: Empty (need car owners to book)

### After Getting Bookings:
- My Garages: Shows your garages
- Analytics: Real numbers and statistics
- Bookings: List of all appointments

---

## Next Steps

1. ✅ Test all CRUD operations
2. ✅ View analytics (even if zeros)
3. ✅ Check bookings page
4. Create a car owner account to test booking flow
5. Make reservations to see analytics populate
6. Test booking management features

---

## Need Sample Data?

To populate your system with test data:

```powershell
# Seed garages (if needed)
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed" -Method Post

# Seed analytics data (creates bookings and payments)
Invoke-RestMethod -Uri "http://localhost:5002/api/dev/seed-analytics" -Method Post
```

This will create sample bookings so you can see real data in analytics!
