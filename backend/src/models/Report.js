// src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['receipt', 'garage_monthly', 'system_analytics'],
        required: [true, 'Report type is required'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garage',
    },
    periodStart: Date,
    periodEnd: Date,
    fileUrl: {
        type: String,
        required: [true, 'Report file URL is required'],
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // JSON summary
    },
}, {
    timestamps: true,
});

export default mongoose.model('Report', reportSchema);