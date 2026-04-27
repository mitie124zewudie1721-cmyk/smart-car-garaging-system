// Quick endpoint to seed vehicles for testing
import express from 'express';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

router.get('/seed-vehicles', async (req, res) => {
    try {
        // Find or create car owner
        let carOwner = await User.findOne({ username: 'carowner' });

        if (!carOwner) {
            carOwner = await User.create({
                name: 'Test Car Owner',
                username: 'carowner',
                password: 'password123',
                phone: '+251923456789',
                role: 'car_owner',
            });
        }

        // Clear existing vehicles
        await Vehicle.deleteMany({ owner: carOwner._id });

        // Create sample vehicles
        const vehicles = await Vehicle.create([
            {
                owner: carOwner._id,
                plateNumber: 'AA-12345',
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                type: 'sedan',
                sizeCategory: 'medium',
                color: 'White',
            },
            {
                owner: carOwner._id,
                plateNumber: 'AA-67890',
                make: 'Honda',
                model: 'CR-V',
                year: 2021,
                type: 'suv',
                sizeCategory: 'large',
                color: 'Black',
            },
            {
                owner: carOwner._id,
                plateNumber: 'AA-11111',
                make: 'Suzuki',
                model: 'Swift',
                year: 2019,
                type: 'hatchback',
                sizeCategory: 'small',
                color: 'Red',
            },
            {
                owner: carOwner._id,
                plateNumber: 'AA-22222',
                make: 'Ford',
                model: 'Ranger',
                year: 2022,
                type: 'pickup',
                sizeCategory: 'large',
                color: 'Blue',
            },
            {
                owner: carOwner._id,
                plateNumber: 'AA-33333',
                make: 'Mercedes',
                model: 'Sprinter',
                year: 2021,
                type: 'van',
                sizeCategory: 'extra_large',
                color: 'Silver',
            },
            {
                owner: carOwner._id,
                plateNumber: 'AA-44444',
                make: 'Nissan',
                model: 'Patrol',
                year: 2020,
                type: 'suv',
                sizeCategory: 'large',
                color: 'Gray',
            },
        ]);

        return res.json({
            success: true,
            message: 'Vehicles seeded',
            carOwner: { username: 'carowner', password: 'password123' },
            vehicles: vehicles.map(v => `${v.make} ${v.model} (${v.plateNumber})`),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
