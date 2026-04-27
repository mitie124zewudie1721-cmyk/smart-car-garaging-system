// src/models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: false,  // optional — registration fee payments have no reservation
        index: true,
        sparse: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true,
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garage',
        required: false, // Temporarily make optional
        index: true,
    },
    // Payment Amount Details
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    currency: {
        type: String,
        default: 'ETB',
        enum: ['ETB', 'USD'],
    },
    serviceFee: {
        type: Number,
        default: 0,
        min: [0, 'Service fee cannot be negative'],
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative'],
    },
    totalAmount: {
        type: Number,
        min: [0, 'Total amount cannot be negative'],
    },
    // ────────────────────────────────────────────────
    // Commission / Platform fee fields
    // ────────────────────────────────────────────────
    commissionRate: {               // percentage (0.1 for 10%)
        type: Number,
        default: 0,
        min: [0, 'Commission rate cannot be negative'],
    },
    commissionAmount: {             // calculated absolute amount
        type: Number,
        default: 0,
        min: [0, 'Commission cannot be negative'],
    },
    garageEarnings: {               // amount left for garage after commission
        type: Number,
        default: 0,
        min: [0, 'Earnings cannot be negative'],
    },
    commissionPaid: {               // has admin marked this commission as paid to platform?
        type: Boolean,
        default: false,
    },
    commissionPaidAt: {
        type: Date,
    },
    payoutSent: {                   // has admin sent earnings payout to garage owner?
        type: Boolean,
        default: false,
    },
    payoutSentAt: {
        type: Date,
    },

    // Transaction Details
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    externalTransactionId: {
        type: String, // ID from payment gateway (Chapa, Telebirr, etc.)
        sparse: true,
    },
    paymentMethod: {
        type: String,
        enum: [
            'cash',                    // Cash payment at garage
            'telebirr',                // Telebirr mobile money
            'cbe_birr',                // CBE Birr (Commercial Bank of Ethiopia)
            'bank_transfer_cbe',       // Bank Transfer - Commercial Bank of Ethiopia
            'bank_transfer_abyssinia', // Bank Transfer - Bank of Abyssinia
        ],
        required: [true, 'Payment method is required'],
    },
    paymentProvider: {
        type: String,
        enum: ['chapa', 'telebirr', 'stripe', 'paypal', 'manual'],
        default: 'manual',
    },

    // Payment Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        index: true,
    },
    paymentDate: {
        type: Date,
    },

    // Customer Information
    customerInfo: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
    },

    // Payment Gateway Response
    gatewayResponse: {
        checkoutUrl: String,
        reference: String,
        status: String,
        message: String,
        rawResponse: mongoose.Schema.Types.Mixed,
    },

    // Refund Information
    refund: {
        amount: Number,
        reason: String,
        refundedAt: Date,
        refundTransactionId: String,
    },

    // Additional Details
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // Chapa reference (returned after payment verification)
    chapaRef: {
        type: String,
        sparse: true,
    },

    // Verification
    isVerified: {
        type: Boolean,
        default: false,
    },
    verifiedAt: {
        type: Date,
    },

    // ── Escrow / Deposit hold ──────────────────────────
    // Deposit is held in platform escrow until garage owner accepts
    escrowStatus: {
        type: String,
        enum: ['held', 'released', 'refunded', 'refund_pending'],
        default: null,
        index: true,
    },
    escrowReleasedAt: { type: Date },   // when released to garage wallet
    escrowRefundedAt: { type: Date },   // when refunded to car owner
    escrowRefundReason: { type: String },
    escrowAutoRefundAt: { type: Date }, // deadline for auto-refund if not accepted

    // Failure Details
    failureReason: {
        type: String,
        maxlength: [500, 'Failure reason cannot exceed 500 characters'],
    },
    failureCode: {
        type: String,
    },

    // Retry Information
    retryCount: {
        type: Number,
        default: 0,
    },
    lastRetryAt: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true },
});

// Indexes for performance
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ garage: 1, status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for payment age
paymentSchema.virtual('paymentAge').get(function () {
    if (!this.paymentDate) return null;
    const now = new Date();
    const diffMs = now - this.paymentDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
});

// Pre-save hook to calculate total amount and populate garage from reservation
paymentSchema.pre('save', async function (next) {
    // Calculate total amount
    if (this.isModified('amount') || this.isModified('serviceFee') || this.isModified('tax')) {
        this.totalAmount = this.amount + this.serviceFee + this.tax;
    }

    // Auto-populate garage from reservation if missing
    if (!this.garage && this.reservation) {
        try {
            const Reservation = this.model('Reservation');
            const reservation = await Reservation.findById(this.reservation).select('garage');
            if (reservation && reservation.garage) {
                this.garage = reservation.garage;
                console.log('✅ Auto-populated garage from reservation:', this.garage);
            }
        } catch (error) {
            console.error('❌ Failed to auto-populate garage:', error.message);
        }
    }

    next();
});

export default mongoose.model('Payment', paymentSchema);