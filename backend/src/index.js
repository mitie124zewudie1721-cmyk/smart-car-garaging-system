// src/index.js – Server starter (minimal – just listen)
// UPDATED: Force module reload
import 'dotenv/config';

console.log('🔄 INDEX.JS LOADING - TIMESTAMP:', new Date().toISOString());

let app;
let mongoose;

try {
    const appModule = await import('./app.js');
    app = appModule.default;
    const mongooseModule = await import('mongoose');
    mongoose = mongooseModule.default;
    console.log('✅ App and dependencies loaded successfully');
} catch (error) {
    console.error('❌ FATAL: Failed to load app or dependencies:', error);
    process.exit(1);
}

// Connect to MongoDB (non-blocking)
console.log('Connecting to MongoDB Atlas...');

if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(async () => {
            console.log('MongoDB connected successfully');
            try {
                const schedulerModule = await import('./services/garageSchedulerService.js');
                const startGarageScheduler = schedulerModule.startGarageScheduler || schedulerModule.default;
                startGarageScheduler();
            } catch (err) {
                console.error('Scheduler failed to start:', err.message);
            }
        })
        .catch(err => console.error('MongoDB connection FAILED (server continues):', err.message));
} else {
    console.error('CRITICAL: MONGO_URI missing in .env');
}

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Test endpoints:`);
    console.log(`  → http://localhost:${PORT}/health`);
    console.log(`  → http://localhost:${PORT}/api/auth/login (POST)`);
    console.log('Backend is ready');
});

// Prevent silent crashes
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});