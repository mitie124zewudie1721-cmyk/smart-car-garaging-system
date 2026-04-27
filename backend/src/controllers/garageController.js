// src/controllers/garageController.js
import Garage from '../models/Garage.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { createNotification } from './notificationController.js';

// Helper: notify all admins
const notifyAdmins = async ({ title, message, type, actionUrl }) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        await Promise.all(admins.map(admin =>
            createNotification({ recipient: admin._id, title, message, type, actionUrl, priority: 'high' })
        ));
    } catch (err) {
        logger.error('Failed to notify admins', { error: err.message });
    }
};

/**
 * Register a new garage (garage_owner only)
 * IMPORTANT: Garage starts with 'pending' verification status
 * and cannot receive bookings until admin approves
 */
export const registerGarage = async (req, res, next) => {
    try {
        const data = req.body;

        // Parse JSON-stringified nested objects sent via FormData
        ['location', 'contact', 'services', 'operatingHours', 'bankAccounts', 'amenities', 'paymentMethods'].forEach(f => {
            if (data[f] && typeof data[f] === 'string') {
                try { data[f] = JSON.parse(data[f]); } catch { /* ignore */ }
            }
        });
        // Parse numeric fields
        if (data.capacity) data.capacity = Number(data.capacity);
        if (data.pricePerHour) data.pricePerHour = Number(data.pricePerHour);
        if (data.commissionRate) data.commissionRate = Number(data.commissionRate);
        if (data.depositPercent !== undefined) data.depositPercent = Number(data.depositPercent);

        data.owner = req.user.id; // Attach authenticated user as owner

        // Validate coordinates are within Jimma city bounds
        const coords = data.location?.coordinates;
        if (coords) {
            const [lng, lat] = coords;
            if (lat < 7.55 || lat > 7.80 || lng < 36.75 || lng > 36.95) {
                return res.status(400).json({
                    success: false,
                    message: 'Garage location must be within Jimma city (lat: 7.55–7.80, lng: 36.75–36.95)',
                });
            }
        }

        // CRITICAL: Set verification status to 'pending'
        // Garage cannot receive bookings until admin approves
        data.verificationStatus = 'pending';

        // Handle license number
        if (req.body.licenseNumber) {
            data.licenseNumber = req.body.licenseNumber.trim();
        }

        // Handle uploaded license image/document
        if (req.file) {
            data.licenseDocument = {
                path: `/uploads/licenses/${req.file.filename}`,
                originalFilename: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                uploadedAt: new Date(),
            };
        }

        const garage = await Garage.create(data);

        logger.info(`New garage registered: ${garage.name} by user ${req.user.id} - Status: PENDING verification`);

        // Notify all admins about new garage registration
        await notifyAdmins({
            title: 'New Garage Awaiting Approval',
            message: `"${garage.name}" has been registered and is waiting for your verification.`,
            type: 'garage_pending',
            actionUrl: '/admin/garage-verification',
        });

        return res.status(201).json({
            success: true,
            message: 'Garage registered successfully. Your garage is pending admin verification and cannot receive bookings until approved.',
            data: garage,
        });
    } catch (error) {
        logger.error('Garage registration failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all garages owned by the current garage_owner
 */
export const getMyGarages = async (req, res, next) => {
    try {
        const garages = await Garage.find({ owner: req.user.id, deletedAt: null }).maxTimeMS(10000);
        return res.status(200).json({
            success: true,
            count: garages.length,
            data: garages,
        });
    } catch (error) {
        logger.error('Get my garages failed', { error: error.message });
        next(error);
    }
};

/**
 * Get a single garage by ID (owner or admin)
 */
export const getGarageById = async (req, res, next) => {
    try {
        let garage;

        // Admins and car owners can view any garage
        // Garage owners can only view their own garages
        if (req.user.role === 'admin' || req.user.role === 'car_owner') {
            garage = await Garage.findById(req.params.id)
                .populate('owner', 'name email phone');
        } else {
            garage = await Garage.findOne({
                _id: req.params.id,
                owner: req.user.id,
            });
        }

        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: garage,
        });
    } catch (error) {
        logger.error('Get garage by ID failed', { error: error.message });
        next(error);
    }
};

/**
 * Update a garage (owner only)
 */
export const updateGarage = async (req, res, next) => {
    try {
        const garage = await Garage.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });
        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found or you are not the owner',
            });
        }
        // Update only provided fields
        const wasApproved = garage.verificationStatus === 'approved';

        // Parse nested JSON fields sent via FormData
        const body = req.body;

        // Parse JSON-stringified fields from FormData first
        ['location', 'contact', 'services', 'operatingHours', 'bankAccounts', 'amenities', 'paymentMethods'].forEach(f => {
            if (body[f] !== undefined && typeof body[f] === 'string') {
                try { body[f] = JSON.parse(body[f]); } catch { /* ignore */ }
            }
        });
        if (body.capacity) body.capacity = Number(body.capacity);
        if (body.pricePerHour) body.pricePerHour = Number(body.pricePerHour);
        if (body.commissionRate) body.commissionRate = Number(body.commissionRate);
        if (body.depositPercent !== undefined) body.depositPercent = Number(body.depositPercent);

        const fieldsToUpdate = ['name', 'description', 'capacity', 'pricePerHour', 'amenities', 'paymentMethods', 'commissionRate', 'depositPercent', 'location', 'contact', 'services', 'operatingHours', 'bankAccounts'];
        fieldsToUpdate.forEach(f => { if (body[f] !== undefined) garage[f] = body[f]; });

        // Handle license number
        if (body.licenseNumber !== undefined) {
            garage.licenseNumber = body.licenseNumber.trim() || undefined;
        }

        // Handle uploaded license file
        if (req.file) {
            garage.licenseDocument = {
                path: `/uploads/licenses/${req.file.filename}`,
                originalFilename: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                uploadedAt: new Date(),
            };
        }
        // Keep approved garages visible but flag as needing re-review
        // Only new garages start as pending; edits keep approved status
        if (wasApproved) {
            garage.verificationStatus = 'approved'; // stay visible
            garage.needsReview = true; // flag for admin attention
        } else {
            garage.verificationStatus = 'pending';
        }
        garage.addVerificationHistory('pending', req.user.id, 'Owner edited garage, awaiting re-approval');

        await garage.save();
        logger.info(`Garage updated and marked pending: ${garage._id} by user ${req.user.id}`);

        // Notify all admins that a garage was edited and needs re-approval
        await notifyAdmins({
            title: 'Garage Updated — Re-approval Required',
            message: `Garage owner updated "${garage.name}". Please review and approve or reject the changes.`,
            type: 'garage_pending',
            actionUrl: '/admin/garage-verification',
        });

        return res.status(200).json({
            success: true,
            message: 'Garage updated successfully. Your changes are pending admin approval.',
            data: garage,
        });
    } catch (error) {
        logger.error('Garage update failed', { error: error.message });
        next(error);
    }
};

