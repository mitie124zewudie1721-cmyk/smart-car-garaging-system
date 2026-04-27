// Script to set a dispute to pending status for testing Take Action feature
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function setDisputePending() {
    try {
        console.log('🔧 Setting Dispute to Pending for Testing\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const Dispute = mongoose.model('Dispute', new mongoose.Schema({}, { strict: false }));

        // Find all closed or resolved disputes
        const disputes = await Dispute.find({
            status: { $in: ['closed', 'resolved', 'rejected'] }
        }).sort({ createdAt: -1 }).limit(5);

        if (disputes.length === 0) {
            console.log('❌ No closed, resolved, or rejected disputes found');
            console.log('💡 Create a dispute from the car owner account first');
            process.exit(0);
        }

        console.log(`Found ${disputes.length} dispute(s) that can be changed:\n`);

        disputes.forEach((d, index) => {
            console.log(`${index + 1}. ID: ${d._id}`);
            console.log(`   Status: ${d.status}`);
            console.log(`   Type: ${d.type}`);
            console.log(`   Reason: ${d.reason.substring(0, 50)}...`);
            console.log('');
        });

        // Change the first one
        const dispute = disputes[0];

        console.log('Updating the first dispute to PENDING status...\n');

        // Update to pending
        dispute.status = 'pending';
        dispute.resolvedBy = null;
        dispute.resolvedAt = null;
        dispute.adminAction = 'none';
        dispute.adminNote = null;

        await dispute.save();

        console.log('✅ SUCCESS! Dispute updated:');
        console.log(`   ID: ${dispute._id}`);
        console.log(`   New Status: ${dispute.status}`);
        console.log(`   Priority: ${dispute.priority}`);
        console.log('\n📋 Next Steps:');
        console.log('   1. Refresh your browser (F5)');
        console.log('   2. Go to Admin > Dispute Management');
        console.log('   3. Look for the dispute with status "pending"');
        console.log('   4. You should now see the "Take Action" button!');
        console.log('\n💡 Tip: Filter by "pending" status to find it quickly');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   - MongoDB connection string is correct in .env');
        console.error('   - You have disputes in the database');
        console.error('   - Backend server is not running (to avoid conflicts)');
        process.exit(1);
    }
}

setDisputePending();
