// src/routes/seedAnalytics.js - Seed data for analytics testing
import express from 'express';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';
import Payment from '../models/Payment.js';
import Garage from '../models/Garage.js';

const router = express.Router();

/**
 * Seed analytics data for testing
 * Creates users, reservations, and payments with dates spread over the past month
 */
router.post('/seed-analytics', async (req, res) => {
    try {
        console.log('Starting analytics data seeding...');

        // Get existing garages
        const garages = await Garage.find().limit(5);
        if (garages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please seed garages first using /api/dev/seed',
            });
        }

        // Get existing car owners
        const carOwners = await User.find({ role: 'car_owner' }).limit(10);
        if (carOwners.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No car owners found. Please register some users first.',
            });
        }

        // Create reservations and payments for the past 30 days
        const reservationsToCreate = [];
        const paymentsToCreate = [];
        const now = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Create 2-5 reservations per day
            const reservationsPerDay = Math.floor(Math.random() * 4) + 2;

            for (let j = 0; j < reservationsPerDay; j++) {
                const user = carOwners[Math.floor(Math.random() * carOwners.length)];
                const garage = garages[Math.floor(Math.random() * garages.length)];
                const amount = Math.floor(Math.random() * 500) + 100; // 100-600 ETB

                const reservation = {
                    user: user._id,
                    garage: garage._id,
                    startTime: new Date(date.getTime() + Math.random() * 86400000), // Random time during the day
                    endTime: new Date(date.getTime() + Math.random() * 86400000 + 3600000), // +1 hour
                    status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
                    totalPrice: amount,
                    createdAt: date,
                    updatedAt: date,
                };

                reservationsToCreate.push(reservation);

                // Create corresponding payment
                const payment = {
                    user: user._id,
                    amount: amount,
                    status: 'success',
                    paymentMethod: ['credit_card', 'debit_card', 'mobile_money'][Math.floor(Math.random() * 3)],
                    transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: date,
                    updatedAt: date,
                };

                paymentsToCreate.push(payment);
            }
        }

        // Insert all reservations and payments
        const insertedReservations = await Reservation.insertMany(reservationsToCreate);
        const insertedPayments = await Payment.insertMany(paymentsToCreate);

        console.log(`✅ Seeded ${insertedReservations.length} reservations`);
        console.log(`✅ Seeded ${insertedPayments.length} payments`);

        return res.status(201).json({
            success: true,
            message: 'Analytics data seeded successfully',
            data: {
                reservations: insertedReservations.length,
                payments: insertedPayments.length,
            },
        });
    } catch (error) {
        console.error('Seed analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to seed analytics data',
            error: error.message,
        });
    }
});

export default router;
