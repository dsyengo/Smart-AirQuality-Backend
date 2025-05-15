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
app.get('/health', healthCheck);

// Mock data
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

app.get("/api/air-quality/historical", (req, res) => {
    const { stationId, range } = req.query;
    const data = [];
    const hours = range === "24h" ? 24 : 7 * 24;

    for (let i = 0; i < hours; i++) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
        data.push({
            timestamp: timestamp.toISOString(),
            aqi: 30 + Math.random() * 40,
            pollutants: {
                PM25: 15 + Math.random() * 20,
                PM10: 25 + Math.random() * 30,
                NO2: 0.4 + Math.random() * 0.4,
                CO: 0.03 + Math.random() * 0.03,
                SO2: 0.6 + Math.random() * 0.6,
                O3: 0.04 + Math.random() * 0.03,
            },
        });
    }

    res.json(data);
});

app.get("/api/health/recommendations", (req, res) => {
    const { aqi } = req.query;
    const aqiValue = parseInt(aqi) || 0;

    let riskLevel = "good";
    if (aqiValue > 300) riskLevel = "hazardous";
    else if (aqiValue > 200) riskLevel = "veryUnhealthy";
    else if (aqiValue > 150) riskLevel = "unhealthy";
    else if (aqiValue > 100) riskLevel = "unhealthySensitive";
    else if (aqiValue > 50) riskLevel = "moderate";

    const healthData = {
        good: {
            level: "Low Risk",
            description:
                "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            recommendations: [
                "Enjoy outdoor activities as usual",
                "Keep windows open for fresh air",
                "Monitor local air quality updates",
            ],
            affectedGroups: ["Generally safe for all groups"],
            alertLevel: "Low",
            alertDescription:
                "Air quality is good and poses little to no health risk.",
            alertColor: "green-500",
        },
        moderate: {
            level: "Moderate Risk",
            description: "Some individuals may experience health effects.",
            recommendations: [
                "Reduce prolonged outdoor activities if you experience symptoms",
                "Keep windows closed during peak pollution hours",
                "Monitor symptoms if you have respiratory conditions",
            ],
            affectedGroups: [
                "Sensitive individuals",
                "People with respiratory conditions",
            ],
            alertLevel: "Moderate",
            alertDescription: "Air quality may pose risks for sensitive groups.",
            alertColor: "yellow-600",
        },
        // ... Add other levels as needed
    };

    res.json({
        current: healthData[riskLevel] || healthData.good,
        risks: Object.values(healthData).slice(0, 3),
    });
});

app.use(errorHandler);

// Setup graceful shutdown
setupGracefulShutdown(server, mongoose); // Removed wss, as it's handled in initRealtimeDataStream

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});