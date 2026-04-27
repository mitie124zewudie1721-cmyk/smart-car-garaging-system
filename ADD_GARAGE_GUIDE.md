# Add Garage Guide - Fixed!

## ✅ Problem Fixed

The garage form was missing location coordinates fields. Now it includes latitude and longitude inputs.

## 🚀 How to Add a Garage

### Step 1: Login as Garage Owner
- Username: `garageowner`
- Password: `garageowner123`

### Step 2: Navigate to "Add Garage"
Click "Add Garage" in the sidebar or go to: http://localhost:5173/add-garage

### Step 3: Fill in the Form

**Required Fields:**
- **Garage Name**: e.g., `Jimma Auto Service Center`
- **Address**: e.g., `Piazza, Jimma, Ethiopia`
- **Latitude**: e.g., `7.6779`
- **Longitude**: e.g., `36.8219`
- **Capacity**: e.g., `20` (number of service slots)
- **Price per Hour**: e.g., `150` (ETB)

**Optional Fields:**
- **Description**: Brief description of your garage
- **Amenities**: Check boxes for services (covered, secure, 24h, etc.)

### Step 4: Submit
Click "Add Garage" button

## 📍 How to Find Coordinates

### Method 1: Google Maps
1. Go to https://www.google.com/maps
2. Find your garage location
3. Right-click on the exact spot
4. Click "What's here?"
5. Coordinates appear at the bottom (Latitude, Longitude)

### Method 2: Use Sample Coordinates

Here are some Ethiopian city coordinates you can use for testing:

| City | Latitude | Longitude |
|------|----------|-----------|
| Jimma | 7.6779 | 36.8219 |
| Addis Ababa | 9.0320 | 38.7469 |
| Dire Dawa | 9.5930 | 41.8660 |
| Mekelle | 13.4967 | 39.4753 |
| Bahir Dar | 11.5933 | 37.3905 |
| Hawassa | 7.0621 | 38.4769 |

## 📝 Example Garage Data

```
Garage Name: Jimma Auto Service Center
Address: Piazza, Jimma, Ethiopia
Latitude: 7.6779
Longitude: 36.8219
Capacity: 20
Price per Hour: 150
Description: Full-service auto repair and maintenance center
Amenities: ✓ covered, ✓ secure, ✓ 24h, ✓ repair, ✓ cctv
```

## ✅ What Was Fixed

**Frontend Changes** (`frontend/src/components/garage-owner/GarageForm.tsx`):
- ✅ Added latitude input field
- ✅ Added longitude input field
- ✅ Added helpful tip box with example coordinates
- ✅ Updated form submission to send proper location object
- ✅ Location object now includes: `{ type: 'Point', coordinates: [lng, lat], address }`

## 🎯 Validation Rules

### Latitude
- Must be between -90 and 90
- Decimal number (e.g., 7.6779)

### Longitude
- Must be between -180 and 180
- Decimal number (e.g., 36.8219)

### Other Fields
- Name: Min 3 characters
- Address: Min 5 characters
- Capacity: At least 1
- Price: Cannot be negative

## 🐛 Troubleshooting

### "Location coordinates are required" error
**Solution**: Make sure you filled in both Latitude and Longitude fields

### "Invalid coordinates" error
**Solution**: 
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Use decimal format (e.g., 7.6779, not 7°40'40")

### Can't find coordinates
**Solution**: Use the sample coordinates above or search your city on Google Maps

## 🎉 Success!

After submitting:
- ✅ Success toast appears
- ✅ Redirected to "My Garages" page
- ✅ Your new garage appears in the list
- ✅ Garage is now searchable by car owners

## 📊 Test Multiple Garages

Try adding garages in different locations:

**Garage 1 - Jimma:**
- Name: Jimma Auto Service
- Lat: 7.6779, Lng: 36.8219
- Capacity: 20, Price: 150

**Garage 2 - Addis Ababa:**
- Name: Addis Premium Garage
- Lat: 9.0320, Lng: 38.7469
- Capacity: 30, Price: 200

**Garage 3 - Bahir Dar:**
- Name: Bahir Dar Car Care
- Lat: 11.5933, Lng: 37.3905
- Capacity: 15, Price: 120

Now you can successfully add garages with proper location data!
