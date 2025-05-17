// models/sensor-data.js
import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
    rawData: { type: Object, required: true },
    AQI: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    gps: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 }
    },
    buzzer_o: { type: Boolean, default: false }
});

export default mongoose.model('OBSData', sensorDataSchema);