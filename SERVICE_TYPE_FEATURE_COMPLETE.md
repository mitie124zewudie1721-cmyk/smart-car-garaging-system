# Service Type Feature - Complete Implementation

## Overview
Added service type selection to the reservation system. Car owners can now specify what service they need (washing, repair, oil change, etc.) when making a reservation, and garage owners can see the requested service to decide if they can provide it.

## Features Implemented

### 1. Service Type Selection
Car owners must select a service type when creating a reservation:
- Oil Change
- Car Wash
- Tire Service
- Brake Service
- Engine Repair
- Transmission Repair
- Battery Service
- AC Service
- General Inspection
- Body Work
- Paint Service
- Electrical Repair
- Other (with custom description)

### 2. Service Description
- Optional field for most services
- Required when "Other" is selected
- Allows up to 1000 characters
- Car owner can provide detailed information about what they need

### 3. Garage Owner View
Garage owners can now see:
- Service type requested
- Detailed service description (if provided)
- All other booking information (customer, vehicle, time, price)
- Can accept or reject based on their capability to provide the service

## Changes Made

### Backend Changes

#### 1. Reservation Model (`backend/src/models/Reservation.js`)
Added new fields:
```javascript
serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
},
serviceDescription: {
    type: String,
    maxlength: [1000, 'Service description cannot exceed 1000 characters'],
    trim: true,
},
```

#### 2. Reservation Routes (`backend/src/routes/reservationRoutes.js`)
Updated validation schema:
```javascript
serviceType: z.string().min(1, 'Service type is required').max(200, 'Service type too long'),
serviceDescription: z.string().max(1000, 'Service description too long').trim().optional(),
```

#### 3. Reservation Controller (`backend/src/controllers/reservationController.js`)
Updated `createReservation` to handle service fields:
```javascript
const reservationData = {
    user: req.user.id,
    garage: garageId,
    vehicle: vehicleId,
    startTime: start,
    endTime: end,
    totalPrice,
    serviceType: serviceType.trim(),
    serviceDescription: serviceDescription?.trim() || undefined,
    notes: notes?.trim() || undefined,
};
```

### Frontend Changes

#### 1. ReservationForm Component (`frontend/src/components/car-owner/ReservationForm.tsx`)

**Added Service Types Constant:**
```typescript
const SERVICE_TYPES = [
    { value: 'Oil Change', label: 'Oil Change' },
    { value: 'Car Wash', label: 'Car Wash' },
    // ... 13 total options including "Other"
];
```

**Updated Form Schema:**
```typescript
serviceType: z.string().min(1, 'Please select a service type'),
serviceDescription: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
```

**Added UI Fields:**
- Service Type dropdown (required)
- Service Description textarea (conditional - shows when service type is selected)
- Dynamic label for description (required for "Other", optional for predefined services)

#### 2. Bookings Page (`frontend/src/pages/GarageOwner/Bookings.tsx`)

**Updated Interface:**
```typescript
interface Booking {
    // ... existing fields
    serviceType: string;
    serviceDescription?: string;
    notes?: string;
}
```

**Added Display Fields:**
```typescript
<div className="flex items-center text-sm">
    <span>Service:</span>
    <span>{booking.serviceType}</span>
</div>
{booking.serviceDescription && (
    <div className="flex items-start text-sm">
        <span>Details:</span>
        <span>{booking.serviceDescription}</span>
    </div>
)}
```

## User Flow

### Car Owner Flow:
1. Find a garage
2. Click "Reserve Now"
3. Select vehicle
4. **Select service type** (NEW)
5. **Optionally describe service needs** (NEW)
6. Select date/time
7. Add notes (optional)
8. Confirm reservation

### Garage Owner Flow:
1. Go to Bookings page
2. See pending reservations
3. **View requested service type** (NEW)
4. **View service description if provided** (NEW)
5. Decide if they can provide the service
6. Accept or Reject the booking

## Example Scenarios

### Scenario 1: Oil Change
```
Service Type: Oil Change
Description: (optional) "Need synthetic oil, 5W-30"
```

### Scenario 2: Engine Repair
```
Service Type: Engine Repair
Description: "Engine making strange knocking sound when accelerating. Started 2 days ago."
```

### Scenario 3: Custom Service
```
Service Type: Other
Description: (required) "Need to install aftermarket exhaust system. I have the parts."
```

## Benefits

1. **Clear Communication**: Car owners can specify exactly what they need
2. **Better Matching**: Garage owners know if they can provide the service before accepting
3. **Reduced Confusion**: No more guessing what service is needed
4. **Flexibility**: "Other" option allows for any custom service
5. **Detailed Information**: Description field allows for specific details

## API Changes

### Create Reservation Endpoint
**POST** `/api/reservations`

**New Required Field:**
```json
{
  "serviceType": "Oil Change"
}
```

**New Optional Field:**
```json
{
  "serviceDescription": "Need synthetic oil, 5W-30"
}
```

**Full Example:**
```json
{
  "garageId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "vehicleId": "65f8a1b2c3d4e5f6a7b8c9d1",
  "serviceType": "Engine Repair",
  "serviceDescription": "Engine making strange noise",
  "startTime": "2026-03-05T08:00:00.000Z",
  "endTime": "2026-03-05T10:00:00.000Z",
  "notes": "Please call before starting work"
}
```

## Testing

### Test Cases:

1. **Create reservation with predefined service**:
   - Select "Oil Change"
   - Leave description empty
   - Should create successfully

2. **Create reservation with custom service**:
   - Select "Other"
   - Add description
   - Should create successfully

3. **Create reservation without service type**:
   - Leave service type empty
   - Should show validation error

4. **View booking as garage owner**:
   - Should see service type
   - Should see description if provided

5. **Accept/Reject based on service**:
   - Garage owner can decide based on service capability

## Files Modified

### Backend:
- `backend/src/models/Reservation.js` - Added service fields
- `backend/src/routes/reservationRoutes.js` - Added validation
- `backend/src/controllers/reservationController.js` - Handle service data

### Frontend:
- `frontend/src/components/car-owner/ReservationForm.tsx` - Added service selection UI
- `frontend/src/pages/GarageOwner/Bookings.tsx` - Display service information

## Status
✅ Backend model updated
✅ Backend validation added
✅ Backend controller updated
✅ Frontend form updated with service selection
✅ Frontend booking display updated
✅ 13 predefined service types
✅ Custom "Other" option
✅ Service description field
✅ Conditional UI (description shows when service selected)
✅ Ready to test

The service type feature is now fully functional! Car owners can specify what service they need, and garage owners can see this information to make informed decisions about accepting bookings.
