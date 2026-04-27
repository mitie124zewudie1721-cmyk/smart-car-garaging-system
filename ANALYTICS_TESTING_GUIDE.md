# Analytics Testing Guide

## Overview
The analytics system now uses real database data instead of mock data. This guide explains how to test the analytics features.

## Prerequisites
1. Backend server running on `http://localhost:5002`
2. Frontend running on `http://localhost:5173`
3. Admin user created (username: `admin`, password: `admin123`)

## Setup Steps

### 1. Seed Required Data

Run these endpoints in order:

```bash
# 1. Seed garages (if not already done)
POST http://localhost:5002/api/dev/seed

# 2. Seed admin user (if not already done)
POST http://localhost:5002/api/dev/seed-admin

# 3. Register some car owner users (or use existing ones)
# You can register via the frontend at http://localhost:5173/register

# 4. Seed analytics data (reservations and payments)
POST http://localhost:5002/api/dev/seed-analytics
```

### 2. Login as Admin

1. Go to `http://localhost:5173/login`
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### 3. View Analytics

Navigate to the Reports page:
- Click on "Reports" in the sidebar
- You should see three charts:
  - User Registrations
  - Total Reservations
  - Revenue Trend

### 4. Test Different Time Ranges

Use the buttons at the top to switch between:
- Week (last 7 days)
- Month (last 30 days)
- Year (last 12 months)

## API Endpoints

### Analytics Endpoints (Admin Only)

```
GET /api/admin/analytics/:type/:period
```

Parameters:
- `type`: `users`, `reservations`, or `revenue`
- `period`: `week`, `month`, or `year`

Examples:
```bash
GET /api/admin/analytics/users/month
GET /api/admin/analytics/reservations/week
GET /api/admin/analytics/revenue/year
```

### System Stats Endpoint

```
GET /api/admin/stats
```

Returns:
- Total users
- Total garages
- Total reservations
- Total revenue
- Active reservations
- Completed reservations

## Troubleshooting

### 404 Errors on Analytics Endpoints

If you see 404 errors:
1. Make sure the backend server is running
2. Verify you're logged in as an admin user
3. Check that the admin routes are properly mounted in `backend/src/app.js`

### No Data Showing

If charts show "No data available":
1. Run the seed-analytics endpoint: `POST http://localhost:5002/api/dev/seed-analytics`
2. Make sure you have car owner users registered
3. Make sure garages are seeded

### Authentication Errors

If you get 401 errors:
1. Make sure you're logged in
2. Check that your token is valid (stored in localStorage)
3. Try logging out and logging back in

## Data Structure

### Analytics Response Format

```json
{
  "success": true,
  "data": [
    {
      "label": "Mon",
      "count": 12
    },
    {
      "label": "Tue",
      "count": 15
    }
  ]
}
```

For revenue:
```json
{
  "success": true,
  "data": [
    {
      "label": "Week 1",
      "total": 12000
    }
  ]
}
```

## Notes

- The seed-analytics endpoint creates 2-5 reservations per day for the past 30 days
- Each reservation has a corresponding payment record
- Revenue is calculated from successful payments only
- All analytics data is aggregated from the MongoDB database in real-time
