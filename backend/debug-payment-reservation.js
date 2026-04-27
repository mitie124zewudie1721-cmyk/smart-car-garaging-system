// Debug script to check reservation data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import Reservation from './src/models/Reservation.js';
import Garage from './src/models/Garage.js';
import User from './src/models/User.js';
import Vehicle from './src/models/Vehicle.js';

async function debugReservation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find a completed reservation
        const reservations = await Reservation.find({ status: 'completed' })
            .limit(5)
            .lean();

        console.log('\n📋 Found', reservations.length, 'completed reservations\n');

        for (const res of reservations) {
            console.log('─────────────────────────────────────');
            console.log('Reservation ID:', res._id);
            console.log('Status:', res.status);
            console.log('Service Type:', res.serviceType);
            console.log('User ID:', res.user);
            console.log('Garage ID:', res.garage);
            console.log('Garage Type:', typeof res.garage);
            console.log('Vehicle ID:', res.vehicle);
            console.log('Total Price:', res.totalPrice);
            console.log('Payment Status:', res.paymentStatus);

            // Try to populate
            const populated = await Reservation.findById(res._id)
                .populate('garage')
                .populate('user')
                .populate('vehicle');

            console.log('\n🔍 After populate:');
            console.log('Garage:', populated.garage);
            console.log('Garage Type:', typeof populated.garage);
            console.log('Has _id?', !!populated.garage?._id);
            console.log('Garage._id:', populated.garage?._id);
            console.log('Garage.name:', populated.garage?.name);
            console.log('');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

debugReservation();
