import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    aqi: { type: Number, required: true },
    lastUpdated: { type: Date, required: true, default: Date.now },
});

const Station = mongoose.model('Station', stationSchema);

export default Station;
