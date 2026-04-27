// src/controllers/reportController.js
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate receipt PDF for a completed reservation
 */
export const generateReceipt = async (req, res, next) => {
    try {
        const { reservationId } = req.params;

        const reservation = await Reservation.findById(reservationId)
            .populate('garage user vehicle');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found',
            });
        }

        // Only owner or admin
        if (reservation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to generate receipt for this reservation',
            });
        }

        if (reservation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Receipt can only be generated for completed reservations',
            });
        }

        // Create PDF
        const doc = new PDFDocument();
        const fileName = `receipt-${reservation._id}.pdf`;
        const filePath = path.join(process.cwd(), 'receipts', fileName);

        // Ensure receipts folder exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        doc.pipe(fs.createWriteStream(filePath));

        // PDF content
        doc.fontSize(20).text('Smart Car Garaging Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Reservation ID: ${reservation._id}`);
        doc.text(`Garage: ${reservation.garage.name}`);
        doc.text(`User: ${reservation.user.name} (${reservation.user.email})`);
        doc.text(`Vehicle: ${reservation.vehicle.make} ${reservation.vehicle.model}`);
        doc.text(`Period: ${new Date(reservation.startTime).toLocaleString()} - ${new Date(reservation.endTime).toLocaleString()}`);
        doc.text(`Total Price: ${reservation.totalPrice} ETB`);
        doc.text(`Status: ${reservation.status}`);
        doc.end();

        // Save report entry
        await Report.create({
            type: 'receipt',
            user: req.user.id,
            reservation: reservationId,
            fileUrl: `/receipts/${fileName}`,
            generatedAt: new Date(),
        });

        logger.info(`Receipt generated: ${fileName}`);

        return res.status(200).json({
            success: true,
            message: 'Receipt generated successfully',
            data: { fileUrl: `/receipts/${fileName}` },
        });
    } catch (error) {
        logger.error('Receipt generation failed', { error: error.message });
        next(error);
    }
};

/**
 * Generate monthly report for a garage (garage owner or admin)
 */
export const generateGarageReport = async (req, res, next) => {
    try {
        const { garageId } = req.params;
        const { startDate, endDate } = req.query;

        const garage = await mongoose.model('Garage').findById(garageId);
        if (!garage) {
            return res.status(404).json({
                success: false,
                message: 'Garage not found',
            });
        }

        if (garage.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to generate report for this garage',
            });
        }

        const match = { garage: garageId };
        if (startDate && endDate) {
            match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const stats = await Reservation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalReservations: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                    },
                },
            },
        ]);

        const reportData = stats[0] || {
            totalReservations: 0,
            totalRevenue: 0,
            completed: 0,
            cancelled: 0,
        };

        // Save report entry
        const report = await Report.create({
            type: 'garage_monthly',
            user: req.user.id,
            garage: garageId,
            periodStart: startDate ? new Date(startDate) : null,
            periodEnd: endDate ? new Date(endDate) : null,
            data: reportData,
            generatedAt: new Date(),
        });

        logger.info(`Garage report generated for ${garageId}`);

        return res.status(200).json({
            success: true,
            message: 'Garage report generated',
            data: { reportData, reportId: report._id },
        });
    } catch (error) {
        logger.error('Garage report generation failed', { error: error.message });
        next(error);
    }
};

/**
 * Get system-wide analytics (admin only)
 */
export const getSystemAnalytics = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        const stats = await Promise.all([
            User.countDocuments(),
            mongoose.model('Garage').countDocuments(),
            Reservation.countDocuments(),
            Reservation.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
            ]),
        ]);

        const analytics = {
            totalUsers: stats[0],
            totalGarages: stats[1],
            totalReservations: stats[2],
            totalRevenue: stats[3][0]?.totalRevenue || 0,
        };

        logger.info('System analytics generated by admin');

        return res.status(200).json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        logger.error('System analytics failed', { error: error.message });
        next(error);
    }
};

export default {
    generateReceipt,
    generateGarageReport,
    getSystemAnalytics,
};