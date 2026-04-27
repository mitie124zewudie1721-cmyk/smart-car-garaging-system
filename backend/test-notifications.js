// Test script to create notifications and verify the system works
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function testNotifications() {
    try {
        console.log('🔔 Testing Notification System\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get models
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

        // Find a garage owner
        const garageOwner = await User.findOne({ role: 'garage_owner' });
        if (!garageOwner) {
            console.log('❌ No garage owner found. Please create a garage owner account first.');
            process.exit(1);
        }

        console.log(`Found garage owner: ${garageOwner.name} (${garageOwner._id})\n`);

        // Create test notifications
        const notifications = [
            {
                user: garageOwner._id,
                type: 'booking_new',
                title: 'New Booking Request',
                message: 'You have a new booking request for Oil Change service',
                relatedModel: 'Reservation',
                relatedId: new mongoose.Types.ObjectId(),
                read: false,
                createdAt: new Date()
            },
            {
                user: garageOwner._id,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: 'Your booking has been confirmed by the customer',
                relatedModel: 'Reservation',
                relatedId: new mongoose.Types.ObjectId(),
                read: false,
                createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
                user: garageOwner._id,
                type: 'payment_received',
                title: 'Payment Received',
                message: 'Payment of 500 ETB received for completed service',
                relatedModel: 'Payment',
                relatedId: new mongoose.Types.ObjectId(),
                read: false,
                createdAt: new Date(Date.now() - 7200000) // 2 hours ago
            }
        ];

        console.log('Creating test notifications...');
        await Notification.insertMany(notifications);
        console.log(`✅ Created ${notifications.length} test notifications\n`);

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({
            user: garageOwner._id,
            read: false
        });

        console.log('📊 Notification Summary:');
        console.log(`   User: ${garageOwner.name}`);
        console.log(`   User ID: ${garageOwner._id}`);
        console.log(`   Unread Notifications: ${unreadCount}`);
        console.log(`   Total Notifications: ${notifications.length}`);

        console.log('\n📋 Next Steps:');
        console.log('   1. Login as garage owner:');
        console.log(`      Email: ${garageOwner.email || 'garageowner@test.com'}`);
        console.log('      Password: garageowner123');
        console.log('   2. Look at the top-right corner of the navbar');
        console.log('   3. You should see a bell icon with a red badge showing the count');
        console.log('   4. Click the bell to see your notifications');

        console.log('\n💡 API Endpoints:');
        console.log('   GET  /api/notifications - Get all notifications');
        console.log('   GET  /api/notifications/unread-count - Get unread count');
        console.log('   PATCH /api/notifications/:id/read - Mark as read');
        console.log('   PATCH /api/notifications/mark-all-read - Mark all as read');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testNotifications();
