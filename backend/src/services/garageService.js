// src/services/garageService.js
import Garage from '../models/Garage.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/customErrors.js'; // create this if not exists

class GarageService {
    /**
     * Register a new garage
     * @param {Object} data - Garage data including owner ID
     * @returns {Promise<Garage>} Created garage document
     * @throws {BadRequestError} If validation fails
     */
    async registerGarage(data) {
        try {
            // Optional: extra validation beyond schema
            if (!data.location?.coordinates || data.location.coordinates.length !== 2) {
                throw new BadRequestError('Location coordinates are required [lng, lat]');
            }

            const garage = await Garage.create(data);

            logger.info('New garage registered', {
                garageId: garage._id,
                name: garage.name,
                ownerId: data.owner,
                location: garage.location.coordinates,
            });

            return garage;
        } catch (error) {
            logger.error('Garage registration failed', { error: error.message, data });
            throw error instanceof BadRequestError ? error : new Error('Failed to register garage');
        }
    }

    /**
     * Get all garages owned by a specific owner
     * @param {string} ownerId - User ID of the garage owner
     * @param {Object} [options] - Pagination & sorting options
     * @returns {Promise<{garages: Array, count: number}>}
     */
    async getGaragesByOwner(ownerId, options = {}) {
        try {
            const { page = 1, limit = 10, sort = '-createdAt' } = options;

            const garages = await Garage.find({ owner: ownerId })
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('owner', 'name email'); // optional population

            const total = await Garage.countDocuments({ owner: ownerId });

            logger.info(`Fetched garages for owner ${ownerId}`, {
                count: garages.length,
                total,
                page,
                limit,
            });

            return {
                garages,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / limit),
                    limit: Number(limit),
                },
            };
        } catch (error) {
            logger.error('Failed to fetch owner garages', { ownerId, error: error.message });
            throw error;
        }
    }

    /**
     * Update a garage (owner only)
     * @param {string} garageId
     * @param {Object} data - Fields to update
     * @param {string} ownerId - Must match garage owner
     * @returns {Promise<Garage>} Updated garage
     * @throws {NotFoundError} If garage not found or not owned
     */
    async updateGarage(garageId, data, ownerId) {
        try {
            const garage = await Garage.findOne({ _id: garageId, owner: ownerId });

            if (!garage) {
                throw new NotFoundError('Garage not found or you are not the owner');
            }

            // Prevent updating owner or _id
            delete data.owner;
            delete data._id;

            Object.assign(garage, data);
            await garage.save();

            logger.info(`Garage updated`, {
                garageId,
                ownerId,
                updatedFields: Object.keys(data),
            });

            return garage;
        } catch (error) {
            logger.error('Garage update failed', { garageId, ownerId, error: error.message });
            throw error;
        }
    }

    /**
     * Search nearby garages (used by car owners)
     * @param {Object} params
     * @param {Object} params.location - { lng, lat }
     * @param {string} [params.vehicleType]
     * @param {string} [params.date]
     * @param {string} [params.time]
     * @param {number} [params.radius=10] - km
     * @returns {Promise<Array>} Matching garages
     */
    async searchNearby({ location, vehicleType, date, time, radius = 10 }) {
        try {
            if (!location?.lng || !location?.lat) {
                throw new BadRequestError('Location (lng, lat) is required for nearby search');
            }

            const query = {
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
                        $maxDistance: radius * 1000, // km → meters
                    },
                },
                availableSlots: { $gt: 0 },
            };

            if (vehicleType) {
                query.vehicleType = vehicleType; // assuming you add this field later
            }

            // TODO: add date/time availability logic (separate service)

            const garages = await Garage.find(query)
                .limit(20)
                .select('name location address pricePerHour availableSlots amenities rating');

            logger.info('Nearby garage search', {
                lat: location.lat,
                lng: location.lng,
                radius,
                results: garages.length,
            });

            return garages;
        } catch (error) {
            logger.error('Nearby garage search failed', { error: error.message, params });
            throw error;
        }
    }
}

// Export as singleton
export default new GarageService();