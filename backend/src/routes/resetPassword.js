// src/routes/resetPassword.js - Reset password for existing users
import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * Reset password for a specific user (development only)
 * POST /api/dev/reset-password
 * Body: { username: "garageowner", newPassword: "newpassword123" }
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username and newPassword are required',
            });
        }

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User '${username}' not found`,
            });
        }

        // Update password (pre-save hook will hash it automatically)
        user.password = newPassword;
        await user.save();

        console.log(`✅ Password reset for user: ${username}`);

        return res.status(200).json({
            success: true,
            message: `Password reset successfully for user '${username}'`,
            data: {
                username: user.username,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message,
        });
    }
});

/**
 * List all users (for debugging)
 * GET /api/dev/list-users
 */
router.get('/list-users', async (req, res) => {
    try {
        const users = await User.find().select('username name role email phone createdAt');

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to list users',
            error: error.message,
        });
    }
});

export default router;
