import mongoose from 'mongoose';

const SensorData = new mongoose.Schema({
    rawData: {
        type: mongoose.Schema.Types.Mixed, // Stores the raw NDJSON entry (e.g., { pms5003Dust, mq131Ozone, ... })
        required: true,
    },
    AQI: {
        type: Number, // Stores the calculated AQI value
        required: true,
    },
    timestamp: {
        type: String, // Stores the sensor's rtcTime (e.g., "2023-05-12 6:5:44")
        required: true,
    },
    fetchedAt: {
        type: Date, // Stores when the data was saved to the database
        default: Date.now,
    },
});

const OBSData = mongoose.model('OBS-data', SensorData);

export default OBSData;