// src/models/Garage.js
import mongoose from 'mongoose';

const garageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Garage name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Garage owner is required'],
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Location coordinates are required'],
            validate: {
                validator: function (val) {
                    return val.length === 2 &&
                        val[0] >= -180 && val[0] <= 180 &&   // longitude
                        val[1] >= -90 && val[1] <= 90;      // latitude
                },
                message: 'Invalid coordinates: longitude must be -180 to 180, latitude -90 to 90',
            },
        },
        address: {
            type: String,
            trim: true,
            maxlength: [200, 'Address cannot exceed 200 characters'],
        },
    },
    amenities: [{
        type: String,
        trim: true,
        // Predefined values + custom strings allowed
    }],
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1'],
    },
    availableSlots: {
        type: Number,
        default: function () {
            return this.capacity;
        },
        min: [0, 'Available slots cannot be negative'],
    },
    pricePerHour: {
        type: Number,
        required: [true, 'Hourly price is required'],
        min: [0, 'Price cannot be negative'],
    },
    operatingHours: {
        // Legacy single schedule (kept for backward compat)
        start: {
            type: String,
            match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:mm)'],
        },
        end: {
            type: String,
            match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:mm)'],
        },
        // Per-day schedule
        weekly: {
            monday: { open: Boolean, start: String, end: String },
            tuesday: { open: Boolean, start: String, end: String },
            wednesday: { open: Boolean, start: String, end: String },
            thursday: { open: Boolean, start: String, end: String },
            friday: { open: Boolean, start: String, end: String },
            saturday: { open: Boolean, start: String, end: String },
            sunday: { open: Boolean, start: String, end: String },
        },
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: [{
        type: String,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: props => `${props.value} is not a valid image URL`,
        },
    }],

    // ────────────────────────────────────────────────
    // Contact Information
    // ────────────────────────────────────────────────
    contact: {
        phone: {
            type: String,
            trim: true,
            match: [/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'],
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
    },

    // ────────────────────────────────────────────────
    // Services Offered (Dynamic List)
    // ────────────────────────────────────────────────
    services: [{
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        duration: {
            type: Number, // in minutes
            min: 0,
        },
        description: {
            type: String,
            maxlength: 200,
        },
        // Sub-options for services that have variants (e.g. oil types for oil change)
        subOptions: [{
            name: { type: String, trim: true },   // e.g. "Synthetic Oil", "Mineral Oil"
            price: { type: Number, min: 0 },       // price for this variant
            description: { type: String, maxlength: 100 },
        }],
    }],

    // ────────────────────────────────────────────────
    // Payment Methods Accepted
    // ────────────────────────────────────────────────
    paymentMethods: [{
        type: String,
        enum: ['cash', 'telebirr', 'cbe_birr', 'abyssinia_bank', 'chapa', 'm_pesa'],
    }],

    // ────────────────────────────────────────────────
    // Bank Account Details
    // ────────────────────────────────────────────────
    bankAccounts: {
        cbe: {
            accountNumber: String,
            accountName: String,
            branch: String,
        },
        abyssinia: {
            accountNumber: String,
            accountName: String,
            branch: String,
        },
        telebirr: {
            phoneNumber: String,
            accountNumber: String,
            accountName: String,
        },
    },
    rating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

    // ────────────────────────────────────────────────
    // License Document Information
    // ────────────────────────────────────────────────
    licenseNumber: {
        type: String,
        trim: true,
        maxlength: [100, 'License number too long'],
    },
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

    // ────────────────────────────────────────────────
    // Verification Status
    // ────────────────────────────────────────────────
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true,
        index: true, // For efficient queries
    },


    // ────────────────────────────────────────────────
    // Commercial / platform fee settings
    // ────────────────────────────────────────────────
    commissionRate: {             // percentage charged by platform (e.g. 0.1 for 10%)
        type: Number,
        default: function () {
            return parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0');
        },
        min: [0, 'Commission rate cannot be negative'],
    },
    depositPercent: {             // % of total price required as deposit (e.g. 30 for 30%)
        type: Number,
        default: 30,
        min: [0, 'Deposit percent cannot be negative'],
        max: [100, 'Deposit percent cannot exceed 100'],
    },
    arrivalLimitMinutes: {        // grace period after startTime before booking becomes no_show
        type: Number,
        default: 15,
        min: [0, 'Arrival limit cannot be negative'],
        max: [120, 'Arrival limit cannot exceed 120 minutes'],
    },

    // ────────────────────────────────────────────────
    // Penalty tracking (late commission payment)
    // ────────────────────────────────────────────────
    penalty: {
        applied: { type: Boolean, default: false },
        totalAmount: { type: Number, default: 0 },   // total ETB penalty
        daysOverdue: { type: Number, default: 0 },
        appliedAt: { type: Date },
        lastUpdatedAt: { type: Date },
        appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        month: { type: Number },
        year: { type: Number },
        reason: { type: String, maxlength: 500 },
        waived: { type: Boolean, default: false },
        waivedAt: { type: Date },
        waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // Simple 3-part breakdown
        breakdown: {
            base: { type: Number, default: 0 }, // flat % of commission
            adjustment: { type: Number, default: 0 }, // extra % for large commissions
            daily: { type: Number, default: 0 }, // daily accrual
        },

        // Audit history
        history: [{
            event: { type: String, enum: ['applied', 'updated', 'waived', 'paid'] },
            amount: Number,
            daysOverdue: Number,
            note: String,
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now },
        }],
    },

    // ────────────────────────────────────────────────
    // Verification Metadata
    // ────────────────────────────────────────────────
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

    // ────────────────────────────────────────────────
    // Verification History (for audit trail)
    // ────────────────────────────────────────────────
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
    // Soft delete
    deletedAt: { type: Date, default: null },
    // Needs admin re-review after edit
    needsReview: { type: Boolean, default: false },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ────────────────────────────────────────────────
