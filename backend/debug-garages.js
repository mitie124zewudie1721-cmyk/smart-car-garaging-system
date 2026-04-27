import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const all = await db.collection('garages').find({}).project({ name: 1, verificationStatus: 1, isActive: 1, availableSlots: 1, deletedAt: 1, 'location.coordinates': 1 }).toArray();
    console.log('ALL GARAGES:');
    all.forEach(g => console.log(g.name, '| status:', g.verificationStatus, '| active:', g.isActive, '| slots:', g.availableSlots, '| deleted:', g.deletedAt, '| coords:', g.location?.coordinates));
    mongoose.disconnect();
}).catch(e => console.error(e.message));
