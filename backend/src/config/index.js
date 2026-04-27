// src/config/index.js – Configuration loader (safe, no process.exit)
import dotenv from 'dotenv';
import connectDB from './db.js';

// Load .env in development only
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env' });
}

// Environment config object
const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Simple validation – warn only, never crash
console.log('┌──────────────────────────────┐');
console.log('│   Environment validation     │');
console.log('└──────────────────────────────┘');

Object.entries(config).forEach(([key, value]) => {
    if (!value && key !== 'PORT') {
        console.warn(`⚠️ Missing recommended env: ${key}`);
    } else {
        const display = key === 'JWT_SECRET' ? 'loaded (hidden)' : value ? 'present' : 'MISSING';
        console.log(`  ${key.padEnd(12)} : ${display}`);
    }
});

console.log('Environment validation done.');

export { connectDB, config };
export default { connectDB, config };