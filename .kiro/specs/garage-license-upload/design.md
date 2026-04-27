# Design Document: Garage License Upload and Verification

## Overview

This design implements a mandatory license upload and admin verification workflow for garage registration. The feature addresses a critical business risk in the current system where garages become immediately operational without any verification or admin oversight.

### Problem Statement

The current system allows garages to:
- Become immediately active after registration
- Receive bookings without any verification
- Appear in search results without admin approval
- Operate without providing business credentials

This creates significant compliance, legal, and quality control risks.

### Solution Overview

This feature introduces a three-state verification workflow:
1. **Pending Verification**: Garage registered but cannot receive bookings (default state after registration)
2. **Approved**: Admin has verified the license, garage is fully operational
3. **Rejected**: Admin has rejected the license, garage must resubmit

The solution enforces that NO garage can receive bookings or appear in search results until an admin explicitly approves their license document.

### Key Design Principles

- **Security First**: All file uploads are validated, sanitized, and stored securely
- **Admin Control**: Only admins can transition garages to operational status
- **User Experience**: Clear feedback at every stage of the verification process
- **Backward Compatibility**: Existing garages are migrated to the new workflow
- **Fail-Safe**: System defaults to restricted access until verification is complete


## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Garage Owner   │────────▶│   File Upload    │────────▶│  File Storage   │
│   Frontend      │         │   Middleware     │         │    Service      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │                            │
                                     ▼                            ▼
                            ┌──────────────────┐         ┌─────────────────┐
                            │   Validation     │         │    Database     │
                            │    Service       │         │  (Garage Model) │
                            └──────────────────┘         └─────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Admin Panel    │────────▶│  Verification    │────────▶│   Notification  │
│   Frontend      │         │   Controller     │         │     Service     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Booking System  │
                            │  (Status Check)  │
                            └──────────────────┘
```

### Component Layers

**Presentation Layer (Frontend)**
- `LicenseUpload` component: File selection and upload UI
- `AddGarage` page: Updated registration form with license upload
- `AdminVerification` page: Admin interface for reviewing licenses
- `GarageOwnerDashboard`: Status notifications and re-upload interface

**Application Layer (Backend)**
- `garageController`: Updated registration and license management endpoints
- `adminController`: License verification endpoints
- `uploadMiddleware`: Multer configuration for file handling
- `verificationMiddleware`: Status checking for booking operations

**Business Logic Layer**
- `licenseValidationService`: File type, size, and content validation
- `licenseStorageService`: Secure file storage and retrieval
- `verificationService`: Status management and workflow logic
- `notificationService`: Status change notifications

**Data Layer**
- `Garage` model: Extended with license and verification fields
- File system: Secure storage directory for license documents


## Components and Interfaces

### Backend Components

#### 1. Upload Middleware (`uploadMiddleware.js`)

**Purpose**: Handle multipart/form-data file uploads using multer

**Configuration**:
```javascript
{
  storage: diskStorage({
    destination: 'backend/uploads/licenses/',
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    
    if (allowedTypes.includes(file.mimetype) && 
        allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG formats are accepted'), false);
    }
  }
}
```

**Security Features**:
- Filename sanitization using UUID + timestamp
- MIME type validation
- File extension validation
- Size limit enforcement
- Storage outside public directory

#### 2. License Validation Service (`licenseValidationService.js`)

**Purpose**: Validate uploaded license files

**Methods**:
- `validateFileType(file)`: Verify MIME type matches extension
- `validateFileSize(file)`: Ensure file is under 5MB
- `sanitizeFilename(filename)`: Remove special characters and path traversal sequences
- `scanForMaliciousContent(file)`: Basic executable content detection

**Validation Rules**:
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`
- Maximum size: 5MB (5,242,880 bytes)
- Filename must not contain: `..`, `/`, `\`, null bytes

#### 3. License Storage Service (`licenseStorageService.js`)

**Purpose**: Manage secure storage and retrieval of license documents

**Methods**:
- `storeLicense(file, garageId)`: Save file and return metadata
- `retrieveLicense(garageId)`: Get license file path
- `deleteLicense(garageId)`: Remove old license file
- `replaceLicense(file, garageId)`: Replace existing license

**Storage Structure**:
```
backend/uploads/licenses/
  ├── {uuid}-{timestamp}.pdf
  ├── {uuid}-{timestamp}.jpg
  └── {uuid}-{timestamp}.png
```

**Metadata Stored in Database**:
```javascript
{
  path: 'uploads/licenses/{uuid}-{timestamp}.ext',
  originalFilename: 'business-license.pdf',
  size: 1234567,
  mimeType: 'application/pdf',
  uploadedAt: Date
}
```

#### 4. Verification Service (`verificationService.js`)

**Purpose**: Manage verification status workflow

**Methods**:
- `setPending(garageId)`: Set status to "pending"
- `approve(garageId, adminId)`: Approve license and enable garage
- `reject(garageId, adminId, reason)`: Reject license with reason
- `canReceiveBookings(garageId)`: Check if garage can accept bookings
- `getVerificationStatus(garageId)`: Get current status

**Status Transitions**:
```
Registration → Pending Verification
Pending Verification → Approved (admin action)
Pending Verification → Rejected (admin action)
Rejected → Pending Verification (re-upload)
```

**Business Rules**:
- Only "Approved" garages can receive bookings
- Only "Approved" garages appear in search results
- Status changes trigger notifications
- All transitions are logged with admin ID and timestamp


### Frontend Components

#### 1. LicenseUpload Component

**Purpose**: Reusable file upload component with drag-and-drop

**Props**:
```typescript
interface LicenseUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  error?: string;
  disabled?: boolean;
}
```

**Features**:
- Drag-and-drop file selection
- Click to browse file selection
- File preview for images (JPG, PNG)
- File name and size display
- Clear validation error messages
- Remove file button
- Accepted formats display (PDF, JPG, PNG)
- Size limit display (5MB)

**UI States**:
- Empty: Shows upload prompt
- File selected: Shows file info and preview
- Error: Shows error message
- Uploading: Shows progress indicator
- Disabled: Grayed out during submission

#### 2. Updated AddGarage Page

**Purpose**: Integrate license upload into garage registration

**Changes**:
- Add `LicenseUpload` component to form
- Update form validation to require license
- Handle multipart/form-data submission
- Display success message with verification notice
- Show error messages for upload failures

**Form Submission**:
```typescript
const formData = new FormData();
formData.append('name', garageData.name);
formData.append('location', JSON.stringify(garageData.location));
formData.append('capacity', garageData.capacity);
formData.append('pricePerHour', garageData.pricePerHour);
formData.append('license', licenseFile); // File object

