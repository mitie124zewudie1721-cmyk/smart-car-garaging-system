// src/models/Withdrawal.js
import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    garageOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'ETB' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
        default: 'pending',
        index: true,
    },
    // Bank details provided by garage owner
    bankDetails: {
        bankName: String,       // 'CBE' | 'Abyssinia' | 'Telebirr'
        bankCode: String,       // Chapa bank code
        accountNumber: String,
        accountName: String,
        phoneNumber: String,    // for Telebirr
    },
    // Admin action
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String,
    // Chapa transfer result
    chapaTransferId: String,
    chapaReference: String,
    completedAt: Date,
    notes: String,
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model('Withdrawal', withdrawalSchema);
