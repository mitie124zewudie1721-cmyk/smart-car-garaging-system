// Update existing vehicle images to use API URLs
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vehicle from './src/models/Vehicle.js';

dotenv.config();

async function updateVehicleImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const vehicles = await Vehicle.find({ 'image.url': { $regex: '^/uploads/vehicle-images/' } });

        for (const vehicle of vehicles) {
            if (vehicle.image && vehicle.image.path) {
                vehicle.image.url = `/api/vehicles/${vehicle._id}/image`;
                await vehicle.save();
                console.log(`Updated vehicle ${vehicle._id}`);
            }
        }

        console.log(`Updated ${vehicles.length} vehicles`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating vehicles:', error);
        process.exit(1);
    }
}

updateVehicleImages();