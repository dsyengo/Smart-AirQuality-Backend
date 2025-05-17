import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { healthCheck } from './config/monitoring.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { validateEnv } from './config/envValidation.js';
import errorHandler from './middleware/errorHandler.js';
import connectDatabase from './config/database.js';
import { logger } from './middleware/logger.js';
import huaweiCloudRoutes from './routes/huaweiCloudRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startRealTimeMonitoring } from './services/realTimeDataService.js';
import { initRealtimeDataStream } from './controllers/webSocketController.js';
import recommendationRoutes from './routes/recommendationRoutes.js'
import historicalDataRoutes from './routes/dataHistoryRoute.js'
import notificationRoutes from './routes/notificationRoutes.js';
dotenv.config();
validateEnv();

const app = express();
const server = createServer(app);

connectDatabase();
startRealTimeMonitoring();
initRealtimeDataStream(server);

app.use(compression());
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('combined'));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', huaweiCloudRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/air-quality', historicalDataRoutes);
app.use('/api/', notificationRoutes);
app.get('/health', healthCheck);

const stations = [
    {
        id: "1",
        name: "Lavington Station (Huawei Offices)",
        latitude: -1.2741,
        longitude: 36.7615,
        aqi: 45,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: "2",
        name: "Kilimani Station",
        latitude: -1.2864,
        longitude: 36.7889,
        aqi: 52,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: "3",
        name: "Westlands Station",
        latitude: -1.265,
        longitude: 36.7962,
        aqi: 68,
        lastUpdated: new Date().toISOString(),
    },
];

// API endpoints
app.get("/api/stations", (req, res) => {
    res.json(stations);
});

app.get("/api/stations/:id", (req, res) => {
    const station = stations.find((s) => s.id === req.params.id);
    if (station) {
        res.json(station);
    } else {
        res.status(404).json({ error: "Station not found" });
    }
});


app.use(errorHandler);

// Setup graceful shutdown
setupGracefulShutdown(server, mongoose); // Removed wss, as it's handled in initRealtimeDataStream

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});