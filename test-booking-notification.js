// Test script to verify booking notifications
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function testNotifications() {
    try {
        console.log('🔔 Testing Booking Notification System\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get models
        const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
        const Reservation = mongoose.model('Reservation', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Find the confirmed reservation
        const reservation = await Reservation.findOne({ status: 'confirmed' })
            .populate('user')
            .populate('garage')
            .sort({ updatedAt: -1 });

        if (!reservation) {
            console.log('❌ No confirmed reservations found');
            console.log('Please confirm a booking first, then run this test again.');
            process.exit(0);
        }

        console.log('📋 Found Reservation:');
        console.log(`   ID: ${reservation._id}`);
        console.log(`   Status: ${reservation.status}`);
        console.log(`   Service: ${reservation.serviceType}`);
        console.log(`   Car Owner: ${reservation.user._id}`);
        console.log(`   Updated: ${reservation.updatedAt}\n`);

        // Check if notification was created for this reservation
        const notifications = await Notification.find({
            recipient: reservation.user._id,
        }).sort({ createdAt: -1 }).limit(5);

        console.log(`📊 Notifications for Car Owner (${reservation.user._id}):`);
        console.log(`   Total found: ${notifications.length}\n`);

        if (notifications.length === 0) {
            console.log('❌ NO NOTIFICATIONS FOUND!');
            console.log('\n🔧 This means the notification code is not being executed.');
            console.log('\n📝 Possible reasons:');
            console.log('   1. Backend was not restarted after code changes');
            console.log('   2. Notification creation code has an error');
            console.log('   3. The acceptReservation function is not calling createNotification');
            console.log('\n✅ Solution:');
            console.log('   1. Stop the backend (Ctrl+C)');
            console.log('   2. Restart: npm run dev');
            console.log('   3. Confirm a booking again');
            console.log('   4. Run this test again');
        } else {
            console.log('✅ Notifications found:');
            notifications.forEach((notif, index) => {
                console.log(`\n   ${index + 1}. ${notif.title}`);
                console.log(`      Type: ${notif.type}`);
                console.log(`      Message: ${notif.message}`);
                console.log(`      Read: ${notif.isRead}`);
                console.log(`      Created: ${notif.createdAt}`);
            });

            // Check for booking_confirmed notification
            const confirmNotif = notifications.find(n => n.type === 'booking_confirmed');
            if (confirmNotif) {
                console.log('\n✅ BOOKING CONFIRMATION NOTIFICATION EXISTS!');
                console.log('   The notification system is working correctly.');
            } else {
                console.log('\n⚠️  No "booking_confirmed" notification found.');
                console.log('   The notification might have been created before the code update.');
                console.log('   Try confirming a NEW booking to test.');
            }
        }

        console.log('\n📋 Next Steps:');
        console.log('   1. Make sure backend is running with latest code');
        console.log('   2. Login as car owner (fasika)');
        console.log('   3. Check bell icon for notifications');
        console.log('   4. If no notifications, restart backend and try again');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testNotifications();
