// src/routes/seedFeedback.js - Seed feedback data for testing
import express from 'express';
import Feedback from '../models/Feedback.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import Garage from '../models/Garage.js';

const router = express.Router();

/**
 * Seed feedback data
 * POST /api/dev/seed-feedback
 */
router.post('/seed-feedback', async (req, res) => {
    try {
        // Get completed reservations
        const completedReservations = await Reservation.find({
            status: 'completed'
        }).limit(10);

        if (completedReservations.length === 0) {
            // Create some completed reservations first
            const users = await User.find({ role: 'car_owner' }).limit(3);
            const garages = await Garage.find().limit(3);

            if (users.length === 0 || garages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Need users and garages first. Please seed them.'
                });
            }

            // Create completed reservations
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const twoDaysAgo = new Date(now);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            const reservationsToCreate = [];
            for (let i = 0; i < 10; i++) {
                const user = users[i % users.length];
                const garage = garages[i % garages.length];

                reservationsToCreate.push({
                    user: user._id,
                    garage: garage._id,
                    vehicle: user.vehicle || user._id, // Placeholder
                    startTime: twoDaysAgo,
                    endTime: yesterday,
                    status: 'completed',
                    totalPrice: 100 + (i * 10),
                    paymentStatus: 'paid'
                });
            }

            const createdReservations = await Reservation.insertMany(reservationsToCreate);
            console.log(`Created ${createdReservations.length} completed reservations`);
        }

        // Get completed reservations again
        const reservations = await Reservation.find({
            status: 'completed'
        }).limit(20);

        // Delete existing feedback
        await Feedback.deleteMany({});

        // Create feedback with varied ratings
        const feedbackData = [];
        const ratings = [5, 5, 4, 4, 4, 3, 3, 2, 5, 4, 5, 4, 3, 5, 4, 4, 5, 3, 4, 5];
        const comments = [
            'Excellent service! Very satisfied.',
            'Great experience, will come again.',
            'Good service, clean facility.',
            'Decent service, could be better.',
            'Average experience.',
            'Not bad, but room for improvement.',
            'Below expectations.',
            'Outstanding! Highly recommend.',
            'Very professional staff.',
            'Clean and secure parking.',
            'Quick and efficient service.',
            'Friendly staff, good location.',
            'Satisfactory service.',
            'Excellent facilities!',
            'Good value for money.',
            'Professional and courteous.',
            'Top-notch service!',
            'Could improve cleanliness.',
            'Reliable and trustworthy.',
            'Superb experience!'
        ];

        for (let i = 0; i < Math.min(reservations.length, 20); i++) {
            const reservation = reservations[i];
            feedbackData.push({
                reservation: reservation._id,
                user: reservation.user,
                garage: reservation.garage,
                rating: ratings[i % ratings.length],
                comment: comments[i % comments.length]
            });
        }

        const createdFeedback = await Feedback.insertMany(feedbackData);

        // Calculate stats
        const totalFeedback = createdFeedback.length;
        const avgRating = (createdFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1);
        const satisfied = createdFeedback.filter(f => f.rating >= 4).length;
        const satisfactionRate = ((satisfied / totalFeedback) * 100).toFixed(1);

        console.log(`✅ Created ${totalFeedback} feedback entries`);

        return res.status(200).json({
            success: true,
            message: `Seeded ${totalFeedback} feedback entries`,
            data: {
                totalFeedback,
                averageRating: parseFloat(avgRating),
                customerSatisfaction: parseFloat(satisfactionRate),
                feedbackByRating: {
                    5: createdFeedback.filter(f => f.rating === 5).length,
                    4: createdFeedback.filter(f => f.rating === 4).length,
                    3: createdFeedback.filter(f => f.rating === 3).length,
                    2: createdFeedback.filter(f => f.rating === 2).length,
                    1: createdFeedback.filter(f => f.rating === 1).length,
                }
            }
        });
    } catch (error) {
        console.error('Seed feedback error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to seed feedback',
            error: error.message
        });
    }
});

export default router;
