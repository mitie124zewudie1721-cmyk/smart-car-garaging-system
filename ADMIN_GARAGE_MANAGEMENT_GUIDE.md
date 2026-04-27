# Admin Garage Management Feature

## Overview
A comprehensive admin dashboard to view detailed information about each garage, including their owners, customers, and reservations.

## What This Feature Does

### 1. Garage Overview
- View all garages in the system
- See statistics for each garage:
  - Total reservations
  - Total revenue generated
  - Available slots
  - Price per hour
  - Garage owner information

### 2. Garage Owner Information
Each garage card shows:
- Owner name
- Owner email
- Owner phone number
- Garage status (approved/pending/rejected)

### 3. Customer Reservations
Click "View Full Details & Customers" to see:
- Complete list of all customers who made reservations
- Number of unique customers
- Reservation details:
  - Customer name and phone
  - Service type
  - Price paid
  - Reservation date and time
  - Status (confirmed/completed/cancelled)

### 4. Statistics Dashboard
Top row shows:
- **Total Garages**: All garages in system
- **Approved**: Active garages
- **Pending**: Awaiting approval
- **Total Bookings**: All reservations across all garages
- **Total Revenue**: Combined revenue from all garages

### 5. Search and Filter
- Search by garage name, address, or owner name
- Filter by status: All, Approved, Pending, Rejected

## How to Access

### Add to Sidebar
You need to add this page to the admin sidebar navigation:

1. Open `frontend/src/components/layout/Sidebar.tsx`
2. Add to admin navigation items:

```typescript
{
  name: 'Garage Management',
  path: '/admin/garage-management',
  icon: Building2,
  roles: ['admin']
}
```

### Add Route
Add to `frontend/src/App.tsx`:

```typescript
<Route path="/admin/garage-management" element={<GarageManagement />} />
```

## Files Created/Modified

### New Files:
1. `frontend/src/pages/Admin/GarageManagement.tsx` - Main component

### Modified Files:
1. `backend/src/controllers/adminController.js` - Added:
   - `getGarageStats()` - Get stats for specific garage
   - `getGarageReservations()` - Get all reservations for garage

2. `backend/src/routes/adminRoutes.js` - Added routes:
   - `GET /api/admin/garages/:garageId/stats`
   - `GET /api/admin/garages/:garageId/reservations`

## Features

### Colorful Statistics Cards
- Purple gradient: Total Garages
- Green gradient: Approved Garages
- Yellow gradient: Pending Garages
- Blue gradient: Total Bookings
- Indigo gradient: Total Revenue

### Garage Cards
Each garage card shows:
- Garage name and location
- Owner information (name, email, phone)
- Quick stats (reservations, revenue, slots, price)
- Status badge
- "View Full Details" button

### Details Modal
When you click "View Full Details & Customers":
- Shows garage summary
- Lists all customers who made reservations
- Shows reservation history with:
  - Customer contact info
  - Service type
  - Amount paid
  - Date and status

### Smooth Transitions
- Cards scale up on hover (1.02x)
- Shadow effects
- 300ms smooth transitions
- Button hover effects

## Use Cases

### 1. Monitor Garage Performance
See which garages are most popular and generating the most revenue.

### 2. Identify Garage Owners
Quickly find who owns each garage and their contact information.

### 3. Track Customer Activity
See which customers are using which garages and how often.

### 4. Isolate Garage Data
View data for each garage separately - reservations, customers, and revenue are isolated per garage.

### 5. Verify Garage Operations
Check if garages are receiving bookings and operating properly.

## Example Data Flow

1. **Admin views Garage Management page**
   - System fetches all garages
   - For each garage, fetches stats (reservations count, revenue)
   - Displays in colorful cards

2. **Admin clicks "View Full Details"**
   - System fetches garage details
   - Fetches all reservations for that garage
   - Calculates unique customers
   - Shows in modal with full information

3. **Admin can search/filter**
   - Search by name, address, or owner
   - Filter by status
   - Results update instantly

## Benefits

✅ **Separation of Data**: Each garage's data is isolated and clearly separated
✅ **Owner Visibility**: Easy to see who owns which garage
✅ **Customer Tracking**: See which users are customers of each garage
✅ **Performance Monitoring**: Track reservations and revenue per garage
✅ **Professional UI**: Colorful gradients and smooth animations
✅ **Easy Navigation**: Search and filter capabilities

## Next Steps

1. Add the route to App.tsx
2. Add navigation link to Sidebar.tsx
3. Restart frontend: `npm run dev`
4. Login as admin
5. Navigate to "Garage Management"
6. View garage details and customer information!