/**
 * Search nearby garages (public route - used by car owners)
 * NOW READS FROM req.body (matches POST route)
 * IMPORTANT: Only returns APPROVED garages
 */
export const searchGarages = async (req, res, next) => {
    try {
        const { lat, lng, radius = 500, vehicleType, date, time } = req.body; // Increase default radius to 500km

        console.log('searchGarages called with body:', req.body); // ← debug log

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required for nearby search',
            });
        }

        const coordinates = [parseFloat(lng), parseFloat(lat)];

        // First, let's check if ANY approved garages exist
        const allApprovedGarages = await Garage.find({
            verificationStatus: 'approved',
            deletedAt: null,
        });

        console.log(`Total approved & active garages in DB: ${allApprovedGarages.length}`);

        if (allApprovedGarages.length > 0) {
            console.log('Sample garage:', {
                name: allApprovedGarages[0].name,
                coordinates: allApprovedGarages[0].location.coordinates,
                availableSlots: allApprovedGarages[0].availableSlots,
                capacity: allApprovedGarages[0].capacity,
                verificationStatus: allApprovedGarages[0].verificationStatus,
                isActive: allApprovedGarages[0].isActive
            });
        }

        const query = {
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: parseFloat(radius) * 1000,
                },
            },
            verificationStatus: 'approved',
            deletedAt: null,
            // Show all approved garages regardless of isActive — open/closed shown as badge
        };

        // Optional filters
        if (vehicleType) query.vehicleType = vehicleType;

        let garages = await Garage.find(query).limit(20);

        console.log(`Found ${garages.length} approved garages within ${radius}km`);

        // Fallback 1: try without distance limit
        if (garages.length === 0) {
            console.log('No nearby garages — trying without distance limit');
            garages = await Garage.find({
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates },
                        $maxDistance: 9999 * 1000,
                    },
                },
                verificationStatus: 'approved',
                deletedAt: null,
            }).limit(20);
        }

        // Fallback 2: skip geospatial entirely
        if (garages.length === 0) {
            console.log('Geospatial query returned 0 — falling back to plain find');
            garages = await Garage.find({
                verificationStatus: 'approved',
                deletedAt: null,
            }).limit(20);
        }

        // Set no-cache headers to prevent browser caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        return res.status(200).json({
            success: true,
            count: garages.length,
            data: garages,
        });
    } catch (error) {
        logger.error('Garage search failed', { error: error.message });
        next(error);
    }
};

