// src/services/reservationService.js
import Reservation from '../models/Reservation.js';
import matchingService from './matchingService.js';
import logger from '../utils/logger.js';

// Custom errors (create these in utils/customErrors.js if not exist)
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError';
        this.statusCode = 400;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

class ReservationService {
    /**
     * Create a new reservation (car_owner only)
     * @param {Object} data - Reservation data (garageId optional)
     * @param {Object} user - Authenticated user object
     * @returns {Promise<Reservation>} Created reservation
     */
    async createReservation(data, user) {
        try {
            if (!user || user.role !== 'car_owner') {
                throw new ForbiddenError('Only car owners can create reservations');
            }

            let garageId = data.garageId;
            let totalPrice = data.totalPrice;

            // Smart matching if no garageId provided
            if (!garageId) {
                if (!data.preferredLocation || !data.vehicleId || !data.startTime) {
                    throw new BadRequestError('Preferred location, vehicle and start time required for smart matching');
                }

                const match = await matchingService.findBestGarage({
                    vehicleId: data.vehicleId,
                    preferredLocation: data.preferredLocation,
                    date: data.startTime,
                });

                garageId = match.garageId;
                totalPrice = match.estimatedPrice;
            }

            // Basic overlap check (improve later with real availability)
            const overlapping = await Reservation.findOne({
                garage: garageId,
                status: { $nin: ['cancelled', 'completed'] },
                $or: [
                    { startTime: { $lt: new Date(data.endTime) }, endTime: { $gt: new Date(data.startTime) } },
                ],
            });

            if (overlapping) {
                throw new BadRequestError('This time slot is already reserved for the selected garage');
            }

            const reservation = await Reservation.create({
                ...data,
                user: user._id || user.id,
                garage: garageId,
                totalPrice: totalPrice || 0,
            });

            logger.info('Reservation created', {
                reservationId: reservation._id,
                userId: user._id || user.id,
                garageId,
                startTime: data.startTime,
                endTime: data.endTime,
            });

            return reservation;
        } catch (error) {
            logger.error('Reservation creation failed', {
                userId: user?._id || user?.id,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Get paginated reservations for the current user
     * @param {string} userId
     * @param {Object} filters - { page, limit, status, startDate, endDate }
     * @returns {Promise<{reservations: Array, pagination: Object}>}
     */
    async getUserReservations(userId, filters = {}) {
        try {
            const { page = 1, limit = 10, status, startDate, endDate } = filters;

            const query = { user: userId };

            if (status) query.status = status;
            if (startDate) query.startTime = { $gte: new Date(startDate) };
            if (endDate) query.endTime = { $lte: new Date(endDate) };

            const reservations = await Reservation.find(query)
                .populate('garage', 'name address location')
                .populate('vehicle', 'name plateNumber')
                .sort({ startTime: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            const total = await Reservation.countDocuments(query);

            logger.info('Fetched user reservations', {
                userId,
                count: reservations.length,
                total,
                page,
                limit,
            });

            return {
                reservations,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / limit),
                    limit: Number(limit),
                },
            };
        } catch (error) {
            logger.error('Get user reservations failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get single reservation details (owner or admin)
     * @param {string} reservationId
     * @param {Object} user - Authenticated user
     * @returns {Promise<Reservation>}
     */
    async getById(reservationId, user) {
        try {
            const reservation = await Reservation.findById(reservationId)
                .populate('garage', 'name address location')
                .populate('vehicle', 'name plateNumber');

            if (!reservation) {
                throw new NotFoundError('Reservation not found');
            }

            if (reservation.user.toString() !== user.id && user.role !== 'admin') {
                throw new ForbiddenError('Unauthorized to view this reservation');
            }

            logger.info('Reservation details viewed', {
                reservationId,
                userId: user.id,
                role: user.role,
            });

            return reservation;
        } catch (error) {
            logger.error('Get reservation by ID failed', { reservationId, userId: user.id, error: error.message });
            throw error;
        }
    }

    /**
     * Cancel reservation (owner only)
     * @param {string} reservationId
     * @param {string} userId
     */
    async cancelReservation(reservationId, userId) {
        try {
            const reservation = await Reservation.findById(reservationId);

            if (!reservation) {
                throw new NotFoundError('Reservation not found');
            }

            if (reservation.user.toString() !== userId) {
                throw new ForbiddenError('Only the owner can cancel this reservation');
            }

            if (['completed', 'cancelled'].includes(reservation.status)) {
                throw new BadRequestError('Cannot cancel a completed or already cancelled reservation');
            }

            reservation.status = 'cancelled';
            await reservation.save();

            logger.info('Reservation cancelled', {
                reservationId,
                userId,
                previousStatus: reservation.status,
            });
        } catch (error) {
            logger.error('Cancel reservation failed', { reservationId, userId, error: error.message });
            throw error;
        }
    }
}

// Export as singleton instance
export default new ReservationService();