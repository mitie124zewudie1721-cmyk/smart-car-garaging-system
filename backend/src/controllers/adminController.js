// src/controllers/adminController.js
import User from '../models/User.js';
import Garage from '../models/Garage.js';
import Reservation from '../models/Reservation.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';

/**
 * Get system statistics (admin only)
 */
export const getSystemStats = async (req, res, next) => {
    try {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            totalGarages,
            totalReservations,
            activeReservations,
            completedReservations,
            payments,
            pendingGarages,
            activeUsers,
            lastMonthUsers,
            lastMonthGarages,
            lastMonthReservations,
            lastMonthRevenue,
        ] = await Promise.all([
            User.countDocuments({ deletedAt: null }),
            Garage.countDocuments({ deletedAt: null }),
            Reservation.countDocuments(),
            Reservation.countDocuments({ status: { $in: ['pending', 'confirmed', 'active'] } }),
            Reservation.countDocuments({ status: 'completed' }),
            Payment.find({ status: 'success' }),
            Garage.countDocuments({ status: 'pending' }),
            User.countDocuments({ lastLogin: { $gte: last7Days }, deletedAt: null }),
            User.countDocuments({ createdAt: { $lt: thisMonth, $gte: lastMonth }, deletedAt: null }),
            Garage.countDocuments({ createdAt: { $lt: thisMonth, $gte: lastMonth } }),
            Reservation.countDocuments({ createdAt: { $lt: thisMonth, $gte: lastMonth } }),
            Payment.aggregate([
                { $match: { status: 'success', createdAt: { $lt: thisMonth, $gte: lastMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
        ]);

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const lastMonthRevenueTotal = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;

        // Calculate growth percentages
        const userGrowth = lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : (totalUsers > 0 ? '100.0' : '0.0');
        const garageGrowth = lastMonthGarages > 0 ? ((totalGarages - lastMonthGarages) / lastMonthGarages * 100).toFixed(1) : (totalGarages > 0 ? '100.0' : '0.0');
        const reservationGrowth = lastMonthReservations > 0 ? ((totalReservations - lastMonthReservations) / lastMonthReservations * 100).toFixed(1) : (totalReservations > 0 ? '100.0' : '0.0');
        const revenueGrowth = lastMonthRevenueTotal > 0 ? ((totalRevenue - lastMonthRevenueTotal) / lastMonthRevenueTotal * 100).toFixed(1) : (totalRevenue > 0 ? '100.0' : '0.0');

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalGarages,
                totalReservations,
                totalRevenue,
                activeReservations,
                completedReservations,
                pendingGarages,
                userGrowth: parseFloat(userGrowth),
                garageGrowth: parseFloat(garageGrowth),
                reservationGrowth: parseFloat(reservationGrowth),
                revenueGrowth: parseFloat(revenueGrowth),
            },
        });
    } catch (error) {
        logger.error('Get system stats failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all users with optional filtering (admin only)
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 50, search } = req.query;

        const query = { deletedAt: null }; // exclude soft-deleted
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Get all users failed', { error: error.message });
        next(error);
    }
};

/**
 * Update user status (admin only)
 */
export const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        logger.info(`User ${id} status updated to ${isActive} by admin ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
            data: user,
        });
    } catch (error) {
        logger.error('Update user status failed', { error: error.message });
        next(error);
    }
};

/**
 * Change user role (admin only)
 */
export const changeUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['car_owner', 'garage_owner', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be car_owner, garage_owner, or admin',
            });
        }

        // Prevent admin from changing their own role
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role',
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Create notification for user
        try {
            await createNotification({
                recipient: user._id,
                title: 'Role Changed',
                message: `Your account role has been changed to ${role.replace('_', ' ')}`,
                type: 'admin_action',
                actionUrl: '/dashboard',
                priority: 'high',
            });
        } catch (notifError) {
            logger.error('Failed to create role change notification', { error: notifError.message });
        }

        logger.info(`User ${id} role changed to ${role} by admin ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: `User role changed to ${role} successfully`,
            data: user,
        });
    } catch (error) {
        logger.error('Change user role failed', { error: error.message });
        next(error);
    }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Soft delete — move to trash
        user.deletedAt = new Date();
        await user.save();

        // Also soft-delete their garages if garage_owner
        if (user.role === 'garage_owner') {
            const Garage = (await import('../models/Garage.js')).default;
            await Garage.updateMany({ owner: user._id }, { deletedAt: new Date() });
        }

        logger.info(`User ${id} soft-deleted (trashed) by admin ${req.user.id}`);
        return res.status(200).json({ success: true, message: 'User moved to trash' });
    } catch (error) {
        logger.error('Delete user failed', { error: error.message });
        next(error);
    }
};

/**
 * Delete garage (admin only — soft delete)
 */
export const deleteGarage = async (req, res, next) => {
    try {
        const Garage = (await import('../models/Garage.js')).default;
        const garage = await Garage.findById(req.params.id);
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        garage.deletedAt = new Date();
        await garage.save();
        logger.info(`Garage ${req.params.id} soft-deleted by admin ${req.user.id}`);
        return res.status(200).json({ success: true, message: 'Garage moved to trash' });
    } catch (error) {
        logger.error('Delete garage failed', { error: error.message });
        next(error);
    }
};

/**
 * Get trash (soft-deleted users and garages)
 */
