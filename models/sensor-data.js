import mongoose from 'mongoose';

const SensorData = new mongoose.Schema({
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    fetchedAt: {
        type: Date,
        default: Date.now,
    },
});

const OBSData = mongoose.model('OBS-data', SensorData);

export default OBSData