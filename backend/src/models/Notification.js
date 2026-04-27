// src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
        index: true,
    },
    type: {
        type: String,
        enum: [
            'reservation_confirmed',
            'reservation_accepted',
            'reservation_rejected',
            'reservation_cancelled',
            'service_started',
            'service_completed',
            'dispute_created',
            'dispute_updated',
            'dispute_resolved',
            'feedback_received',
            'garage_approved',
            'garage_rejected',
            'garage_pending',
            'payment_received',
            'admin_action',
            'system_announcement',
        ],
        required: [true, 'Notification type is required'],
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters'],
        trim: true,
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters'],
        trim: true,
    },
    relatedModel: {
        type: String,
        enum: ['Reservation', 'Dispute', 'Garage', 'Feedback', 'Payment', 'User', null],
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: {
        type: String,
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
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
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

export default mongoose.model('Notification', notificationSchema);