export const getTrash = async (req, res, next) => {
    try {
        const Garage = (await import('../models/Garage.js')).default;
        const [users, garages] = await Promise.all([
            User.find({ deletedAt: { $ne: null } }).select('-password').sort({ deletedAt: -1 }),
            Garage.find({ deletedAt: { $ne: null } }).populate('owner', 'name username').sort({ deletedAt: -1 }),
        ]);
        return res.status(200).json({ success: true, data: { users, garages } });
    } catch (error) { next(error); }
};

/**
 * Restore user from trash
 */
export const restoreUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found in trash' });
        // Restore their garages too
        if (user.role === 'garage_owner') {
            const Garage = (await import('../models/Garage.js')).default;
            await Garage.updateMany({ owner: user._id, deletedAt: { $ne: null } }, { deletedAt: null });
        }
        logger.info(`User ${req.params.id} restored from trash by admin ${req.user.id}`);
        return res.status(200).json({ success: true, message: 'User restored successfully' });
    } catch (error) { next(error); }
};

/**
 * Permanently delete user from trash
 */
export const permanentDeleteUser = async (req, res, next) => {
    try {
        const Garage = (await import('../models/Garage.js')).default;
        const Reservation = (await import('../models/Reservation.js')).default;
        const Payment = (await import('../models/Payment.js')).default;
        const Feedback = (await import('../models/Feedback.js')).default;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'garage_owner') {
            const garages = await Garage.find({ owner: user._id }).select('_id');
            const garageIds = garages.map(g => g._id);
            if (garageIds.length > 0) {
                const reservations = await Reservation.find({ garage: { $in: garageIds } }).select('_id');
                const resIds = reservations.map(r => r._id);
                if (resIds.length > 0) {
                    await Payment.deleteMany({ reservation: { $in: resIds } });
                    await Feedback.deleteMany({ reservation: { $in: resIds } });
                    await Reservation.deleteMany({ _id: { $in: resIds } });
                }
                await Feedback.deleteMany({ garage: { $in: garageIds } });
                await Garage.deleteMany({ owner: user._id });
            }
        }
        await user.deleteOne();
        logger.info(`User ${req.params.id} permanently deleted by admin ${req.user.id}`);
        return res.status(200).json({ success: true, message: 'User permanently deleted' });
    } catch (error) { next(error); }
};

/**
 * Restore garage from trash
 */
export const restoreGarage = async (req, res, next) => {
    try {
        const Garage = (await import('../models/Garage.js')).default;
        const garage = await Garage.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found in trash' });
        return res.status(200).json({ success: true, message: 'Garage restored successfully' });
    } catch (error) { next(error); }
};

/**
 * Permanently delete garage from trash
 */
export const permanentDeleteGarage = async (req, res, next) => {
    try {
        const Garage = (await import('../models/Garage.js')).default;
        await Garage.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Garage permanently deleted' });
    } catch (error) { next(error); }
};

/**
 * Get analytics data for users, reservations, or revenue
 */
export const getAnalytics = async (req, res, next) => {
    try {
        const { type, period } = req.params; // type: users|reservations|revenue, period: week|month|year

        let startDate = new Date();
        let groupBy = {};
        let labels = [];

        // Determine date range and grouping based on period
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
            groupBy = { $dayOfWeek: '$createdAt' };
            labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        } else if (period === 'month') {
            startDate.setDate(startDate.getDate() - 30);
            groupBy = { $week: '$createdAt' };
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        } else if (period === 'year') {
            startDate.setMonth(startDate.getMonth() - 12);
            groupBy = { $month: '$createdAt' };
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid period. Use week, month, or year',
            });
        }

        let data = [];

        if (type === 'users') {
            const result = await User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: groupBy,
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            data = result.map((item) => ({
                label: labels[item._id - 1] || `Period ${item._id}`,
                count: item.count,
            }));
        } else if (type === 'reservations') {
            const result = await Reservation.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: groupBy,
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            data = result.map((item) => ({
                label: labels[item._id - 1] || `Period ${item._id}`,
                count: item.count,
            }));
        } else if (type === 'revenue') {
            const result = await Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: 'success',
                    },
                },
                {
                    $group: {
                        _id: groupBy,
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            data = result.map((item) => ({
                label: labels[item._id - 1] || `Period ${item._id}`,
                total: item.total,
            }));
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Use users, reservations, or revenue',
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        logger.error('Get analytics failed', { error: error.message });
        next(error);
    }
};

/**
 * Get performance insights (completion rate, customer satisfaction)
 */
export const getPerformanceInsights = async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // days
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));

        // Get reservations in period
        const reservations = await Reservation.find({
            createdAt: { $gte: daysAgo }
        });

        const totalReservations = reservations.length;
        const completedReservations = reservations.filter(r => r.status === 'completed').length;
        const completionRate = totalReservations > 0
            ? ((completedReservations / totalReservations) * 100).toFixed(1)
            : 0;

        // Get feedback/ratings in period
        const Feedback = (await import('../models/Feedback.js')).default;
        const feedbacks = await Feedback.find({
            createdAt: { $gte: daysAgo }
        });

        const totalFeedbacks = feedbacks.length;
        const averageRating = totalFeedbacks > 0
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
            : 0;

        // Customer satisfaction (percentage of 4+ star ratings)
        const satisfiedCustomers = feedbacks.filter(f => f.rating >= 4).length;
        const customerSatisfaction = totalFeedbacks > 0
            ? ((satisfiedCustomers / totalFeedbacks) * 100).toFixed(1)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                completionRate: parseFloat(completionRate),
                customerSatisfaction: parseFloat(customerSatisfaction),
                averageRating: parseFloat(averageRating),
                totalReservations,
                completedReservations,
                totalFeedbacks,
                period: parseInt(period)
            }
        });
    } catch (error) {
        logger.error('Get performance insights failed', { error: error.message });
        next(error);
    }
};

