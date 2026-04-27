// src/models/ArchivedReservation.js
// Stores fully completed reservations (service done + payment confirmed + commission recorded)
// Original reservation is removed from active collection after successful archiving
import mongoose from 'mongoose';

const archivedReservationSchema = new mongoose.Schema({
    // Original reservation ID (for reference/lookup)
    originalId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // Core reservation data (snapshot at time of archiving)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    serviceType: { type: String, required: true },
    serviceDescription: { type: String },
    notes: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    // Financial snapshot
    totalPrice: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    paymentStatus: { type: String, default: 'paid' },
    paymentMethod: { type: String },

    // Commission snapshot
    commissionRate: { type: Number },          // e.g. 0.10 = 10%
    commissionAmount: { type: Number },        // ETB amount taken by platform
    garageEarnings: { type: Number },          // ETB amount credited to garage wallet

    // Payment reference
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    chapaRef: { type: String },

    // Timestamps
    reservationCreatedAt: { type: Date },      // when original reservation was created
    serviceCompletedAt: { type: Date },        // when garage owner marked complete
    paymentConfirmedAt: { type: Date },        // when payment was verified
    archivedAt: { type: Date, default: Date.now, index: true },

    // Garage slot restored
    slotRestored: { type: Boolean, default: false },
}, {
    timestamps: false,
    collection: 'archived_reservations',
});

archivedReservationSchema.index({ user: 1, archivedAt: -1 });
archivedReservationSchema.index({ garage: 1, archivedAt: -1 });

export default mongoose.model('ArchivedReservation', archivedReservationSchema);
