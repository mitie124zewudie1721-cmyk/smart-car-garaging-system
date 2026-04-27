# Garage Owner Features Testing Guide

## Overview
This guide covers testing all Garage Owner features:
1. Garage CRUD Operations (Create, Read, Update, Delete)
2. Analytics Dashboard
3. Booking Management

## Prerequisites

### 1. Backend Running
```bash
cd backend
npm run dev
```
Server should be running on `http://localhost:5002`

### 2. Frontend Running
```bash
cd frontend
npm run dev
```
Frontend should be running on `http://localhost:5173`

### 3. Create Garage Owner Account

**Option A: Register via Frontend**
1. Go to `http://localhost:5173/register`
2. Fill in the form:
   - Name: `Test Garage Owner`
   - Username: `garageowner`
   - Password: `password123`
   - Role: Select `Garage Owner`
3. Click Register

**Option B: Use Existing Account**
- Username: `garageowner`
- Password: `password123`

## Feature 1: Garage CRUD Operations

### A. Create Garage (Add New Garage)

**Steps:**
1. Login as garage owner at `http://localhost:5173/login`
2. Navigate to "My Garages" from sidebar
3. Click "+ Add New Garage" button
4. Fill in the form:
   - **Garage Name**: `Jimma Auto Service Center`
   - **Address**: `Piazza, Jimma, Ethiopia`
   - **Capacity**: `20` (number of service slots)
   - **Price per Hour**: `150` (ETB)
   - **Description**: `Full-service auto repair and maintenance center`
   - **Amenities**: Check boxes like `covered`, `secure`, `24h`, `repair`, `cctv`
5. Click "Add Garage"

**Expected Result:**
- ✅ Success toast: "Garage added successfully!"
- ✅ Redirected to "My Garages" page
- ✅ New garage appears in the list

**API Endpoint:**
```
POST /api/garages
Authorization: Bearer <token>
Body: {
  "name": "Jimma Auto Service Center",
  "address": "Piazza, Jimma, Ethiopia",
  "capacity": 20,
  "pricePerHour": 150,
  "description": "Full-service auto repair and maintenance center",
  "amenities": ["covered", "secure", "24h", "repair", "cctv"]
}
```

### B. Read Garages (View My Garages)

**Steps:**
1. Login as garage owner
2. Navigate to "My Garages" from sidebar

**Expected Result:**
- ✅ List of all garages owned by you
- ✅ Each garage card shows:
  - Garage name
  - Address
  - Capacity and available slots
  - Price per hour
  - Rating
  - Amenities
  - Edit and Delete buttons

**API Endpoint:**
```
GET /api/garages/my
Authorization: Bearer <token>
```

### C. Update Garage (Edit Garage)

**Steps:**
1. Go to "My Garages"
2. Click "Edit" button on any garage card
3. Modify any fields (e.g., change price from 150 to 175)
4. Click "Update Garage"

**Expected Result:**
- ✅ Success toast: "Garage updated successfully!"
- ✅ Changes reflected in garage list
- ✅ Updated data saved to database

**API Endpoint:**
```
PUT /api/garages/:id
Authorization: Bearer <token>
Body: {
  "pricePerHour": 175
}
```

### D. Delete Garage

**Steps:**
1. Go to "My Garages"
2. Click "Delete" button on any garage card
3. Confirm deletion in the popup

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Success toast: "Garage deleted successfully!"
- ✅ Garage removed from list
- ✅ Garage deleted from database

**API Endpoint:**
```
DELETE /api/garages/:id
Authorization: Bearer <token>
```

## Feature 2: Analytics Dashboard

### View Analytics

**Steps:**
1. Login as garage owner
2. Navigate to "Analytics" from sidebar

**Expected Result:**
- ✅ Dashboard displays 6 metric cards:
  - **Total Bookings**: Total number of service appointments
  - **Completed Services**: Successfully completed appointments
  - **Total Revenue**: Total earnings in ETB
  - **Average Rating**: Customer satisfaction rating
  - **Active Bookings**: Currently ongoing appointments
  - **Cancelled Bookings**: Cancelled appointments
- ✅ Performance Insights section shows:
  - Completion Rate progress bar
  - Customer Satisfaction progress bar

**Current Status:**
⚠️ Currently using mock data. Real API endpoint needs implementation.

**API Endpoint (To Be Implemented):**
```
GET /api/garages/my/analytics
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": {
    "totalBookings": 45,
    "completedServices": 38,
    "revenue": 15000,
    "averageRating": 4.5,
    "activeBookings": 3,
    "cancelledBookings": 4
  }
}
```

## Feature 3: Booking Management

### View Bookings for Your Garages

**Current Status:**
⚠️ Booking management page not yet implemented for garage owners.

**What Should Be Available:**
- View all reservations for your garages
- Filter by status (pending, confirmed, active, completed, cancelled)
- Accept or reject booking requests
- Update booking status
- View customer details
- Communicate with customers

**Recommended Implementation:**
Create a new page: `frontend/src/pages/GarageOwner/Bookings.tsx`

**API Endpoints Needed:**
```
GET /api/garages/my/bookings
GET /api/reservations/:id/accept
GET /api/reservations/:id/reject
PATCH /api/reservations/:id/status
```

## Testing Checklist

### Garage CRUD Operations
- [ ] Can create a new garage
- [ ] Can view list of my garages
- [ ] Can edit garage details
- [ ] Can delete a garage
- [ ] Form validation works (required fields, min/max values)
- [ ] Error handling works (network errors, validation errors)

### Analytics Dashboard
- [ ] Analytics page loads without errors
- [ ] All 6 metric cards display
- [ ] Performance insights show progress bars
- [ ] Data updates when new bookings are made

### Booking Management
- [ ] Can view all bookings for my garages
- [ ] Can filter bookings by status
- [ ] Can accept/reject booking requests
- [ ] Can update booking status
- [ ] Can view customer information

## Common Issues & Solutions

### Issue: "Garage not found or you are not the owner"
**Solution:** Make sure you're logged in as the garage owner who created the garage.

### Issue: Garages not showing in list
**Solution:** 
1. Check if you're logged in as garage owner
2. Verify garages exist in database
3. Check browser console for API errors

### Issue: Cannot add garage - validation errors
**Solution:**
- Ensure all required fields are filled
- Capacity must be at least 1
- Price cannot be negative
- Name must be at least 3 characters

### Issue: Analytics showing mock data
**Solution:** This is expected. Backend analytics endpoint needs to be implemented.

## Seed Data for Testing

### Create Test Garage Owner
```bash
# Register via frontend or use existing:
Username: garageowner
Password: password123
```

### Create Multiple Garages
Use the "Add Garage" form to create 3-5 test garages with different:
- Names
- Locations
- Capacities
- Prices
- Amenities

## API Testing with cURL

### Create Garage
```bash
curl -X POST http://localhost:5002/api/garages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Garage",
    "address": "Test Address",
    "capacity": 10,
    "pricePerHour": 100
  }'
```

### Get My Garages
```bash
curl -X GET http://localhost:5002/api/garages/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Garage
```bash
curl -X PUT http://localhost:5002/api/garages/GARAGE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pricePerHour": 150
  }'
```

### Delete Garage
```bash
curl -X DELETE http://localhost:5002/api/garages/GARAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

1. Test all CRUD operations thoroughly
2. Implement real analytics backend endpoint
3. Create booking management page for garage owners
4. Add notification system for new bookings
5. Implement booking acceptance/rejection workflow
