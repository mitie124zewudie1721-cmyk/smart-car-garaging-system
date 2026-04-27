// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },

        // Username = primary unique identifier (required for login)
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [3, 'Username must be at least 3 characters'],
        },

        // Email field (optional, used for email notifications)
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true, // allows multiple null values, but unique if provided
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // never return password in queries
        },

        phone: {
            type: String,
            trim: true,
            match: [/^\+?\d{9,15}$/, 'Invalid phone number format (e.g. +251912345678)'],
        },

        carType: {
            type: String,
            trim: true,
            // optional – can be empty for garage_owner or admin
        },

        role: {
            type: String,
            enum: ['car_owner', 'garage_owner', 'admin'],
            default: 'car_owner',
        },

        profilePicture: {
            type: String,
            default: 'default-avatar.png',
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
        },
        loginAttempts: { type: Number, default: 0 },
        lastFailedLogin: { type: Date },
        lockUntil: { type: Date },

        // Password reset
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: { type: Date, select: false },

        // Optional reference to Vehicle model (if car_owner)
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
        },
        // Soft delete
        deletedAt: { type: Date, default: null },
        // Registration fee (for garage owners)
        registrationFeePaid: { type: Boolean, default: false },
        registrationFeePaidAt: { type: Date },
        // Agreement acceptance
        agreementAccepted: { type: Boolean, default: false },
        agreementAcceptedAt: { type: Date },
        agreementVersion: { type: Number, default: 0 }, // version they accepted
        // Registration fee payment submission (pending admin approval)
        registrationFeeSubmission: {
            paymentMethod: { type: String },
            transactionRef: { type: String },
            chapaRef: { type: String },       // Chapa txRef for verification
            receiptPath: { type: String },
            submittedAt: { type: Date },
            status: { type: String, enum: ['pending', 'approved', 'rejected', 'chapa_pending'] },
            reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: { type: Date },
            rejectionReason: { type: String },
        },
        // ────────────────────────────────────────────────
        // Wallet (garage owners earn here automatically)
        // ────────────────────────────────────────────────
        wallet: {
            balance: { type: Number, default: 0, min: 0 },
            totalEarned: { type: Number, default: 0 },   // lifetime earnings credited
            totalWithdrawn: { type: Number, default: 0 }, // lifetime withdrawals
            transactions: [{
                type: { type: String, enum: ['credit', 'debit'], required: true },
                amount: { type: Number, required: true },
                description: { type: String },
                paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
                reservationRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
                balanceAfter: { type: Number },
                createdAt: { type: Date, default: Date.now },
            }],
        },
    },
    {
        timestamps: true,
    }
);

// Password hashing middleware – runs before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return resetToken; // return plain token (sent in email)
};

export default mongoose.model('User', userSchema);