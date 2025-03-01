import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is not defined in your environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB successfully.");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
};

export default connectDatabase;