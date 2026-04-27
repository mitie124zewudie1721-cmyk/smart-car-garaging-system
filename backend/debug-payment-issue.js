// Debug script to check reservation and payment data
import mongoose from 'mongoose';
import 'dotenv/config';
import Reservation from './src/models/Reservation.js';
import Payment from './src/models/Payment.js';
import Garage from './src/models/Garage.js';

async function debugPaymentIssue() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get the latest reservation
        const reservation = await Reservation.findOne().populate('garage').sort({ createdAt: -1 });

        if (!reservation) {
            console.log('❌ No reservations found');
            return;
        }

        console.log('📋 Latest Reservation:');
        console.log('- ID:', reservation._id);
        console.log('- User:', reservation.user);
        console.log('- Garage (raw):', reservation.garage);
        console.log('- Garage populated?:', !!reservation.garage);

        if (reservation.garage) {
            console.log('- Garage ID:', reservation.garage._id || reservation.garage);
            console.log('- Garage Name:', reservation.garage.name || 'Not populated');
        }

        // Try to create a test payment
        console.log('\n🧪 Testing Payment Creation:');

        const garageId = reservation.garage._id || reservation.garage;
        console.log('- Using garage ID:', garageId);

        const testPayment = {
            reservation: reservation._id,
            user: reservation.user,
            garage: garageId,
            amount: 100,
            paymentMethod: 'cash',
            status: 'pending',
            transactionId: `TEST-${Date.now()}`,
        };

        console.log('- Test payment data:', testPayment);

        // Try to create the payment
        const payment = await Payment.create(testPayment);
        console.log('✅ Payment created successfully:', payment._id);

        // Clean up test payment
        await Payment.findByIdAndDelete(payment._id);
        console.log('🧹 Test payment cleaned up');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

debugPaymentIssue();