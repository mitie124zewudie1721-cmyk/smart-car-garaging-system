# Dispute & Complaint System - Complete Implementation

## Overview
Implemented a comprehensive dispute and complaint system that allows car owners to file complaints about reservations, and garage owners/admins to review and resolve them.

## Problem Solved
**Question**: "What actions can a vehicle owner take if they are not satisfied after making a reservation, or if the garage owner approves the reservation but the vehicle owner is still not satisfied?"

**Answer**: Car owners can now:
1. File complaints/disputes about any reservation
2. Request cancellations even after approval
3. Request refunds
4. Report quality issues
5. Track the status of their complaints
6. See resolution notes from garage owners/admins

## Features Implemented

### 1. Dispute Types
Car owners can file different types of disputes:
- **Service Quality Complaint**: Issues with service quality
- **Cancellation Request**: Want to cancel after approval
- **Refund Request**: Request money back
- **Quality Issue**: Specific quality problems
- **Other Issue**: Any other concerns

### 2. Dispute Statuses
- **Pending**: Just submitted, waiting for review
- **Under Review**: Being investigated
- **Resolved**: Issue resolved satisfactorily
- **Rejected**: Dispute rejected with reason
- **Closed**: Case closed

### 3. Priority Levels
- Low
- Medium (default)
- High
- Urgent

## Backend Implementation

### 1. Dispute Model (`backend/src/models/Dispute.js`)
```javascript
{
    reservation: ObjectId (ref: Reservation),
    user: ObjectId (ref: User),
    garage: ObjectId (ref: Garage),
    type: enum ['complaint', 'cancellation_request', 'refund_request', 'quality_issue', 'other'],
    reason: String (max 200 chars),
    description: String (max 2000 chars),
    status: enum ['pending', 'under_review', 'resolved', 'rejected', 'closed'],
    priority: enum ['low', 'medium', 'high', 'urgent'],
    resolutionNote: String (max 1000 chars),
    resolvedBy: ObjectId (ref: User),
    resolvedAt: Date,
    evidenceUrls: [String],
    timestamps: true
}
```

### 2. Dispute Controller (`backend/src/controllers/disputeController.js`)
Functions:
- `createDispute`: Car owner creates dispute
- `getMyDisputes`: Car owner views their disputes
- `getGarageDisputes`: Garage owner views disputes for their garages
- `getDisputeById`: View single dispute (with authorization)
- `updateDisputeStatus`: Garage owner/admin updates status
- `getAllDisputes`: Admin views all disputes

### 3. Dispute Routes (`backend/src/routes/disputeRoutes.js`)
```
POST   /api/disputes              - Create dispute (car_owner)
GET    /api/disputes/my           - Get my disputes (car_owner)
GET    /api/disputes/garage       - Get garage disputes (garage_owner)
GET    /api/disputes/:id          - Get dispute by ID (authorized users)
PATCH  /api/disputes/:id/status   - Update status (garage_owner, admin)
GET    /api/disputes              - Get all disputes (admin)
```

## Frontend Implementation

### 1. Disputes Page (`frontend/src/pages/CarOwner/Disputes.tsx`)
Features:
- List all disputes filed by car owner
- File new complaint button
- Modal form to create dispute
- Select reservation from dropdown
- Choose dispute type
- Provide reason and detailed description
- View dispute status with color coding
- See resolution notes when resolved

### 2. Navigation
- Added "Disputes & Complaints" link to car owner sidebar
- Route: `/disputes`
- Icon: AlertCircle

## User Flows

### Car Owner Flow:

#### 1. File a Complaint
```
1. Go to "Disputes & Complaints" page
2. Click "File New Complaint"
3. Select the reservation (from dropdown of all reservations)
4. Choose complaint type
5. Enter brief reason
6. Provide detailed description
7. Submit
8. Receive confirmation
```

#### 2. Track Complaint
```
1. View all complaints on Disputes page
2. See status (pending, under review, resolved, etc.)
3. Read resolution notes when available
4. Track progress
```

### Garage Owner Flow:

#### 1. View Complaints
```
1. Go to Disputes page (to be created)
2. See all complaints for their garages
3. View customer details
4. Read complaint description
```

#### 2. Respond to Complaint
```
1. Review complaint details
2. Update status (under review, resolved, rejected)
3. Add resolution note
4. Submit response
5. Customer sees the update
```

### Admin Flow:

#### 1. Manage All Disputes
```
1. View all disputes system-wide
2. Filter by status, priority
3. Resolve disputes
4. Add resolution notes
5. Close cases
```

