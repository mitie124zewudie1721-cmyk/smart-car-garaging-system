// src/models/Location.js
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: [true, 'Reservation is required'],
    },
    coordinates: {
        type: [Number], // [lng, lat]
        required: [true, 'Coordinates are required'],
        validate: {
            validator: val => val.length === 2 &&
                val[0] >= -180 && val[0] <= 180 &&
                val[1] >= -90 && val[1] <= 90,
            message: 'Invalid coordinates',
        },
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    accuracy: {
        type: Number,
        min: 0,
    },
}, {
    timestamps: true,
});

// Index for fast queries by reservation and time
locationSchema.index({ reservation: 1, timestamp: -1 });

export default mongoose.model('Location', locationSchema);