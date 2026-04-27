// src/services/authService.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { config } = require('../config');
const logger = require('../utils/logger');

class AuthService {
    /**
     * Register new user – username only (no email)
     */
    async register(data) {
        const { username, password, name, phone, carType, role = 'car_owner' } = data;

        // Validate required fields
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // Check duplicate username
        if (await User.findOne({ username })) {
            throw new Error('Username already registered');
        }

        // Create user
        const user = await User.create({
            name: name || username,
            username,
            password,  // will be hashed in pre-save hook
            phone: phone || undefined,
            carType: carType || undefined,
            role,
        });

        logger.info(`New user registered: ${user.username} (${user.role})`);

        return this.generateTokens(user);
    }

    /**
     * Login with username + password
     */
    async login(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // Find user with password
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid username or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        logger.info(`User logged in: ${username}`);

        return this.generateTokens(user);
    }

    /**
     * Generate tokens and return frontend-expected shape
     */
    generateTokens(user) {
        const payload = { id: user._id, role: user.role };

        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
        // Optional: refresh token can be generated but not returned here
        // const refreshToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

        return {
            token,  // ← this is what frontend expects
            user: {
                _id: user._id.toString(),
                name: user.name,
                username: user.username,
                role: user.role,
                phone: user.phone || null,
                carType: user.carType || null,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            },
        };
    }

    /**
     * Refresh token (returns new token only)
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtSecret);
            const user = await User.findById(decoded.id);

            if (!user) {
                throw new Error('User not found');
            }

            return this.generateTokens(user);
        } catch (err) {
            logger.error('Refresh token failed', { error: err.message });
            throw new Error('Invalid refresh token');
        }
    }
}

module.exports = new AuthService();