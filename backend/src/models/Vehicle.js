// src/models/Vehicle.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    plateNumber: {
        type: String,
        required: true,
        uppercase: true,
        unique: true,
    },
    make: String,
    model: String,
    year: {
        type: Number,
        min: 1980,
        max: new Date().getFullYear() + 1,
    },
    type: {
        type: String,
        required: true,
        // Allow predefined types or custom types
        validate: {
            validator: function (v) {
                // Allow any non-empty string
                return v && v.trim().length > 0;
            },
            message: 'Vehicle type is required'
        }
    },
    sizeCategory: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra_large'],
        required: true,
    },
    color: String,
    image: {
        url: { type: String }, // data URL for base64
        data: { type: String }, // base64 encoded image data
        originalFilename: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
    },
}, {
    timestamps: true,
});

export default mongoose.model('Vehicle', vehicleSchema);