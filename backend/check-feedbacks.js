// Check existing feedback documents
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkFeedbacks = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const collection = db.collection('feedbacks');

        const total = await collection.countDocuments();
        console.log(`📊 Total feedbacks: ${total}\n`);

        const withReservation = await collection.countDocuments({ reservation: { $ne: null } });
        const withDispute = await collection.countDocuments({ dispute: { $ne: null } });
        const withNeither = await collection.countDocuments({
            reservation: null,
            dispute: null
        });

        console.log(`  - With reservation: ${withReservation}`);
        console.log(`  - With dispute: ${withDispute}`);
        console.log(`  - With neither: ${withNeither}\n`);

        // Check for duplicate dispute+user combinations
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: { dispute: '$dispute', user: '$user' },
                    count: { $sum: 1 },
                    ids: { $push: '$_id' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]).toArray();

        if (duplicates.length > 0) {
            console.log(`⚠️  Found ${duplicates.length} duplicate dispute+user combinations:`);
            duplicates.forEach(dup => {
                console.log(`  - dispute: ${dup._id.dispute}, user: ${dup._id.user}, count: ${dup.count}`);
            });
        } else {
            console.log('✅ No duplicate dispute+user combinations found');
        }

        // Show sample documents
        console.log('\n📄 Sample feedback documents:');
        const samples = await collection.find().limit(3).toArray();
        samples.forEach((doc, i) => {
            console.log(`\n  Sample ${i + 1}:`);
            console.log(`    _id: ${doc._id}`);
            console.log(`    user: ${doc.user}`);
            console.log(`    garage: ${doc.garage}`);
            console.log(`    reservation: ${doc.reservation || 'null'}`);
            console.log(`    dispute: ${doc.dispute || 'null'}`);
            console.log(`    feedbackType: ${doc.feedbackType || 'not set'}`);
            console.log(`    rating: ${doc.rating}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkFeedbacks();
