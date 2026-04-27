// Check if dispute notification was created
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function checkDisputeNotification() {
    try {
        console.log('🔍 Checking Dispute Notifications\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
        const Dispute = mongoose.model('Dispute', new mongoose.Schema({}, { strict: false }));
        const Garage = mongoose.model('Garage', new mongoose.Schema({}, { strict: false }));

        // Find the latest dispute
        const dispute = await Dispute.findOne().sort({ createdAt: -1 });

        if (!dispute) {
            console.log('❌ No disputes found in database');
            process.exit(0);
        }

        console.log('📋 Latest Dispute:');
        console.log(`   ID: ${dispute._id}`);
        console.log(`   Type: ${dispute.type}`);
        console.log(`   Reason: ${dispute.reason}`);
        console.log(`   Status: ${dispute.status}`);
        console.log(`   Created: ${dispute.createdAt}`);
        console.log(`   Garage ID: ${dispute.garage}\n`);

        // Get garage owner
        const garage = await Garage.findById(dispute.garage);
        if (!garage) {
            console.log('❌ Garage not found');
            process.exit(0);
        }

        console.log('🏢 Garage Info:');
        console.log(`   Name: ${garage.name}`);
        console.log(`   Owner ID: ${garage.owner}\n`);

        // Check for notification
        const notifications = await Notification.find({
            recipient: garage.owner,
            type: 'dispute_new',
        }).sort({ createdAt: -1 });

        console.log(`📊 Dispute Notifications for Garage Owner:`);
        console.log(`   Total found: ${notifications.length}\n`);

        if (notifications.length === 0) {
            console.log('❌ NO DISPUTE NOTIFICATIONS FOUND!\n');
            console.log('🔧 This means:');
            console.log('   1. The dispute was filed BEFORE the code was updated');
            console.log('   2. OR the notification code has an error\n');
            console.log('✅ Solution:');
            console.log('   1. File a NEW dispute (not the old one)');
            console.log('   2. Watch backend logs for:');
            console.log('      "Dispute created: [id]"');
            console.log('      "Notification sent to garage owner [id]"');
            console.log('   3. Check bell icon again\n');
        } else {
            console.log('✅ Dispute notifications found:\n');
            notifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.title}`);
                console.log(`      Message: ${notif.message}`);
                console.log(`      Read: ${notif.isRead}`);
                console.log(`      Created: ${notif.createdAt}\n`);
            });

            // Check if latest notification matches latest dispute
            const latestNotif = notifications[0];
            const timeDiff = Math.abs(new Date(latestNotif.createdAt) - new Date(dispute.createdAt));
            const secondsDiff = timeDiff / 1000;

            if (secondsDiff < 5) {
                console.log('✅ NOTIFICATION WAS CREATED FOR THIS DISPUTE!');
                console.log('   The notification system is working correctly.');
                console.log('   Garage owner should see it in bell icon.');
            } else {
                console.log('⚠️  Latest notification is older than latest dispute.');
                console.log(`   Dispute created: ${dispute.createdAt}`);
                console.log(`   Notification created: ${latestNotif.createdAt}`);
                console.log(`   Time difference: ${secondsDiff.toFixed(0)} seconds\n`);
                console.log('   This means the dispute was filed BEFORE code update.');
                console.log('   File a NEW dispute to test!');
            }
        }

        console.log('\n📋 Next Steps:');
        console.log('   1. File a NEW dispute as car owner');
        console.log('   2. Watch backend terminal for logs');
        console.log('   3. Login as garage owner');
        console.log('   4. Check bell icon');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkDisputeNotification();
