// Check what garage value was stored in the payment
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

async function checkPayment() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the most recent payment
        const payment = await Payment.findOne().sort({ createdAt: -1 }).lean();

        console.log('\n📋 Most Recent Payment:');
        console.log('─────────────────────────────────────');
        console.log('Payment ID:', payment._id);
        console.log('Reservation:', payment.reservation);
        console.log('User:', payment.user);
        console.log('Garage:', payment.garage);
        console.log('Garage Type:', typeof payment.garage);
        console.log('Garage is null?', payment.garage === null);
        console.log('Garage is undefined?', payment.garage === undefined);
        console.log('Amount:', payment.amount);
        console.log('Total Amount:', payment.totalAmount);
        console.log('Payment Method:', payment.paymentMethod);
        console.log('Status:', payment.status);
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Disconnected');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPayment();