await api.post('/garages', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

#### 3. AdminVerification Page

**Purpose**: Admin interface for reviewing and verifying licenses

**Features**:
- List of pending garages with filters
- Garage details display
- License document viewer (PDF/image)
- Approve button
- Reject button with reason input
- Download license button
- Verification history log

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Pending License Verifications                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ Pending List    │  │  License Viewer              │ │
│  │                 │  │                              │ │
│  │ • Garage A      │  │  [PDF/Image Display]         │ │
│  │ • Garage B      │  │                              │ │
│  │ • Garage C      │  │  Garage Details:             │ │
│  │                 │  │  - Name: ...                 │ │
│  │                 │  │  - Owner: ...                │ │
│  │                 │  │  - Registered: ...           │ │
│  │                 │  │                              │ │
│  │                 │  │  [Approve] [Reject] [Download]│ │
│  └─────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 4. GarageOwnerDashboard Updates

**Purpose**: Display verification status and enable re-upload

**Status Notifications**:
- **Pending**: "Your garage is pending license verification. You cannot receive bookings until approved."
- **Approved**: "Your garage is verified and active!"
- **Rejected**: "Your license was rejected. Reason: [reason]. Please upload a new license."

**Re-upload Interface** (for rejected status):
- Display rejection reason prominently
- Show `LicenseUpload` component
- Submit button to resubmit
- Clear instructions on what to fix


## Data Models

### Garage Model Updates

**New Fields**:

```javascript
{
  // Existing fields...
  
  // License Document Information
  licenseDocument: {
    path: {
      type: String,
      required: false, // Optional for backward compatibility with existing garages
    },
    originalFilename: {
      type: String,
    },
    size: {
      type: Number, // in bytes
    },
    mimeType: {
      type: String,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true,
    index: true, // For efficient queries
  },
  
  // Verification Metadata
  verificationDate: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: {
    type: String,
    maxlength: 500,
  },
  
  // Verification History (for audit trail)
  verificationHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: String, // For rejections
  }],
}
```

**Updated Indexes**:
```javascript
garageSchema.index({ verificationStatus: 1, createdAt: -1 }); // For admin pending list
garageSchema.index({ owner: 1, verificationStatus: 1 }); // For owner's garage list
```

**Virtual Fields**:
```javascript
garageSchema.virtual('isOperational').get(function() {
  return this.verificationStatus === 'approved';
});

garageSchema.virtual('canReceiveBookings').get(function() {
  return this.verificationStatus === 'approved' && this.isActive;
});
```

**Model Methods**:
```javascript
// Instance method to check if garage can be booked
garageSchema.methods.canAcceptBooking = function() {
  return this.verificationStatus === 'approved' && 
         this.isActive && 
         this.availableSlots > 0;
};

// Static method to get pending garages for admin
garageSchema.statics.getPendingVerifications = function() {
  return this.find({ verificationStatus: 'pending' })
    .populate('owner', 'name email phone')
    .sort({ createdAt: 1 });
};

// Instance method to add verification history entry
garageSchema.methods.addVerificationHistory = function(status, adminId, reason = null) {
  this.verificationHistory.push({
    status,
    changedBy: adminId,
    changedAt: new Date(),
    reason,
  });
};
```

### Migration Strategy for Existing Garages

**Approach**: Soft migration with grace period

**Migration Script** (`migrateExistingGarages.js`):
```javascript
// Set all existing garages to 'pending' status
await Garage.updateMany(
  { verificationStatus: { $exists: false } },
  { 
    $set: { 
      verificationStatus: 'pending',
      licenseDocument: null,
    }
  }
);
```

**Runtime Handling**:
- Existing garages without licenses see prominent upload prompt
- They can manage current bookings but cannot receive new ones
- Search results exclude unverified garages
- Dashboard shows clear instructions to upload license


## API Endpoints

### Garage Registration and License Management

#### POST /api/garages
**Purpose**: Register new garage with license upload

**Authentication**: Required (garage_owner role)

**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  name: string,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: string
  },
  capacity: number,
  pricePerHour: number,
  amenities: string[],
  description: string,
  license: File // multipart file upload
}
```

**Response** (201 Created):
```javascript
{
  success: true,
  message: 'Registration submitted successfully. Your license is pending admin verification.',
  data: {
    _id: string,
    name: string,
    verificationStatus: 'pending',
    licenseDocument: {
      originalFilename: string,
      uploadedAt: Date
    },
    // ... other garage fields
  }
}
```

**Error Responses**:
- 400: Missing license file, invalid file type, file too large
- 401: Unauthorized
- 500: Server error

#### POST /api/garages/:id/license
**Purpose**: Re-upload license after rejection

**Authentication**: Required (garage_owner, must own garage)

**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  license: File
}
```

