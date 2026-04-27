// src/scripts/seedGarages.js - Populate test garage data
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Garage from '../models/Garage.js';

const sampleGarages = [
    {
        name: 'Jimma Central Parking',
        location: {
            type: 'Point',
            coordinates: [36.8342, 7.6769], // [lng, lat] - Jimma city center
            address: 'Main Street, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', '24h', 'cctv'],
        capacity: 50,
        pricePerHour: 20,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Secure 24/7 parking in the heart of Jimma city',
        images: [],
    },
    {
        name: 'Jimma University Garage',
        location: {
            type: 'Point',
            coordinates: [36.8142, 7.6940], // Near Jimma University
            address: 'Jimma University Campus, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', 'washing', 'repair'],
        capacity: 30,
        pricePerHour: 15,
        operatingHours: { start: '06:00', end: '22:00' },
        description: 'Convenient parking for university visitors with car wash and repair services',
        images: [],
    },
    {
        name: 'Ajip Garage & Service',
        location: {
            type: 'Point',
            coordinates: [36.8242, 7.6840], // Jimma area
            address: 'Ajip Road, Jimma, Ethiopia',
        },
        amenities: ['covered', 'repair', 'washing', 'air_pump', 'electric_charge'],
        capacity: 20,
        pricePerHour: 25,
        operatingHours: { start: '07:00', end: '20:00' },
        description: 'Full-service garage with electric vehicle charging',
        images: [],
    },
    {
        name: 'Merkato Parking Plaza',
        location: {
            type: 'Point',
            coordinates: [36.8442, 7.6669], // South Jimma
            address: 'Merkato Area, Jimma, Ethiopia',
        },
        amenities: ['secure', '24h', 'cctv', 'valet'],
        capacity: 100,
        pricePerHour: 18,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Large parking facility with valet service near shopping area',
        images: [],
    },
    {
        name: 'Airport Parking Services',
        location: {
            type: 'Point',
            coordinates: [36.8042, 7.7040], // North of Jimma
            address: 'Airport Road, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', '24h', 'cctv'],
        capacity: 40,
        pricePerHour: 30,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Premium parking near airport with 24/7 security',
        images: [],
    },
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Create or find a garage owner user
        let garageOwner = await User.findOne({ role: 'garage_owner' });

        if (!garageOwner) {
            console.log('📝 Creating garage owner account...');
            garageOwner = await User.create({
                name: 'Test Garage Owner',
                username: 'garageowner',
                password: 'password123', // Will be hashed by model
                phone: '+251912345678',
                role: 'garage_owner',
            });
            console.log('✅ Garage owner created: username=garageowner, password=password123');
        } else {
            console.log('✅ Using existing garage owner:', garageOwner.username);
        }

        // Clear existing garages (optional - comment out if you want to keep existing data)
        const deletedCount = await Garage.deleteMany({});
        console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing garages`);

        // Create garages
        console.log('🏢 Creating sample garages...');
        const garages = await Promise.all(
            sampleGarages.map(garage =>
                Garage.create({
                    ...garage,
                    owner: garageOwner._id,
                })
            )
        );

        console.log(`✅ Created ${garages.length} garages successfully!`);
        console.log('\n📍 Sample Garages:');
        garages.forEach((g, i) => {
            console.log(`   ${i + 1}. ${g.name} - ${g.location.address}`);
            console.log(`      Coordinates: [${g.location.coordinates[0]}, ${g.location.coordinates[1]}]`);
            console.log(`      Price: ${g.pricePerHour} ETB/hour, Capacity: ${g.capacity}`);
        });

        console.log('\n🎉 Database seeding completed!');
        console.log('\n📝 Test Credentials:');
        console.log('   Username: garageowner');
        console.log('   Password: password123');
        console.log('   Role: garage_owner');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

seedDatabase();
