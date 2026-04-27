// src/services/matchingService.js
const Garage = require('../models/Garage');
const Vehicle = require('../models/Vehicle');
const logger = require('../utils/logger');

class MatchingService {
    /**
     * Core smart matching algorithm
     * Factors: vehicle size, proximity, price, amenities, availability
     * @param {Object} params
     * @param {string} params.vehicleId
     * @param {Object} params.preferredLocation { lat: number, lng: number }
     * @param {Date|string} params.date - preferred date/time (optional)
     */
    async findBestGarage({ vehicleId, preferredLocation, date }) {
        try {
            // Validate input
            if (!vehicleId || !preferredLocation?.lat || !preferredLocation?.lng) {
                throw new Error('Vehicle ID and preferred location are required');
            }

            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            // Convert preferred location to GeoJSON Point
            const geoPoint = {
                type: 'Point',
                coordinates: [preferredLocation.lng, preferredLocation.lat],
            };

            // Find garages within reasonable radius (20km)
            const garages = await Garage.find({
                location: {
                    $near: {
                        $geometry: geoPoint,
                        $maxDistance: 20000, // 20km
                    },
                },
                // Basic availability check (can be improved with real calendar later)
                availableSlots: { $gt: 0 },
            }).limit(50);

            if (!garages.length) {
                throw new Error('No garages found nearby');
            }

            // Scoring system (0-100)
            const scored = garages.map((garage) => {
                let score = 0;
                let scoreBreakdown = {};

                // 1. Distance score (closer = higher) - max 50 points
                const distanceKm = this.calculateDistance(
                    preferredLocation.lat,
                    preferredLocation.lng,
                    garage.location.coordinates[1],
                    garage.location.coordinates[0]
                );

                const distanceScore = Math.max(0, 50 - distanceKm * 2);
                score += distanceScore;
                scoreBreakdown.distance = { km: distanceKm.toFixed(2), score: distanceScore };

                // 2. Price score (cheaper = higher) - max 30 points
                const priceScore = Math.max(0, 30 - (garage.pricePerHour / 50) * 30);
                score += priceScore;
                scoreBreakdown.price = { perHour: garage.pricePerHour, score: priceScore };

                // 3. Vehicle fit score (size compatibility) - max 20 points
                let fitScore = 0;
                if (vehicle.sizeCategory === 'extra_large' && garage.capacity >= 4) fitScore = 20;
                else if (vehicle.sizeCategory === 'large' && garage.capacity >= 3) fitScore = 15;
                else if (garage.capacity >= 1) fitScore = 10;
                score += fitScore;
                scoreBreakdown.fit = { score: fitScore };

                // 4. Amenities bonus - max 20 points (example)
                const requiredAmenities = ['secure', '24h']; // customize as needed
                const matchingAmenities = garage.amenities.filter(a => requiredAmenities.includes(a));
                const amenitiesScore = matchingAmenities.length * 5;
                score += amenitiesScore;
                scoreBreakdown.amenities = { count: matchingAmenities.length, score: amenitiesScore };

                return { garage, score, scoreBreakdown };
            });

            // Sort by total score descending
            scored.sort((a, b) => b.score - a.score);

            const best = scored[0];

            logger.info(`Best garage match: ${best.garage.name} (score: ${best.score})`);

            return {
                garageId: best.garage._id,
                garageName: best.garage.name,
                estimatedPrice: best.garage.pricePerHour * 2, // example 2 hours - customize
                distanceKm: best.scoreBreakdown.distance.km,
                score: best.score,
                scoreBreakdown: best.scoreBreakdown, // useful for debugging / UI
            };
        } catch (err) {
            logger.error(`Matching failed: ${err.message}`, { vehicleId, preferredLocation });
            throw err;
        }
    }

    /**
     * Haversine distance calculation (in km)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // invalid coords

        const R = 6371; // Earth radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = new MatchingService();