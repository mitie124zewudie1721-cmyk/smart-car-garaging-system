// src/utils/geoUtils.js
const logger = require('./logger');

/**
 * Haversine formula - calculate distance between two lat/lng points in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 2 decimal places
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Validate lat/lng coordinates
 */
function isValidCoordinates(lat, lng) {
    const latValid = typeof lat === 'number' && lat >= -90 && lat <= 90;
    const lngValid = typeof lng === 'number' && lng >= -180 && lng <= 180;

    if (!latValid || !lngValid) {
        logger.warn(`Invalid coordinates: lat=${lat}, lng=${lng}`);
        return false;
    }
    return true;
}

/**
 * Convert coordinates to GeoJSON Point format (used in MongoDB)
 */
function toGeoJSONPoint(lng, lat) {
    if (!isValidCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates');
    }
    return {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON uses [longitude, latitude]
    };
}

module.exports = {
    calculateDistance,
    isValidCoordinates,
    toGeoJSONPoint,
};