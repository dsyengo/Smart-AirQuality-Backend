import mongoose from 'mongoose';

const DataSchema = new mongoose.Schema({
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    fetchedAt: {
        type: Date,
        default: Date.now,
    },
});

const DataModel = mongoose.model('Data', DataSchema);

export default DataModel;