/**
 * Get pending garage verifications (admin only)
 */
export const getPendingGarages = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const Garage = (await import('../models/Garage.js')).default;

        // Show new pending garages AND approved garages needing re-review
        const query = {
            $or: [
                { verificationStatus: 'pending' },
                { verificationStatus: 'approved', needsReview: true },
            ],
            deletedAt: null,
        };

        const garages = await Garage.find(query)
            .populate('owner', 'name email phone username')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Garage.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: garages.length,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: garages,
        });
    } catch (error) {
        logger.error('Get pending garages failed', { error: error.message });
        next(error);
    }
};

/**
 * Approve garage license (admin only)
 */
export const approveGarage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const Garage = (await import('../models/Garage.js')).default;

        const garage = await Garage.findById(id).populate('owner');

        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found',
            });
        }

        // Update verification status
        garage.verificationStatus = 'approved';
        garage.isActive = true; // make visible in search
        garage.needsReview = false; // clear re-review flag
        garage.verificationDate = new Date();
        garage.verifiedBy = req.user.id;

        // Clear empty weekly schedule that would cause scheduler to close the garage
        if (garage.operatingHours?.weekly) {
            const hasValidSchedule = Object.values(garage.operatingHours.weekly).some(
                (d) => d && d.open === true && d.start && d.end
            );
            if (!hasValidSchedule) {
                garage.operatingHours = undefined;
            }
        }

        // Add to history
        garage.addVerificationHistory('approved', req.user.id);

        await garage.save();

        // Create notification for garage owner
        try {
            await createNotification({
                recipient: garage.owner._id || garage.owner,
                title: 'Garage Approved',
                message: `Your garage "${garage.name}" has been approved and is now live!`,
                type: 'garage_approved',
                actionUrl: '/my-garages',
            });
            logger.info(`Notification sent to garage owner ${garage.owner._id || garage.owner}`);
        } catch (notifError) {
            logger.error('Failed to create approval notification', { error: notifError.message });
        }

        logger.info(`Garage ${id} approved by admin ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Garage approved successfully',
            data: garage,
        });
    } catch (error) {
        logger.error('Approve garage failed', { error: error.message });
        next(error);
    }
};

/**
 * Reject garage license (admin only)
 */
export const rejectGarage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
        }

        const Garage = (await import('../models/Garage.js')).default;

        const garage = await Garage.findById(id).populate('owner');

        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found',
            });
        }

        // Update verification status
        garage.verificationStatus = 'rejected';
        garage.verificationDate = new Date();
        garage.verifiedBy = req.user.id;
        garage.rejectionReason = reason;

        // Add to history
        garage.addVerificationHistory('rejected', req.user.id, reason);

        await garage.save();

        // Create notification for garage owner
        try {
            await createNotification({
                recipient: garage.owner._id || garage.owner,
                title: 'Garage Rejected',
                message: `Your garage "${garage.name}" was rejected. Reason: ${reason}`,
                type: 'garage_rejected',
                actionUrl: '/my-garages',
            });
            logger.info(`Notification sent to garage owner ${garage.owner._id || garage.owner}`);
        } catch (notifError) {
            logger.error('Failed to create rejection notification', { error: notifError.message });
        }

        logger.info(`Garage ${id} rejected by admin ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Garage rejected',
            data: garage,
        });
    } catch (error) {
        logger.error('Reject garage failed', { error: error.message });
        next(error);
    }
};

/**
 * Get garage statistics (admin only)
 */
