// src/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Register a new user (car_owner, garage_owner, or admin)
 * Email is NOT accepted at all
 * Note: Password hashing is handled by User model pre-save hook
 */
export const register = async (req, res) => {
    try {
        let { name, username, password, phone, carType, role = 'car_owner' } = req.body;

        // Basic input sanitization
        username = (username || '').trim();
        password = (password || '').trim();
        name = (name || username || '').trim();
        phone = (phone || '').trim();
        carType = (carType || '').trim();
        role = (role || 'car_owner').trim().toLowerCase();

        // Required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        // Username validation
        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters long',
            });
        }

        // Check duplicate username (case-insensitive)
        const existingUser = await User.findOne({
            username: { $regex: new RegExp('^' + username + '$', 'i') }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken',
            });
        }

        // NO hashing here — Mongoose pre-save hook will handle it
        const user = await User.create({
            name: name || username,
            username,
            password,  // ← plain password (model hashes it)
            phone: phone || undefined,
            carType: carType || undefined,
            role,
        });

        logger.info(`New user registered: ${username} (${role})`);

        // Generate token
        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                phone: user.phone || null,
                carType: user.carType || null,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        logger.error('Registration failed', { error: error.message, stack: error.stack });

        let status = 500;
        let message = 'Server error during registration';

        if (error.code === 11000) {
            message = 'Username is already taken';
            status = 400;
        } else if (error.name === 'ValidationError') {
            message = Object.values(error.errors)[0]?.message || 'Invalid data provided';
            status = 400;
        }

        return res.status(status).json({ success: false, message });
    }
};

/**
 * Login user using ONLY username + password
 */
export const login = async (req, res) => {
    try {
        let { username, password } = req.body;

        // Sanitize input
        username = (username || '').trim();
        password = (password || '').trim();

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        // Find user (case-insensitive + exact match)
        const user = await User.findOne({
            username: { $regex: new RegExp('^' + username + '$', 'i') }
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Compare password (Mongoose already hashed it once)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Track failed attempts
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            user.lastFailedLogin = new Date();
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
                await user.save();
                logger.warn(`Account locked after 5 failed attempts: ${username}`);
                return res.status(429).json({
                    success: false,
                    message: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
                });
            }
            await user.save();
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again in ${minutesLeft} minute(s).`,
            });
        }

        // Reset failed attempts on successful login
        if (user.loginAttempts > 0) {
            user.loginAttempts = 0;
            user.lockUntil = null;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        logger.info(`User logged in: ${user.username} (${user.role})`);

        // Generate token
        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                phone: user.phone || null,
                carType: user.carType || null,
                profilePicture: user.profilePicture || null,
                lastLogin: user.lastLogin,
            },
        });
    } catch (error) {
        logger.error('Login failed', { error: error.message, stack: error.stack });

        return res.status(500).json({
            success: false,
            message: 'Server error during login',
        });
    }
};

/**
 * Refresh access token (optional – if you want to keep it)
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            token,
        });
    } catch (error) {
        logger.error('Token refresh failed', { error: error.message, stack: error.stack });
        return res.status(500).json({
            success: false,
            message: 'Server error during token refresh',
        });
    }
};

/**
 * Logout endpoint (client-side primarily, can be used to invalidate token if needed)
 */
export const logout = async (req, res) => {
    try {
        logger.info(`User logged out: ${req.user?.username || 'unknown'}`);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        logger.error('Logout failed', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Server error during logout',
        });
    }
};

/**
 * Forgot password — send reset link to email
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        // Always respond success to prevent email enumeration
        if (!user) {
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const { sendEmail } = await import('../services/emailService.js');
        await sendEmail({
            to: user.email,
            subject: '🔑 Smart Garaging — Password Reset',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8faff;border-radius:12px;overflow:hidden;border:1px solid #e0e7ff;">
                    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:24px;">Smart Garaging</h1>
                        <p style="color:#c7d2fe;margin:8px 0 0;">Password Reset Request</p>
                    </div>
                    <div style="padding:32px;">
                        <p style="color:#374151;font-size:16px;">Hi <strong>${user.name}</strong>,</p>
                        <p style="color:#6b7280;font-size:15px;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                        <div style="text-align:center;margin:32px 0;">
                            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">Reset My Password</a>
                        </div>
                        <p style="color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
                        <p style="color:#9ca3af;font-size:12px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
                    </div>
                    <div style="background:#f1f5f9;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
                        <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Smart Garaging System</p>
                    </div>
                </div>
            `,
        });

        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        logger.error('Forgot password error', { error: err.message });
        res.status(500).json({ success: false, message: 'Failed to send reset email' });
    }
};

/**
 * Reset password — verify token and set new password
 */
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashedToken = (await import('crypto')).default.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select('+password +passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        logger.error('Reset password error', { error: err.message });
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

export default {
    register,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
};
