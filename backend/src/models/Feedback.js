// src/models/Feedback.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reservation',
        },

        dispute: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dispute',
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
        },

        garage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage',
            required: [true, 'Garage is required'],
        },

        feedbackType: {
            type: String,
            enum: ['service', 'dispute_resolution'],
            default: 'service',
        },

        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },

        comment: {
            type: String,
            maxlength: [500, 'Comment cannot exceed 500 characters'],
            trim: true,
        },
    },
    {
        timestamps: true, // automatically adds createdAt & updatedAt
    }
);

// Indexes for faster queries
feedbackSchema.index({ garage: 1, createdAt: -1 });
feedbackSchema.index({ reservation: 1 }, { unique: true, sparse: true }); // one feedback per reservation
// Note: dispute+user index will be created manually when needed to avoid issues with null values
// feedbackSchema.index({ dispute: 1, user: 1 }, { unique: true, sparse: true });

// Validation: must have either reservation or dispute
feedbackSchema.pre('save', function (next) {
    if (!this.reservation && !this.dispute) {
        return next(new Error('Feedback must be associated with either a reservation or a dispute'));
    }
    next();
});

// Optional: Auto-update garage average rating after new feedback
feedbackSchema.post('save', async function () {
    const stats = await mongoose.model('Feedback').aggregate([
        { $match: { garage: this.garage } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
    ]);

    const avg = stats[0]?.avgRating || 0;
    const count = stats[0]?.count || 0;

    await mongoose.model('Garage').findByIdAndUpdate(this.garage, {
        rating: Math.round(avg * 10) / 10, // round to 1 decimal place
        totalReviews: count,
    });
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// ✅ This line is the critical fix
export default Feedback;