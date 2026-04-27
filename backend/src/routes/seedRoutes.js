// src/routes/seedRoutes.js - API endpoint to seed data
import express from 'express';
import User from '../models/User.js';
import Garage from '../models/Garage.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

const sampleGarages = [
    {
        name: 'Jimma Central Auto Service',
        location: {
            type: 'Point',
            coordinates: [36.8342, 7.6769], // [lng, lat] - Jimma city center
            address: 'Main Street, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', '24h', 'repair', 'washing'],
        capacity: 50,
        availableSlots: 50,
        pricePerHour: 20,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Full-service auto repair and maintenance center in the heart of Jimma city',
        images: [],
    },
    {
        name: 'Jimma University Auto Workshop',
        location: {
            type: 'Point',
            coordinates: [36.8142, 7.6940], // Near Jimma University
            address: 'Jimma University Campus, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', 'washing', 'repair', 'air_pump'],
        capacity: 30,
        availableSlots: 30,
        pricePerHour: 15,
        operatingHours: { start: '06:00', end: '22:00' },
        description: 'Professional car service and repair workshop with experienced mechanics',
        images: [],
    },
    {
        name: 'Ajip Auto Care & Service Center',
        location: {
            type: 'Point',
            coordinates: [36.8242, 7.6840], // Jimma area
            address: 'Ajip Road, Jimma, Ethiopia',
        },
        amenities: ['covered', 'repair', 'washing', 'air_pump', 'electric_charge'],
        capacity: 20,
        availableSlots: 20,
        pricePerHour: 25,
        operatingHours: { start: '07:00', end: '20:00' },
        description: 'Modern garage with electric vehicle service and charging facilities',
        images: [],
    },
    {
        name: 'Merkato Auto Repair Plaza',
        location: {
            type: 'Point',
            coordinates: [36.8442, 7.6669], // South Jimma
            address: 'Merkato Area, Jimma, Ethiopia',
        },
        amenities: ['secure', '24h', 'cctv', 'repair', 'washing'],
        capacity: 100,
        availableSlots: 100,
        pricePerHour: 18,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Large auto service facility with multiple service bays and expert technicians',
        images: [],
    },
    {
        name: 'Premium Auto Service Center',
        location: {
            type: 'Point',
            coordinates: [36.8042, 7.7040], // North of Jimma
            address: 'Airport Road, Jimma, Ethiopia',
        },
        amenities: ['covered', 'secure', '24h', 'cctv', 'repair', 'washing'],
        capacity: 40,
        availableSlots: 40,
        pricePerHour: 30,
        operatingHours: { start: '00:00', end: '23:59' },
        description: 'Premium car service center with advanced diagnostic equipment',
        images: [],
    },
];

router.get('/seed', async (req, res) => {
    try {
        console.log('🌱 Starting database seeding via API...');

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
            console.log('✅ Garage owner created');
        }

        // Clear existing garages
        const deletedCount = await Garage.deleteMany({});
        console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing garages`);

        // Create garages
        const garages = await Promise.all(
            sampleGarages.map(garage =>
                Garage.create({
                    ...garage,
                    owner: garageOwner._id,
                })
            )
        );

        console.log(`✅ Created ${garages.length} garages successfully!`);

        return res.status(200).json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                garagesCreated: garages.length,
                garageOwner: {
                    username: 'garageowner',
                    password: 'password123',
                    role: 'garage_owner',
                },
                garages: garages.map(g => ({
                    name: g.name,
                    address: g.location.address,
                    coordinates: g.location.coordinates,
                })),
            },
        });
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Seeding failed',
            error: error.message,
        });
    }
});

router.post('/seed', async (req, res) => {
    try {
        console.log('🌱 Starting database seeding via API...');

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
            console.log('✅ Garage owner created');
        }

        // Clear existing garages
        const deletedCount = await Garage.deleteMany({});
        console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing garages`);

        // Create garages
        const garages = await Promise.all(
            sampleGarages.map(garage =>
                Garage.create({
                    ...garage,
                    owner: garageOwner._id,
                })
            )
        );

        console.log(`✅ Created ${garages.length} garages successfully!`);

        return res.status(200).json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                garagesCreated: garages.length,
                garageOwner: {
                    username: 'garageowner',
                    password: 'password123',
                    role: 'garage_owner',
                },
                garages: garages.map(g => ({
                    name: g.name,
                    address: g.location.address,
                    coordinates: g.location.coordinates,
                })),
            },
        });
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Seeding failed',
            error: error.message,
        });
    }
});

export default router;
