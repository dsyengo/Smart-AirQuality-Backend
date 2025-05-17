import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
    aqiLevel: {
        type: String,
        enum: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: 'info',
    },
    color: {
        type: String,
        default: '#000000',
    },
    priority: {
        type: Number,
        default: 1,
    },
});

export default mongoose.model('Recommendation', recommendationSchema);