export const getGarageStats = async (req, res, next) => {
    try {
        const { garageId } = req.params;

        const [reservations, payments] = await Promise.all([
            Reservation.countDocuments({ garage: garageId }),
            Payment.find({
                reservation: {
                    $in: await Reservation.find({ garage: garageId }).distinct('_id')
                },
                status: 'success'
            }),
        ]);

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        return res.status(200).json({
            success: true,
            data: {
                reservationCount: reservations,
                totalRevenue,
            },
        });
    } catch (error) {
        logger.error('Get garage stats failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all reservations for a specific garage (admin only)
 */
export const getGarageReservations = async (req, res, next) => {
    try {
        const { garageId } = req.params;

        const reservations = await Reservation.find({ garage: garageId })
            .populate('user', 'name email phone')
            .populate('garage', 'name address')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: reservations,
        });
    } catch (error) {
        logger.error('Get garage reservations failed', { error: error.message });
        next(error);
    }
};

/**
 * Get commission payments summary per garage
 */
export const getCommissionPayments = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetYear = parseInt(year || now.getFullYear());
        const targetMonth = parseInt(month || now.getMonth() + 1);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        // Commission is auto-deducted — aggregate what was collected per garage
        const commissionData = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate, $lt: endDate },
                    garage: { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: '$garage',
                    totalRevenue: { $sum: '$amount' },
                    totalCommission: { $sum: '$commissionAmount' },
                    totalGarageEarnings: { $sum: '$garageEarnings' },
                    paymentCount: { $sum: 1 },
                    commissionNotified: { $first: '$metadata.commissionNotified' },
                    commissionTransactionRef: { $first: '$metadata.commissionTransactionRef' },
                    commissionReceiptUrl: { $first: '$metadata.commissionReceiptUrl' },
                    commissionPaymentMethod: { $first: '$metadata.commissionPaymentMethod' },
                    commissionNotifiedAt: { $first: '$metadata.commissionNotifiedAt' },
                }
            },
            {
                $lookup: {
                    from: 'garages',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'garage'
                }
            },
            { $unwind: '$garage' },
            {
                $project: {
                    garageId: '$_id',
                    garageName: '$garage.name',
                    totalRevenue: 1,
                    totalCommission: 1,
                    totalGarageEarnings: 1,
                    paymentCount: 1,
                    commissionRate: '$garage.commissionRate',
                    // Commission is always "collected" automatically — mark as paid
                    commissionPaid: true,
                    commissionPaidAt: null,
                    commissionNotified: { $ifNull: ['$commissionNotified', false] },
                    commissionTransactionRef: 1,
                    commissionReceiptUrl: 1,
                    commissionPaymentMethod: 1,
                    commissionNotifiedAt: 1,
                }
            },
            { $sort: { garageName: 1 } }
        ], { maxTimeMS: 10000 });

        const totalCommission = commissionData.reduce((s, g) => s + g.totalCommission, 0);

        res.json({
            success: true,
            data: {
                month: targetMonth,
                year: targetYear,
                autoCollected: true, // flag for frontend
                summary: commissionData,
                totalCommissionOwed: 0,       // nothing owed — auto-collected
                totalCommissionPaid: totalCommission,
            }
        });
    } catch (err) { next(err); }
};

/**
 * Mark commission as paid for a garage for a given month
 */
export const markCommissionPaid = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { month, year, paid } = req.body;
        const now = new Date();
        const targetYear = parseInt(year || now.getFullYear());
        const targetMonth = parseInt(month || now.getMonth() + 1);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        await Payment.updateMany(
            { garage: garageId, status: 'success', createdAt: { $gte: startDate, $lt: endDate } },
            { commissionPaid: paid !== false, commissionPaidAt: paid !== false ? new Date() : null }
        );

        res.json({ success: true, message: `Commission marked as ${paid !== false ? 'paid' : 'unpaid'}` });
    } catch (err) { next(err); }
};
/**
 * Send commission payment reminder to a garage owner (admin)
 */
export const sendCommissionReminder = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { month, year, commissionAmount } = req.body;
        const now = new Date();
        const targetYear = parseInt(year || now.getFullYear());
        const targetMonth = parseInt(month || now.getMonth() + 1);

        const monthName = new Date(targetYear, targetMonth - 1, 1)
            .toLocaleString('en-US', { month: 'long' });

        const Garage = (await import('../models/Garage.js')).default;
        const garage = await Garage.findById(garageId).populate('owner', '_id name');

        if (!garage) {
            return res.status(404).json({ success: false, message: 'Garage not found' });
        }

        await createNotification({
            recipient: garage.owner._id,
            title: '⚠️ Commission Payment Reminder',
            message: `Your commission of ETB ${Number(commissionAmount).toFixed(2)} for ${monthName} ${targetYear} is still unpaid. Please transfer it to the platform account as soon as possible to avoid service interruption.`,
            type: 'admin_action',
            actionUrl: '/earnings',
            priority: 'urgent',
            metadata: { garageId, month: targetMonth, year: targetYear, commissionAmount },
        });

        logger.info(`Commission reminder sent to garage owner ${garage.owner._id} for garage ${garageId}`);

        res.json({ success: true, message: `Reminder sent to ${garage.owner.name}` });
    } catch (err) {
        logger.error('Send commission reminder failed', { error: err.message });
        next(err);
    }
};

/**
 * Get all garages with pending/sent payout summary (admin)
 */
export const getPayouts = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetYear = parseInt(year) || now.getFullYear();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        const payoutData = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate, $lt: endDate },
                    garage: { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: '$garage',
                    totalRevenue: { $sum: '$amount' },
                    totalCommission: { $sum: '$commissionAmount' },
                    totalGarageEarnings: { $sum: '$garageEarnings' },
                    paymentCount: { $sum: 1 },
                    payoutSent: { $first: '$payoutSent' },
                    payoutSentAt: { $first: '$payoutSentAt' },
                }
            },
            {
                $lookup: {
                    from: 'garages',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'garage',
                    pipeline: [{ $project: { name: 1, owner: 1, bankAccounts: 1 } }],
                }
            },
            { $unwind: { path: '$garage', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'garage.owner',
                    foreignField: '_id',
                    as: 'owner',
                    pipeline: [{ $project: { name: 1, phone: 1 } }],
                }
            },
            { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    garageId: '$_id',
                    garageName: '$garage.name',
                    ownerName: '$owner.name',
                    ownerPhone: '$owner.phone',
                    bankAccounts: '$garage.bankAccounts',
                    totalRevenue: 1,
                    totalCommission: 1,
                    totalGarageEarnings: 1,
                    paymentCount: 1,
                    payoutSent: { $ifNull: ['$payoutSent', false] },
                    payoutSentAt: 1,
                }
            },
            { $sort: { payoutSent: 1, garageName: 1 } }
        ], { maxTimeMS: 15000 });

        res.json({
            success: true,
            data: {
                month: targetMonth,
                year: targetYear,
                payouts: payoutData,
                totalPending: payoutData.filter(p => !p.payoutSent).reduce((s, p) => s + p.totalGarageEarnings, 0),
                totalSent: payoutData.filter(p => p.payoutSent).reduce((s, p) => s + p.totalGarageEarnings, 0),
            }
        });
    } catch (err) {
        logger.error('Get payouts failed', { error: err.message, stack: err.stack });
        next(err);
    }
};

