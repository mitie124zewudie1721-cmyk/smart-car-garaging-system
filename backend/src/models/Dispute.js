// src/models/Dispute.js
import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: [true, 'Reservation is required'],
        index: true,
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
        required: [true, 'Garage is required'],
        index: true,
    },
    type: {
        type: String,
        enum: ['complaint', 'cancellation_request', 'refund_request', 'quality_issue', 'other'],
        required: [true, 'Dispute type is required'],
        index: true,
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        maxlength: [200, 'Reason cannot exceed 200 characters'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'rejected', 'closed'],
        default: 'pending',
        index: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    resolutionNote: {
        type: String,
        maxlength: [1000, 'Resolution note cannot exceed 1000 characters'],
        trim: true,
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolvedAt: {
        type: Date,
    },
    adminAction: {
        type: String,
        enum: ['none', 'approved', 'rejected', 'warning_issued', 'refund_issued', 'account_suspended', 'user_blocked'],
        default: 'none',
    },
    adminNote: {
        type: String,
        maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
        trim: true,
    },
    refundAmount: {
        type: Number,
        min: [0, 'Refund amount cannot be negative'],
    },
    actionHistory: [{
        action: {
            type: String,
            required: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        note: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],
    evidenceUrls: [{
        type: String,
        trim: true,
    }],
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
disputeSchema.index({ user: 1, status: 1, createdAt: -1 });
disputeSchema.index({ garage: 1, status: 1, createdAt: -1 });
disputeSchema.index({ reservation: 1 });

export default mongoose.model('Dispute', disputeSchema);