// Indexes for performance & geospatial queries
// ────────────────────────────────────────────────
garageSchema.index({ location: '2dsphere' });              // for $near / $geoNear queries
garageSchema.index({ owner: 1, createdAt: -1 });           // for owner-specific lists
garageSchema.index({ name: 'text', description: 'text' }); // for text search
garageSchema.index({ verificationStatus: 1, createdAt: -1 }); // for admin pending list
garageSchema.index({ owner: 1, verificationStatus: 1 });   // for owner's garage list

// ────────────────────────────────────────────────
// Virtual Fields
// ────────────────────────────────────────────────
// Optional virtual for easier frontend use (e.g. distance)
garageSchema.virtual('distance').get(function () {
    // Can be populated from controller if needed
    return this._distance || null;
});

// Check if garage is operational (approved and active)
garageSchema.virtual('isOperational').get(function () {
    return this.verificationStatus === 'approved' && this.isActive;
});

// Check if garage can receive bookings
garageSchema.virtual('canReceiveBookings').get(function () {
    return this.verificationStatus === 'approved' && this.isActive && this.availableSlots > 0;
});

// ────────────────────────────────────────────────
// Instance Methods
// ────────────────────────────────────────────────
// Check if garage can accept a booking
garageSchema.methods.canAcceptBooking = function () {
    return this.verificationStatus === 'approved' &&
        this.isActive &&
        this.availableSlots > 0;
};

// Add verification history entry
garageSchema.methods.addVerificationHistory = function (status, adminId, reason = null) {
    this.verificationHistory.push({
        status,
        changedBy: adminId,
        changedAt: new Date(),
        reason,
    });
};

// ────────────────────────────────────────────────
// Static Methods
// ────────────────────────────────────────────────
// Get pending garages for admin
garageSchema.statics.getPendingVerifications = function () {
    return this.find({ verificationStatus: 'pending' })
        .populate('owner', 'name email phone username')
        .sort({ createdAt: 1 }); // Oldest first
};

// Cap availableSlots to never exceed capacity before saving
garageSchema.pre('save', function (next) {
    if (this.availableSlots > this.capacity) {
        this.availableSlots = this.capacity;
    }
    if (this.availableSlots < 0) {
        this.availableSlots = 0;
    }
    next();
});

// Export model
export default mongoose.model('Garage', garageSchema);