/**
 * Mark payout as sent to garage owner (admin)
 */
export const markPayoutSent = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { month, year, sent } = req.body;
        const now = new Date();
        const targetYear = parseInt(year || now.getFullYear());
        const targetMonth = parseInt(month || now.getMonth() + 1);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        await Payment.updateMany(
            { garage: garageId, status: 'success', createdAt: { $gte: startDate, $lt: endDate } },
            { payoutSent: sent !== false, payoutSentAt: sent !== false ? new Date() : null }
        );

        // Notify garage owner
        try {
            const Garage = (await import('../models/Garage.js')).default;
            const garage = await Garage.findById(garageId).populate('owner', '_id');
            if (garage?.owner) {
                await createNotification({
                    recipient: garage.owner._id,
                    title: sent !== false ? 'Earnings Acknowledged' : 'Earnings Review Pending',
                    message: sent !== false
                        ? `Admin has reviewed and acknowledged your earnings of ${targetMonth}/${targetYear}. Your 90% share is already in your wallet.`
                        : `Your earnings for ${targetMonth}/${targetYear} have been marked as pending review.`,
                    type: 'payment_received',
                    actionUrl: '/earnings',
                    priority: 'normal',
                });
            }
        } catch (notifErr) {
            logger.error('Failed to send payout notification', { error: notifErr.message });
        }

        res.json({ success: true, message: `Payout marked as ${sent !== false ? 'sent' : 'pending'}` });
    } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE PENALTY SYSTEM
// 3 components summed together:
//   1. Base penalty  — flat % of commission, applied once after grace period
//   2. Adjustment    — extra % if commission exceeds a threshold (larger = slightly more)
//   3. Daily accrual — small % per day overdue, capped at maxDailyDays
// ─────────────────────────────────────────────────────────────────────────────

/** Penalty config stored in process.env (persists for server lifetime) */
function getPenaltyConfig() {
    return {
        graceDays: parseInt(process.env.P_GRACE_DAYS || '5'),    // days before any penalty
        minCommission: parseFloat(process.env.P_MIN_COMMISSION || '100'), // ETB — below this, no penalty
        basePct: parseFloat(process.env.P_BASE_PCT || '0.05'),// 5% flat base
        adjustThreshold: parseFloat(process.env.P_ADJUST_THRESHOLD || '500'), // ETB 500
        adjustPct: parseFloat(process.env.P_ADJUST_PCT || '0.02'),// +2%
        dailyPct: parseFloat(process.env.P_DAILY_PCT || '0.003'),// 0.3% per day
        maxDailyDays: parseInt(process.env.P_MAX_DAILY_DAYS || '30'),  // cap at 30 days
    };
}

/**
 * Simple 3-part penalty calculation
 *   Returns { total:0, exempt:true } if commission < minCommission
 *   base       = commission × basePct          (applied once after grace)
 *   adjustment = commission × adjustPct        (only if commission ≥ adjustThreshold)
 *   daily      = commission × dailyPct × days  (capped at maxDailyDays)
 */
function calculatePenalty(commissionAmount, daysOverdue, cfg) {
    if (daysOverdue <= 0) return { total: 0, base: 0, adjustment: 0, daily: 0, exempt: false };
    // Below minimum commission → no penalty
    if (commissionAmount < cfg.minCommission) return { total: 0, base: 0, adjustment: 0, daily: 0, exempt: true };

    const base = parseFloat((commissionAmount * cfg.basePct).toFixed(2));
    const adjustment = commissionAmount >= cfg.adjustThreshold
        ? parseFloat((commissionAmount * cfg.adjustPct).toFixed(2))
        : 0;
    const effectiveDays = Math.min(daysOverdue, cfg.maxDailyDays);
    const daily = parseFloat((commissionAmount * cfg.dailyPct * effectiveDays).toFixed(2));
    const total = parseFloat((base + adjustment + daily).toFixed(2));

    return { total, base, adjustment, daily, exempt: false };
}

/**
 * Get penalty settings
 */
export const getPenaltySettings = async (req, res, next) => {
    try {
        const cfg = getPenaltyConfig();
        res.json({ success: true, data: cfg });
    } catch (err) { next(err); }
};

/**
 * Update penalty settings
 */
export const updatePenaltySettings = async (req, res, next) => {
    try {
        const { graceDays, minCommission, basePct, adjustThreshold, adjustPct, dailyPct, maxDailyDays } = req.body;
        const set = (key, val, isInt = false) => {
            const parsed = isInt ? parseInt(val) : parseFloat(val);
            if (!isNaN(parsed) && parsed >= 0) process.env[key] = String(parsed);
        };
        set('P_GRACE_DAYS', graceDays, true);
        set('P_MIN_COMMISSION', minCommission);
        set('P_BASE_PCT', basePct);
        set('P_ADJUST_THRESHOLD', adjustThreshold);
        set('P_ADJUST_PCT', adjustPct);
        set('P_DAILY_PCT', dailyPct);
        set('P_MAX_DAILY_DAYS', maxDailyDays, true);
        res.json({ success: true, message: 'Penalty settings updated', data: getPenaltyConfig() });
    } catch (err) { next(err); }
};

