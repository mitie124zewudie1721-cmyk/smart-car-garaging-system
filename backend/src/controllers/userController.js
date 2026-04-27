// src/controllers/userController.js
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Get current user's profile (protected route)
 */
export const getProfile = async (req, res) => {
    try {
        // req.user is set by protect middleware
        const user = await User.findById(req.user.id).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        logger.error('Get profile failed', { error: error.message, stack: error.stack });
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching profile',
        });
    }
};

/**
 * Update current user's profile (protected route)
 */
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, phone, email, profilePicture, carType, currentPassword, newPassword } = req.body;

        // Update basic fields
        if (name !== undefined) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (email !== undefined) user.email = email.trim() || undefined;
        if (profilePicture !== undefined) user.profilePicture = profilePicture.trim();
        if (carType !== undefined) user.carType = carType.trim();

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
            }
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }
            user.password = newPassword; // pre-save hook will hash it
        }

        await user.save();

        // Return user without password
        const updated = await User.findById(user._id).select('-password -__v');

        logger.info(`Profile updated for user: ${user._id} (${user.username})`);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updated,
        });
    } catch (error) {
        logger.error('Update profile failed', { error: error.message, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Server error while updating profile' });
    }
};

/**
 * Get all users (admin only) - with pagination, search, and role filter
 */
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role = req.query.role;
        const search = req.query.search?.trim();

        const query = {};

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .select('-password -__v -refreshToken') // exclude sensitive fields
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        logger.error('Get all users failed', { error: error.message, stack: error.stack });
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching users',
        });
    }
};

/**
 * Delete a user (admin only)
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin users' });

        // Cascade delete garage owner's garages and related data
        if (user.role === 'garage_owner') {
            const Garage = (await import('../models/Garage.js')).default;
            const Reservation = (await import('../models/Reservation.js')).default;
            const Payment = (await import('../models/Payment.js')).default;
            const Feedback = (await import('../models/Feedback.js')).default;

            const garages = await Garage.find({ owner: user._id }).select('_id');
            const garageIds = garages.map(g => g._id);

            if (garageIds.length > 0) {
                const reservations = await Reservation.find({ garage: { $in: garageIds } }).select('_id');
                const reservationIds = reservations.map(r => r._id);
                if (reservationIds.length > 0) {
                    await Payment.deleteMany({ reservation: { $in: reservationIds } });
                    await Feedback.deleteMany({ reservation: { $in: reservationIds } });
                    await Reservation.deleteMany({ _id: { $in: reservationIds } });
                }
                await Feedback.deleteMany({ garage: { $in: garageIds } });
                await Garage.deleteMany({ owner: user._id });
                logger.info(`Cascade deleted ${garageIds.length} garages for user ${user._id}`);
            }
        }

        await user.deleteOne();
        logger.info(`User deleted: ${user._id} (${user.username})`);
        return res.status(200).json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (error) {
        logger.error('Delete user failed', { error: error.message, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Server error while deleting user' });
    }
};


export default {
    getProfile,
    updateProfile,
    getAllUsers,
    deleteUser,
    uploadAvatar: uploadAvatarHandler,
};

/**
 * Upload / replace profile avatar
 */
export async function uploadAvatarHandler(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: avatarUrl },
            { new: true }
        ).select('-password -__v');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        logger.info(`Avatar updated for user ${req.user.id}`);
        return res.status(200).json({ success: true, message: 'Avatar updated', data: user });
    } catch (error) {
        logger.error('Upload avatar failed', { error: error.message });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}