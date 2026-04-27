// src/config/env.js
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.string().default('development'),
    MONGO_URI: z.string(),          // ← changed to MONGO_URI
    JWT_SECRET: z.string(),
    // ... other vars
});

const parsedEnv = envSchema.parse(process.env);

export default {
    PORT: parsedEnv.PORT,
    NODE_ENV: parsedEnv.NODE_ENV,
    MONGO_URI: parsedEnv.MONGO_URI,   // ← use this in mongoose.connect
    JWT_SECRET: parsedEnv.JWT_SECRET,
};