**Response** (200 OK):
```javascript
{
  success: true,
  message: 'License resubmitted for verification',
  data: {
    verificationStatus: 'pending',
    licenseDocument: {
      originalFilename: string,
      uploadedAt: Date
    }
  }
}
```

#### GET /api/garages/:id/license
**Purpose**: Download license document

**Authentication**: Required (admin or garage owner)

**Response**: File stream with appropriate Content-Type

**Headers**:
```
Content-Type: application/pdf | image/jpeg | image/png
Content-Disposition: attachment; filename="license-{garageId}.ext"
```

### Admin Verification Endpoints

#### GET /api/admin/garages/pending
**Purpose**: Get list of garages pending verification

**Authentication**: Required (admin role)

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `sortBy`: 'createdAt' | 'name' (default: 'createdAt')
- `order`: 'asc' | 'desc' (default: 'asc')

**Response** (200 OK):
```javascript
{
  success: true,
  count: number,
  page: number,
  totalPages: number,
  data: [
    {
      _id: string,
      name: string,
      owner: {
        _id: string,
        name: string,
        email: string,
        phone: string
      },
      location: {
        address: string
      },
      licenseDocument: {
        originalFilename: string,
        size: number,
        uploadedAt: Date
      },
      createdAt: Date
    }
  ]
}
```

#### PATCH /api/admin/garages/:id/verify
**Purpose**: Approve garage license

**Authentication**: Required (admin role)

**Request Body**:
```javascript
{
  action: 'approve'
}
```

**Response** (200 OK):
```javascript
{
  success: true,
  message: 'License approved successfully',
  data: {
    _id: string,
    verificationStatus: 'approved',
    verificationDate: Date,
    verifiedBy: string
  }
}
```

#### PATCH /api/admin/garages/:id/reject
**Purpose**: Reject garage license

**Authentication**: Required (admin role)

**Request Body**:
```javascript
{
  action: 'reject',
  reason: string // required, max 500 characters
}
```

**Response** (200 OK):
```javascript
{
  success: true,
  message: 'License rejected',
  data: {
    _id: string,
    verificationStatus: 'rejected',
    rejectionReason: string,
    verificationDate: Date,
    verifiedBy: string
  }
}
```

**Error Responses**:
- 400: Missing reason, invalid action
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Garage not found
- 500: Server error

### Updated Search Endpoint

#### POST /api/garages/search
**Purpose**: Search garages (updated to filter by verification status)

**Authentication**: Optional

**Request Body**:
```javascript
{
  lat: number,
  lng: number,
  radius: number,
  vehicleType: string,
  date: string,
  time: string
}
```

**Updated Query Logic**:
```javascript
const query = {
  location: { $near: { /* ... */ } },
  availableSlots: { $gt: 0 },
  verificationStatus: 'approved', // NEW: Only show approved garages
  isActive: true
};
```

**Response**: Same as before, but only includes approved garages

