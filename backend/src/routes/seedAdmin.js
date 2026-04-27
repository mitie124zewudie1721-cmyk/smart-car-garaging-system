// Quick endpoint to create admin user
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/seed-admin', async (req, res) => {
    try {
        // Check if admin already exists
        let admin = await User.findOne({ username: 'admin' });

        if (admin) {
            return res.json({
                success: true,
                message: 'Admin user already exists',
                admin: { username: 'admin', password: 'admin123', role: 'admin' },
            });
        }

        // Create admin user
        admin = await User.create({
            name: 'System Administrator',
            username: 'admin',
            password: 'admin123',
            phone: '+251900000000',
            role: 'admin',
        });

        return res.json({
            success: true,
            message: 'Admin user created successfully',
            admin: {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                _id: admin._id,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