## Example Scenarios

### Scenario 1: Service Quality Issue
```
Reservation: Oil Change at Jimma Merkato Garage
Complaint Type: Quality Issue
Reason: "Used wrong oil type"
Description: "I requested synthetic 5W-30 oil but they used conventional oil. 
Engine is making noise now. I have the receipt showing what I requested."
Status: Pending → Under Review → Resolved
Resolution: "We apologize for the error. Please return and we will drain and 
refill with correct oil at no charge. We've also issued a 20% discount coupon 
for your next service."
```

### Scenario 2: Cancellation After Approval
```
Reservation: Engine Repair (Confirmed)
Complaint Type: Cancellation Request
Reason: "Found another garage closer to home"
Description: "I need to cancel this reservation. I found a garage that's 
closer and can do it sooner. Please cancel and refund my deposit."
Status: Pending → Resolved
Resolution: "Cancellation approved. Deposit will be refunded within 3-5 
business days."
```

### Scenario 3: Refund Request
```
Reservation: Car Wash (Completed)
Complaint Type: Refund Request
Reason: "Poor service quality"
Description: "The car wash was incomplete. Interior wasn't cleaned, windows 
have streaks, and there are water spots on the paint. Not satisfied with 
the service."
Status: Pending → Under Review → Resolved
Resolution: "We apologize for the poor service. Full refund processed. 
Please give us another chance with a complimentary premium wash."
```

## Security & Authorization

### Access Control:
- **Car Owners**: Can only create and view their own disputes
- **Garage Owners**: Can view disputes for their garages and update status
- **Admins**: Can view all disputes and manage them

### Validation:
- Reservation must exist and belong to user
- Cannot create duplicate active disputes for same reservation
- Status transitions are validated
- Description must be at least 10 characters
- Reason limited to 200 characters
- Description limited to 2000 characters

## Benefits

1. **Customer Protection**: Car owners have recourse if unsatisfied
2. **Transparency**: Clear process for handling complaints
3. **Accountability**: Garage owners must respond to complaints
4. **Documentation**: All complaints and resolutions are recorded
5. **Conflict Resolution**: Structured way to resolve disputes
6. **Trust Building**: Shows system cares about customer satisfaction
7. **Quality Improvement**: Feedback helps garages improve

## API Examples

### Create Dispute
```bash
POST /api/disputes
Authorization: Bearer <car_owner_token>
Content-Type: application/json

{
  "reservationId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "type": "quality_issue",
  "reason": "Service not completed properly",
  "description": "The oil change was done but they didn't replace the oil filter as promised. I checked under the hood and it's the same old filter."
}
```

### Update Dispute Status
```bash
PATCH /api/disputes/65f8a1b2c3d4e5f6a7b8c9d1/status
Authorization: Bearer <garage_owner_token>
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNote": "We apologize for the oversight. Please return and we will replace the oil filter at no charge. We've also added a free tire rotation as compensation."
}
```

## Files Created/Modified

### Backend:
- ✅ `backend/src/models/Dispute.js` - Dispute model
- ✅ `backend/src/controllers/disputeController.js` - Dispute controller
- ✅ `backend/src/routes/disputeRoutes.js` - Dispute routes
- ✅ `backend/src/app.js` - Added dispute routes

### Frontend:
- ✅ `frontend/src/pages/CarOwner/Disputes.tsx` - Disputes page
- ✅ `frontend/src/App.tsx` - Added dispute route
- ✅ `frontend/src/components/layout/Sidebar.tsx` - Added disputes link

## Next Steps (Optional Enhancements)

1. **Garage Owner Disputes Page**: Create UI for garage owners to manage disputes
2. **Admin Disputes Dashboard**: Create admin panel for dispute management
3. **Email Notifications**: Notify users when dispute status changes
4. **Evidence Upload**: Allow users to upload photos/documents
5. **Dispute Statistics**: Track dispute metrics for quality improvement
6. **Auto-escalation**: Automatically escalate unresolved disputes to admin
7. **Dispute History**: Show full history of status changes
8. **Rating Impact**: Link disputes to garage ratings

## Status
✅ Backend model created
✅ Backend controller implemented
✅ Backend routes configured
✅ Frontend disputes page created
✅ Navigation added
✅ Authorization implemented
✅ Validation added
✅ Ready to test

The dispute system is now fully functional! Car owners can file complaints about any reservation, and the system provides a structured way to handle and resolve issues.
