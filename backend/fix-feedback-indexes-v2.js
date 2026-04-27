// Script to fix duplicate feedback indexes - Version 2
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('feedbacks');

        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n🗑️  Dropping problematic indexes...');

        try {
            await collection.dropIndex('reservation_1');
            console.log('✅ Dropped: reservation_1');
        } catch (e) {
            console.log('⏭️  Index reservation_1 does not exist');
        }

        try {
            await collection.dropIndex('dispute_1_user_1');
            console.log('✅ Dropped: dispute_1_user_1');
        } catch (e) {
            console.log('⏭️  Index dispute_1_user_1 does not exist');
        }

        console.log('\n🔨 Creating new indexes...');

        // Recreate indexes properly
        try {
            await collection.createIndex({ reservation: 1 }, { unique: true, sparse: true });
            console.log('✅ Created index: { reservation: 1 } (unique, sparse)');
        } catch (e) {
            console.log('⚠️  Could not create reservation index:', e.message);
        }

        try {
            await collection.createIndex({ dispute: 1, user: 1 }, { unique: true, sparse: true });
            console.log('✅ Created index: { dispute: 1, user: 1 } (unique, sparse)');
        } catch (e) {
            console.log('⚠️  Could not create dispute index:', e.message);
        }

        console.log('\n📋 Final indexes:');
        const newIndexes = await collection.indexes();
        newIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ Index fix complete!');
        console.log('\n💡 Note: The warning about duplicate indexes should now be gone.');
        console.log('   Restart your backend server to see the changes.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

fixIndexes();
