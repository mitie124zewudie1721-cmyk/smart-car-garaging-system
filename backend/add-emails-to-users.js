// Script to add email addresses to existing users
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function addEmails() {
    try {
        console.log('📧 Adding Email Addresses to Users\n');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Email mappings for test users
        const updates = [
            { username: 'carowner', email: 'carowner@test.com' },
            { username: 'garageowner', email: 'garageowner@test.com' },
            { username: 'admin', email: 'admin@test.com' },
            { username: 'demeke', email: 'demeke@test.com' },
            { username: 'kene', email: 'kene@test.com' },
        ];

        console.log('Updating users with email addresses...\n');

        let updated = 0;
        let notFound = 0;
        let alreadyHas = 0;

        for (const update of updates) {
            const user = await User.findOne({ username: update.username });

            if (!user) {
                console.log(`⚠️  User "${update.username}" not found`);
                notFound++;
                continue;
            }

            if (user.email) {
                console.log(`ℹ️  User "${update.username}" already has email: ${user.email}`);
                alreadyHas++;
                continue;
            }

            user.email = update.email;
            await user.save();
            console.log(`✅ Updated "${update.username}" with email: ${update.email}`);
            updated++;
        }

        console.log('\n📊 Summary:');
        console.log(`   Updated: ${updated}`);
        console.log(`   Already had email: ${alreadyHas}`);
        console.log(`   Not found: ${notFound}`);
        console.log(`   Total processed: ${updates.length}`);

        console.log('\n💡 Next Steps:');
        console.log('   1. Configure email service in .env file');
        console.log('   2. Add these variables:');
        console.log('      EMAIL_SERVICE=gmail');
        console.log('      EMAIL_USER=your-email@gmail.com');
        console.log('      EMAIL_PASSWORD=your-app-password');
        console.log('      EMAIL_FROM=Smart Garaging <noreply@smartgaraging.com>');
        console.log('      ENABLE_EMAIL_NOTIFICATIONS=true');
        console.log('   3. Restart backend server');
        console.log('   4. Test by creating a notification');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

addEmails();
