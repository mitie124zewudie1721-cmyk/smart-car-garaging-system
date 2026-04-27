// src/controllers/locationController.js
import Location from '../models/Location.js';
import Reservation from '../models/Reservation.js';
import logger from '../utils/logger.js';

/**
 * Update current location during an active reservation
 * (called by car owner app periodically)
 */
export const updateReservationLocation = async (req, res, next) => {
    try {
        const { reservationId } = req.params;
        const { lat, lng, accuracy } = req.body;

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Only owner can update location
        if (reservation.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this reservation location',
            });
        }

        // Check if reservation is active
        if (!['active', 'confirmed'].includes(reservation.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update location for non-active reservation',
            });
        }

        const location = await Location.create({
            reservation: reservationId,
            coordinates: [lng, lat],
            accuracy,
        });

        logger.info(`Location updated for reservation ${reservationId} by user ${req.user.id}`);

        return res.status(201).json({
            success: true,
            message: 'Location updated successfully',
            data: location,
        });
    } catch (error) {
        logger.error('Location update failed', { error: error.message });
        next(error);
    }
};

/**
 * Get location tracking history for a reservation
 * (owner or admin)
 */
export const getReservationTracking = async (req, res, next) => {
    try {
        const { reservationId } = req.params;
        const { limit = 20 } = req.query;

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Only owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this tracking history',
            });
        }

        const locations = await Location.find({ reservation: reservationId })
            .sort({ timestamp: -1 })
            .limit(Number(limit));

        return res.status(200).json({
            success: true,
            count: locations.length,
            data: locations,
        });
    } catch (error) {
        logger.error('Get reservation tracking failed', { error: error.message });
        next(error);
    }
};

/**
 * Find nearby garages (public route, used by car owners)
 */
export const findNearbyGarages = async (req, res, next) => {
    try {
        const { lat, lng, radius = 10 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }

        const coordinates = [parseFloat(lng), parseFloat(lat)];

        const garages = await mongoose.model('Garage').find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: parseFloat(radius) * 1000, // km → meters
                },
            },
            availableSlots: { $gt: 0 },
        }).limit(20);

        return res.status(200).json({
            success: true,
            count: garages.length,
            data: garages,
        });
    } catch (error) {
        logger.error('Nearby garages search failed', { error: error.message });
        next(error);
    }
};

export default {
    updateReservationLocation,
    getReservationTracking,
    findNearbyGarages,
};