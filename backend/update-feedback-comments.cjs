// update-feedback-comments.cjs
require('dotenv').config();
const mongoose = require('mongoose');

const professionalComments = [
    "The service was outstanding. My car was handled with great care and the staff were very professional throughout.",
    "Excellent garage — clean, well-organized, and the team completed the work faster than expected. Highly recommended.",
    "Very impressed with the quality of service. The booking process was smooth and the garage owner was responsive.",
    "Great experience from start to finish. The deposit system made everything transparent and trustworthy.",
    "Professional staff, fair pricing, and the garage was exactly as described. Will definitely book again.",
    "Reliable and efficient service. The real-time updates kept me informed at every step.",
    "Top-notch facility. My vehicle was in safe hands and the service was completed on time.",
    "Smooth booking, prompt service, and excellent communication. This is how car servicing should be done.",
    "The garage exceeded my expectations. Clean environment, skilled technicians, and honest pricing.",
    "Very satisfied with the overall experience. The staff were courteous and the work quality was superb.",
];

async function update() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    const col = mongoose.connection.collection('feedbacks');
    const feedbacks = await col.find({ rating: { $gte: 4 }, comment: { $exists: true, $ne: '' } })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

    console.log(`Found ${feedbacks.length} feedbacks to update`);

    for (let i = 0; i < feedbacks.length; i++) {
        const newComment = professionalComments[i % professionalComments.length];
        await col.updateOne(
            { _id: feedbacks[i]._id },
            { $set: { comment: newComment } }
        );
        console.log(`Updated: "${feedbacks[i].comment?.slice(0, 30)}" → "${newComment.slice(0, 50)}..."`);
    }

    console.log('Done');
    await mongoose.disconnect();
}

update().catch(console.error);
