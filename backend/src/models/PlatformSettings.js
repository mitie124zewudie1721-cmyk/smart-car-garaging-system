// src/models/PlatformSettings.js
import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    key: { type: String, required: true },       // 'cbe' | 'abyssinia' | 'telebirr'
    bank: { type: String, required: true },
    accountNo: { type: String, required: true },
    accountName: { type: String, required: true },
    branch: { type: String, default: '' },
    icon: { type: String, default: '🏦' },
    color: { type: String, default: '#1d4ed8' },
    bg: { type: String, default: '#eff6ff' },
    border: { type: String, default: '#bfdbfe' },
}, { _id: false });

const platformSettingsSchema = new mongoose.Schema({
    singleton: { type: String, default: 'main', unique: true },
    platformAccounts: { type: [accountSchema], default: [] },
    registrationFee: { type: Number, default: 500 },
    depositPercent: { type: Number, default: 20 }, // % of total price required as deposit
    // Terms & Agreement
    agreement: {
        content: { type: String, default: '' },
        version: { type: Number, default: 1 },
        updatedAt: { type: Date },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
}, { timestamps: true });

export default mongoose.model('PlatformSettings', platformSettingsSchema);
