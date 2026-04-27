# 🚀 Quick Start - Garage Verification System

## ⚡ 3-Minute Setup

### 1. Start the Application

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Test the System

```powershell
# Terminal 3 - Run test
.\test-complete-verification-flow.ps1
```

---

## 🎯 Quick Test (5 Minutes)

### Test 1: Add Garage (Garage Owner)
1. Open `http://localhost:5173`
2. Login:
   - Username: `garageowner`
   - Password: `garageowner123`
3. Click "Add Garage" in sidebar
4. Fill in:
   - Name: "Test Garage"
   - Address: "123 Test St"
   - Capacity: 20
   - Price: 50
5. Submit
6. ✓ See success message with "pending verification"
7. Go to "My Garages"
8. ✓ See yellow "Pending Verification" badge

### Test 2: Approve Garage (Admin)
1. Logout
2. Login:
   - Username: `admin`
   - Password: `admin123`
3. Click "Garage Verification" in sidebar
4. ✓ See your test garage in pending list
5. Click on the garage
6. Click "Approve Garage"
7. Confirm
8. ✓ Garage disappears from list

### Test 3: Verify Approval (Garage Owner)
1. Logout
2. Login as garage owner again
3. Go to "My Garages"
4. ✓ Badge is gone
5. ✓ No warning message

### Test 4: Search Results (Car Owner)
1. Logout
2. Login:
   - Username: `carowner`
   - Password: `carowner123`
3. Click "Find Garage"
4. Search for garages
5. ✓ Your approved garage appears in results

---

## 📍 Where to Find Things

### Garage Owner:
- **Add Garage**: Sidebar → "Add Garage"
- **View Status**: Sidebar → "My Garages"
- **Status Badges**: On each garage card

### Admin:
- **Verification Page**: Sidebar → "Garage Verification"
- **Pending List**: Left panel
- **Garage Details**: Right panel
- **Actions**: Bottom of details panel

### Car Owner:
- **Search**: Sidebar → "Find Garage"
- **Results**: Only shows approved garages

---

## 🎨 What You'll See

### Garage Owner - Pending Garage:
```
┌────────────────────────────────┐
│ [Image]    ⏳ Pending          │
│                                 │
│ Test Garage                    │
│ 123 Test St                    │
│                                 │
│ ⚠️ Cannot receive bookings     │
│    until approved               │
└────────────────────────────────┘
```

### Admin - Verification Page:
```
┌─────────────────────────────────────┐
│ Garage Verification                 │
├─────────────────────────────────────┤
│ Pending (1)  │  Test Garage         │
│              │  123 Test St         │
│ Test Garage  │                      │
│ Owner: john  │  [Approve] [Reject]  │
└─────────────────────────────────────┘
```

---

## ✅ Success Checklist

After testing, you should see:
- [ ] Garage registered with pending status
- [ ] Yellow badge on garage card
- [ ] Warning message displayed
- [ ] Admin sees garage in verification page
- [ ] Admin can approve garage
- [ ] Badge disappears after approval
- [ ] Garage appears in car owner search

---

## 🐛 Troubleshooting

### Backend not starting?
```powershell
cd backend
npm install
npm run dev
```

### Frontend not starting?
```powershell
cd frontend
npm install
npm run dev
```

### Can't see verification page?
- Make sure you're logged in as admin
- Check sidebar for "Garage Verification" link
- URL should be: `http://localhost:5173/admin/garage-verification`

### Status not updating?
- Refresh the page
- Check backend logs for errors
- Verify database connection

---

## 📚 Full Documentation

- `WHAT_YOU_WILL_SEE.md` - Visual guide
- `GARAGE_VERIFICATION_COMPLETE.md` - Complete docs
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - Technical details

---

## 🎉 That's It!

You now have a fully functional garage verification system with:
- ✅ Pending status for new garages
- ✅ Admin approval workflow
- ✅ Status badges and alerts
- ✅ Complete UI integration

**Enjoy!** 🚀