/**
 * Apply / recalculate penalty for a garage (admin)
 */
export const applyPenalty = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { month, year, reason } = req.body;
        const now = new Date();
        const targetYear = parseInt(year) || now.getFullYear();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        const mongoose = (await import('mongoose')).default;
        const agg = await Payment.aggregate([
            { $match: { garage: new mongoose.Types.ObjectId(garageId), status: 'success', createdAt: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalCommission: { $sum: '$commissionAmount' } } },
        ]);
        const totalCommission = agg[0]?.totalCommission || 0;

        // Due date = 5th of next month; days overdue from today
        const dueDate = new Date(targetYear, targetMonth, 5);
        const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

        const cfg = getPenaltyConfig();
        const { total, base, adjustment, daily, exempt } = calculatePenalty(totalCommission, daysOverdue, cfg);

        const garage = await Garage.findById(garageId).populate('owner', '_id name');
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });

        // Exempt: commission below minimum — skip penalty
        if (exempt) {
            return res.json({
                success: true,
                message: `No penalty applied — commission ETB ${totalCommission.toFixed(2)} is below the minimum ETB ${cfg.minCommission.toFixed(2)}`,
                data: { totalCommission, penaltyTotal: 0, daysOverdue, exempt: true, minCommission: cfg.minCommission },
            });
        }

        const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
        const isUpdate = garage.penalty?.applied;

        await Garage.findByIdAndUpdate(garageId, {
            $set: {
                'penalty.applied': true,
                'penalty.totalAmount': total,
                'penalty.daysOverdue': daysOverdue,
                'penalty.appliedAt': garage.penalty?.appliedAt || new Date(),
                'penalty.lastUpdatedAt': new Date(),
                'penalty.appliedBy': req.user.id,
                'penalty.month': targetMonth,
                'penalty.year': targetYear,
                'penalty.reason': reason || `Late commission for ${monthName} ${targetYear}`,
                'penalty.waived': false,
                'penalty.breakdown.base': base,
                'penalty.breakdown.adjustment': adjustment,
                'penalty.breakdown.daily': daily,
            },
            $push: {
                'penalty.history': {
                    event: isUpdate ? 'updated' : 'applied',
                    amount: total, daysOverdue,
                    note: reason || `${daysOverdue} days overdue`,
                    by: req.user.id, at: new Date(),
                },
            },
        });

        try {
            await createNotification({
                recipient: garage.owner._id,
                title: `🚨 Late Payment Penalty — ${garage.name}`,
                message: `Your commission of ETB ${totalCommission.toFixed(2)} for ${monthName} ${targetYear} is ${daysOverdue} day(s) overdue. A penalty of ETB ${total.toFixed(2)} has been applied. Total now owed: ETB ${(totalCommission + total).toFixed(2)}.`,
                type: 'admin_action',
                actionUrl: '/earnings',
                priority: daysOverdue > 20 ? 'urgent' : 'high',
                metadata: { garageId, month: targetMonth, year: targetYear, totalCommission, penaltyTotal: total, daysOverdue },
            });
        } catch (notifErr) {
            logger.error('Failed to send penalty notification', { error: notifErr.message });
        }

        logger.info(`Penalty ETB ${total} (${daysOverdue}d overdue) applied to garage ${garageId}`);
        res.json({
            success: true,
            message: `Penalty of ETB ${total.toFixed(2)} applied to "${garage.name}"`,
            data: { totalCommission, penaltyTotal: total, daysOverdue, exempt: false, minCommission: cfg.minCommission, breakdown: { base, adjustment, daily }, totalOwed: totalCommission + total },
        });
    } catch (err) {
        logger.error('Apply penalty failed', { error: err.message });
        next(err);
    }
};

/**
 * Recalculate penalty for all overdue garages (admin — bulk refresh)
 */
export const recalculatePenalties = async (req, res, next) => {
    try {
        const { month, year } = req.body;
        const now = new Date();
        const targetYear = parseInt(year) || now.getFullYear();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);

        const dueDate = new Date(targetYear, targetMonth, 5);
        const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

        if (daysOverdue <= 0) {
            return res.json({ success: true, message: 'Not yet overdue — no penalties to recalculate', updated: 0 });
        }

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);
        const cfg = getPenaltyConfig();

        const mongoose = (await import('mongoose')).default;
        const commissionData = await Payment.aggregate([
            { $match: { status: 'success', createdAt: { $gte: startDate, $lt: endDate }, garage: { $exists: true, $ne: null } } },
            { $group: { _id: '$garage', totalCommission: { $sum: '$commissionAmount' }, commissionPaid: { $first: '$commissionPaid' } } },
            { $match: { commissionPaid: { $ne: true } } },
        ]);

        let updated = 0;
        for (const row of commissionData) {
            const { total, base, adjustment, daily } = calculatePenalty(row.totalCommission, daysOverdue, cfg);
            if (total <= 0) continue;
            await Garage.findByIdAndUpdate(row._id, {
                $set: {
                    'penalty.applied': true,
                    'penalty.totalAmount': total,
                    'penalty.daysOverdue': daysOverdue,
                    'penalty.lastUpdatedAt': new Date(),
                    'penalty.month': targetMonth,
                    'penalty.year': targetYear,
                    'penalty.breakdown.base': base,
                    'penalty.breakdown.adjustment': adjustment,
                    'penalty.breakdown.daily': daily,
                },
                $push: { 'penalty.history': { event: 'updated', amount: total, daysOverdue, note: 'Auto-recalculated', at: new Date() } },
            });
            updated++;
        }

        logger.info(`Bulk penalty recalculation: ${updated} garages updated for ${targetMonth}/${targetYear}`);
        res.json({ success: true, message: `Recalculated penalties for ${updated} garage(s)`, updated, daysOverdue });
    } catch (err) {
        logger.error('Recalculate penalties failed', { error: err.message });
        next(err);
    }
};

