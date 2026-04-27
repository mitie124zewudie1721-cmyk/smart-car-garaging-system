// src/models/Reservation.js
import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true, // faster queries by user
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garage',
        required: [true, 'Garage is required'],
        index: true,
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required'],
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required'],
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'],
        default: 'pending',
        index: true, // frequent filtering by status
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Price cannot be negative'],
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
        index: true,
    },
    // Deposit (advance payment to protect garage owner)
    depositAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    depositPaid: {
        type: Boolean,
        default: false,
    },
    depositPaidAt: { type: Date },
    depositRefunded: {
        type: Boolean,
        default: false,
    },
    depositRefundedAt: { type: Date },
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
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        trim: true,
    },
    // ── Price Adjustment (mechanic found extra work) ──────────────────────────
    // Garage owner can propose a higher price after inspection
    adjustedPrice: { type: Number, default: null },
    adjustedPriceReason: { type: String, maxlength: 500, trim: true },
    adjustedPriceStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: null,
    },
    adjustedPriceAt: { type: Date },
    adjustedPriceRespondedAt: { type: Date },
    // ── Arrival tracking ──────────────────────────
    // Deadline by which customer must arrive (set when booking is confirmed)
    arrivalDeadline: { type: Date },
    // Garage owner marks customer as arrived
    arrivedAt: { type: Date },
    // true = arrived on time, false = arrived late, null = not yet arrived
    arrivedOnTime: { type: Boolean, default: null },
    // When late: deposit is forfeited, customer owes full price
    depositForfeited: { type: Boolean, default: false },
    depositForfeitedAt: { type: Date },
    // Auto no-show was triggered by scheduler
    autoNoShow: { type: Boolean, default: false },
}, {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: {
        virtuals: true, transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true },
});

// ────────────────────────────────────────────────
// Pre-save validation: endTime > startTime
// ────────────────────────────────────────────────
reservationSchema.pre('save', function (next) {
    if (this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }
    next();
});

// ────────────────────────────────────────────────
// Indexes for performance
// ────────────────────────────────────────────────
reservationSchema.index({ user: 1, status: 1, createdAt: -1 }); // for /my reservations
reservationSchema.index({ garage: 1, startTime: 1, endTime: 1 }); // prevent overlapping bookings
reservationSchema.index({ status: 1, paymentStatus: 1 }); // for admin/garage owner dashboards

// ────────────────────────────────────────────────
// Virtuals (optional – nice for frontend)
// ────────────────────────────────────────────────
reservationSchema.virtual('durationHours').get(function () {
    if (!this.startTime || !this.endTime) return 0;
    const diffMs = this.endTime - this.startTime;
    return Math.round(diffMs / (1000 * 60 * 60));
});

reservationSchema.virtual('isActive').get(function () {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now && this.status === 'active';
});

// Export model
export default mongoose.model('Reservation', reservationSchema);