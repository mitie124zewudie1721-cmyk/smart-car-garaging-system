# Quick Start: Analytics Feature

## 🚀 Quick Setup (3 Steps)

### 1. Restart Backend
```bash
cd backend
npm run dev
```

### 2. Seed Data
Run this PowerShell script to seed all required data:
```powershell
.\test-analytics.ps1
```

Or manually seed using these endpoints:
```bash
# Seed garages
POST http://localhost:5002/api/dev/seed

# Seed admin
POST http://localhost:5002/api/dev/seed-admin

# Seed analytics data
POST http://localhost:5002/api/dev/seed-analytics
```

### 3. View Analytics
1. Open: http://localhost:5173/login
2. Login: `admin` / `admin123`
3. Click "Reports" in sidebar
4. View charts with real data!

## ✅ What's Fixed

- ❌ **Before**: 404 errors on analytics endpoints
- ✅ **After**: Real-time data from MongoDB

- ❌ **Before**: Mock/fake data in charts
- ✅ **After**: Actual user, reservation, and revenue data

## 📊 Available Analytics

### Reports Page
- **User Registrations**: Track new user signups
- **Total Reservations**: Monitor booking activity
- **Revenue Trend**: View income over time

### Time Ranges
- **Week**: Last 7 days (daily breakdown)
- **Month**: Last 30 days (weekly breakdown)
- **Year**: Last 12 months (monthly breakdown)

## 🔧 Troubleshooting

### Charts show "No data available"
**Solution**: Run the seed script
```powershell
.\test-analytics.ps1
```

### 404 errors on analytics
**Solution**: Make sure backend is running on port 5002
```bash
cd backend
npm run dev
```

### Can't login as admin
**Solution**: Seed the admin user
```bash
POST http://localhost:5002/api/dev/seed-admin
```

## 📁 Files Changed

### Backend (3 files)
- `backend/src/controllers/adminController.js` - Added analytics logic
- `backend/src/routes/adminRoutes.js` - Added analytics route
- `backend/src/routes/seedAnalytics.js` - New seed endpoint

### Frontend (1 file)
- `frontend/src/components/admin/AnalyticsChart.tsx` - Replaced mock data with API calls

## 🎯 Test Checklist

- [ ] Backend running on port 5002
- [ ] Admin user seeded
- [ ] Analytics data seeded
- [ ] Can login as admin
- [ ] Reports page loads without errors
- [ ] Charts display data
- [ ] Can switch between Week/Month/Year
- [ ] System Overview shows statistics
- [ ] Users page shows user list

## 📞 Need Help?

Check these files for more details:
- `ANALYTICS_TESTING_GUIDE.md` - Detailed testing instructions
- `ANALYTICS_IMPLEMENTATION_SUMMARY.md` - Technical details
- `test-analytics.ps1` - Automated testing script
