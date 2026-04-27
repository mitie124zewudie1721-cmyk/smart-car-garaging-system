// src/config/db.js
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB Atlas with automatic reconnection and error handling
 * Uses modern options and graceful shutdown
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,  // 30s — Atlas can be slow on first connect
            socketTimeoutMS: 60000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 2,
            heartbeatFrequencyMS: 10000,
        });

        logger.info(`MongoDB connected successfully → ${mongoose.connection.host}`);

        // Log connection events for monitoring
        mongoose.connection.on('connected', () => {
            logger.info('MongoDB connection established');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error', { error: err.message });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected – attempting automatic reconnection...');
        });

        // Graceful shutdown (important for production / university demo)
        const gracefulShutdown = async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed due to app termination');
            process.exit(0);
        };

        process.on('SIGINT', gracefulShutdown);   // Ctrl+C
        process.on('SIGTERM', gracefulShutdown);  // Kill signal (e.g. PM2, Render)

    } catch (error) {
        logger.error('MongoDB initial connection failed', {
            message: error.message,
            stack: error.stack,
        });
        process.exit(1); // Exit with failure code
    }
};

export default connectDB;