/**
 * Remove/waive penalty for a garage (admin)
 */
export const removePenalty = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { reason } = req.body;

        const garage = await Garage.findById(garageId).populate('owner', '_id name');
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });

        await Garage.findByIdAndUpdate(garageId, {
            $set: {
                'penalty.applied': false,
                'penalty.totalAmount': 0,
                'penalty.tier': 'none',
                'penalty.waived': true,
                'penalty.waivedAt': new Date(),
                'penalty.waivedBy': req.user.id,
            },
            $push: {
                'penalty.history': {
                    event: 'waived',
                    tier: 'none',
                    amount: 0,
                    daysOverdue: garage.penalty?.daysOverdue || 0,
                    note: reason || 'Waived by admin',
                    by: req.user.id,
                    at: new Date(),
                },
            },
        });

        try {
            await createNotification({
                recipient: garage.owner._id,
                title: '✅ Penalty Waived',
                message: `The late payment penalty on your garage "${garage.name}" has been waived by the admin.${reason ? ` Reason: ${reason}` : ''}`,
                type: 'admin_action',
                actionUrl: '/earnings',
                priority: 'normal',
            });
        } catch (notifErr) {
            logger.error('Failed to send penalty waive notification', { error: notifErr.message });
        }

        logger.info(`Penalty waived for garage ${garageId} by admin ${req.user.id}`);
        res.json({ success: true, message: `Penalty waived for "${garage.name}"` });
    } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM ACCOUNTS (editable by admin, persisted in DB)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNTS = [
    { key: 'cbe', bank: 'Commercial Bank of Ethiopia (CBE)', accountNo: '1000299474128', accountName: 'Smart Garaging Platform', branch: 'Addis Ababa Main Branch', icon: '🏦', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'abyssinia', bank: 'Bank of Abyssinia', accountNo: '2000299237658', accountName: 'Smart Garaging Platform', branch: 'Bole Branch', icon: '🏦', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'telebirr', bank: 'Telebirr', accountNo: '+251934532216', accountName: 'Smart Garaging Platform', branch: '', icon: '📱', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
];

export const getPlatformAccounts = async (req, res, next) => {
    try {
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        let settings = await PlatformSettings.findOne({ singleton: 'main' });
        if (!settings || settings.platformAccounts.length === 0) {
            settings = await PlatformSettings.findOneAndUpdate(
                { singleton: 'main' },
                { $setOnInsert: { platformAccounts: DEFAULT_ACCOUNTS } },
                { upsert: true, new: true }
            );
        }
        res.json({
            success: true, data: {
                platformAccounts: settings.platformAccounts,
                registrationFee: settings.registrationFee ?? 500,
                depositPercent: settings.depositPercent ?? 20,
            }
        });
    } catch (err) { next(err); }
};

export const updatePlatformAccounts = async (req, res, next) => {
    try {
        const { accounts, registrationFee, depositPercent } = req.body;
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const update = {};
        if (Array.isArray(accounts)) update.platformAccounts = accounts;
        if (registrationFee !== undefined) update.registrationFee = Number(registrationFee);
        if (depositPercent !== undefined) update.depositPercent = Number(depositPercent);
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }
        const settings = await PlatformSettings.findOneAndUpdate(
            { singleton: 'main' },
            update,
            { upsert: true, new: true }
        );
        logger.info(`Platform settings updated by admin ${req.user.id}`);
        res.json({
            success: true, message: 'Platform settings updated', data: {
                platformAccounts: settings.platformAccounts,
                registrationFee: settings.registrationFee,
                depositPercent: settings.depositPercent,
            }
        });
    } catch (err) { next(err); }
};

export const getCommissionSettings = async (req, res, next) => {
    try {
        const defaultRate = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0');
        const garages = await Garage.find({}, 'name commissionRate isApproved').sort({ name: 1 });
        res.json({
            success: true,
            data: {
                defaultRate,
                garages: garages.map(g => ({
                    _id: g._id,
                    name: g.name,
                    commissionRate: typeof g.commissionRate === 'number' ? g.commissionRate : defaultRate,
                    isApproved: g.isApproved,
                })),
            },
        });
    } catch (err) { next(err); }
};

/**
 * Set the default platform commission rate
 */