/**
 * Get analytics for garage owner's garages
 */
export const getMyGarageAnalytics = async (req, res, next) => {
    try {
        const garages = await Garage.find({ owner: req.user.id });
        const garageIds = garages.map(g => g._id);

        // Import Reservation model
        const Reservation = (await import('../models/Reservation.js')).default;
        const Payment = (await import('../models/Payment.js')).default;

        // Get all reservations for owner's garages
        const allReservations = await Reservation.find({ garage: { $in: garageIds } });

        // Calculate statistics
        const totalBookings = allReservations.length;
        const completedServices = allReservations.filter(r => r.status === 'completed').length;
        const activeBookings = allReservations.filter(r => ['pending', 'confirmed', 'active'].includes(r.status)).length;
        const cancelledBookings = allReservations.filter(r => r.status === 'cancelled').length;

        // Get payments for completed reservations
        const completedReservationIds = allReservations
            .filter(r => r.status === 'completed')
            .map(r => r._id);

        const payments = await Payment.find({
            reservation: { $in: completedReservationIds },
            status: 'success',
        });

        const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate average rating from garages
        const totalRating = garages.reduce((sum, garage) => sum + (garage.rating || 0), 0);
        const averageRating = garages.length > 0 ? totalRating / garages.length : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalBookings,
                completedServices,
                revenue,
                averageRating: parseFloat(averageRating.toFixed(1)),
                activeBookings,
                cancelledBookings,
            },
        });
    } catch (error) {
        logger.error('Get garage analytics failed', { error: error.message });
        next(error);
    }
};

/**
 * Delete a garage (owner only)
 */
export const deleteGarage = async (req, res, next) => {
    try {
        const garage = await Garage.findOne({
            _id: req.params.id,
            owner: req.user.id,
        });

        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found or you are not the owner',
            });
        }

        await Garage.findByIdAndDelete(req.params.id);

        logger.info(`Garage deleted: ${req.params.id} by user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Garage deleted successfully',
        });
    } catch (error) {
        logger.error('Garage deletion failed', { error: error.message });
        next(error);
    }
};

/**
 * Get all garages (admin only)
 */
export const getAllGarages = async (req, res, next) => {
    try {
        const garages = await Garage.find({ deletedAt: null })
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: garages,
        });
    } catch (error) {
        logger.error('Get all garages failed', { error: error.message });
        next(error);
    }
};

export default {
    registerGarage,
    getMyGarages,
    getGarageById,
    updateGarage,
    searchGarages,
    getMyGarageAnalytics,
    deleteGarage,
    getAllGarages,
};