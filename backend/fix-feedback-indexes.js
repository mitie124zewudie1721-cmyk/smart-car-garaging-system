// Script to fix duplicate feedback indexes
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

        console.log('\n🗑️  Dropping all indexes except _id...');
        await collection.dropIndexes();
        console.log('✅ Indexes dropped');

        console.log('\n🔨 Creating new indexes...');

        // Create the indexes we want
        await collection.createIndex({ garage: 1, createdAt: -1 });
        console.log('✅ Created index: { garage: 1, createdAt: -1 }');

        await collection.createIndex({ reservation: 1 }, { unique: true, sparse: true });
        console.log('✅ Created index: { reservation: 1 } (unique, sparse)');

        await collection.createIndex({ dispute: 1, user: 1 }, { unique: true, sparse: true });
        console.log('✅ Created index: { dispute: 1, user: 1 } (unique, sparse)');

        console.log('\n📋 New indexes:');
        const newIndexes = await collection.indexes();
        newIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ Index fix complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixIndexes();