export const setDefaultCommission = async (req, res, next) => {
    try {
        const { rate } = req.body;
        const parsed = parseFloat(rate);
        if (isNaN(parsed) || parsed < 0 || parsed > 1) {
            return res.status(400).json({ success: false, message: 'Rate must be between 0 and 1 (e.g. 0.1 = 10%)' });
        }
        const oldDefault = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0');
        await Garage.updateMany({ commissionRate: oldDefault }, { commissionRate: parsed });
        process.env.DEFAULT_COMMISSION_RATE = String(parsed);
        res.json({ success: true, message: `Default commission set to ${(parsed * 100).toFixed(1)}%`, data: { defaultRate: parsed } });
    } catch (err) { next(err); }
};

/**
 * Set commission rate for a specific garage
 */
export const setGarageCommission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rate } = req.body;
        const parsed = parseFloat(rate);
        if (isNaN(parsed) || parsed < 0 || parsed > 1) {
            return res.status(400).json({ success: false, message: 'Rate must be between 0 and 1 (e.g. 0.1 = 10%)' });
        }
        const garage = await Garage.findByIdAndUpdate(id, { commissionRate: parsed }, { new: true });
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, message: `Commission for "${garage.name}" set to ${(parsed * 100).toFixed(1)}%`, data: { _id: garage._id, name: garage.name, commissionRate: parsed } });
    } catch (err) { next(err); }
};

/**
 * Get pending registration fee submissions
 */
/**
 * Get agreement text
 */
export const getAgreement = async (req, res, next) => {
    try {
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const settings = await PlatformSettings.findOne({ singleton: 'main' });
        return res.json({ success: true, data: settings?.agreement || { content: '', version: 1 } });
    } catch (err) { next(err); }
};

/**
 * Update agreement text (admin only)
 */
export const updateAgreement = async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ success: false, message: 'Agreement content is required' });
        const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
        const current = await PlatformSettings.findOne({ singleton: 'main' });
        const newVersion = (current?.agreement?.version || 1) + 1;
        const settings = await PlatformSettings.findOneAndUpdate(
            { singleton: 'main' },
            { agreement: { content: content.trim(), version: newVersion, updatedAt: new Date(), updatedBy: req.user.id } },
            { upsert: true, new: true }
        );
        logger.info(`Agreement updated to v${newVersion} by admin ${req.user.id}`);
        return res.json({ success: true, message: `Agreement updated (v${newVersion})`, data: settings.agreement });
    } catch (err) { next(err); }
};

export const getPendingFees = async (req, res, next) => {
    try {
        const users = await User.find({
            role: 'garage_owner',
            registrationFeePaid: { $ne: true }, // exclude already paid
            deletedAt: null,
            $or: [
                // Manual payments waiting for admin approval
                {
                    'registrationFeeSubmission.status': 'pending',
                    'registrationFeeSubmission.submittedAt': { $exists: true, $ne: null },
                },
                // Chapa payments that may need manual verification
                {
                    'registrationFeeSubmission.status': 'chapa_pending',
                    'registrationFeeSubmission.submittedAt': { $exists: true, $ne: null },
                },
            ],
        }).select('name username phone email registrationFeePaid registrationFeeSubmission createdAt');
        return res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

/**
 * Approve registration fee payment
 */
export const approveFee = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                registrationFeePaid: true,
                registrationFeePaidAt: new Date(),
                'registrationFeeSubmission.status': 'approved',
                'registrationFeeSubmission.reviewedBy': req.user.id,
                'registrationFeeSubmission.reviewedAt': new Date(),
            },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        // Notify garage owner
        await createNotification({
            recipient: user._id,
            title: '✅ Registration Fee Approved',
            message: 'Your registration fee payment has been verified. You can now add your garage!',
            type: 'system_announcement',
            actionUrl: '/add-garage',
        });
        logger.info(`Registration fee approved for user ${req.params.userId} by admin ${req.user.id}`);
        return res.json({ success: true, message: 'Fee approved. User can now add garages.' });
    } catch (error) { next(error); }
};

/**
 * Reject registration fee payment
 */
export const rejectFee = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                'registrationFeeSubmission.status': 'rejected',
                'registrationFeeSubmission.reviewedBy': req.user.id,
                'registrationFeeSubmission.reviewedAt': new Date(),
                'registrationFeeSubmission.rejectionReason': reason || 'Payment could not be verified',
            },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await createNotification({
            recipient: user._id,
            title: '❌ Registration Fee Rejected',
            message: `Your payment was rejected: ${reason || 'Payment could not be verified'}. Please resubmit with correct details.`,
            type: 'system_announcement',
            actionUrl: '/registration-fee',
        });
        logger.info(`Registration fee rejected for user ${req.params.userId} by admin ${req.user.id}`);
        return res.json({ success: true, message: 'Fee rejected. User notified.' });
    } catch (error) { next(error); }
};

export default {
    getSystemStats, getAllUsers, updateUserStatus, changeUserRole, deleteUser, deleteGarage,
    getTrash, restoreUser, permanentDeleteUser, restoreGarage, permanentDeleteGarage,
    getPendingFees, approveFee, rejectFee,
    getAnalytics, getPerformanceInsights, getPendingGarages, approveGarage, rejectGarage,
    getGarageStats, getGarageReservations, getCommissionSettings, setDefaultCommission,
    setGarageCommission, getCommissionPayments, markCommissionPaid, getPayouts, markPayoutSent,
    sendCommissionReminder, getPenaltySettings, updatePenaltySettings,
    applyPenalty, recalculatePenalties, removePenalty,
    getPlatformAccounts, updatePlatformAccounts, getAgreement, updateAgreement,
};
