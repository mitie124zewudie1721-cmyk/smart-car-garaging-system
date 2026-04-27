// src/services/userService.js
const User = require('../models/User');
const logger = require('../utils/logger');

class UserService {
    /**
     * Get user profile by ID
     */
    async getProfile(userId) {
        try {
            const user = await User.findById(userId)
                .populate('vehicle')
                .select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (err) {
            logger.error(`Failed to get profile for user ${userId}: ${err.message}`);
            throw err;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Prevent updating password or sensitive fields directly
            const allowedUpdates = ['name', 'phone', 'carType', 'profilePicture'];
            Object.keys(data).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    user[key] = data[key];
                }
            });

            await user.save();

            logger.info(`Profile updated for user: ${userId}`);
            return user;
        } catch (err) {
            logger.error(`Failed to update profile for user ${userId}: ${err.message}`);
            throw err;
        }
    }

    /**
     * Get all users with filters and pagination
     */
    async getAllUsers(filters = {}) {
        try {
            const { page = 1, limit = 20, role, search } = filters;

            // Prevent invalid pagination
            const safePage = Math.max(1, Number(page));
            const safeLimit = Math.min(100, Math.max(1, Number(limit)));

            const query = {};

            if (role) {
                query.role = role;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    // No email search anymore
                ];
            }

            const users = await User.find(query)
                .select('-password')
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit);

            const total = await User.countDocuments(query);

            return {
                users,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    pages: Math.ceil(total / safeLimit),
                },
            };
        } catch (err) {
            logger.error(`Failed to get all users: ${err.message}`);
            throw err;
        }
    }

    /**
     * Delete user by ID
     */
    async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                throw new Error('User not found');
            }

            logger.warn(`User deleted: ${userId}`);
            return { message: 'User deleted successfully' };
        } catch (err) {
            logger.error(`Failed to delete user ${userId}: ${err.message}`);
            throw err;
        }
    }
}

module.exports = new UserService();