import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import {
    securityMiddleware,
    apiLimiter,
    corsOptions
} from './config/security.js';
import {
    metricsMiddleware,
    healthCheck
} from './config/monitoring.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { validateEnv } from './config/envValidation.js';
import errorHandler from './middleware/errorHandler.js';
import connectDatabase from './config/database.js';
import { logger } from './middleware/logger.js';
import huaweiCloudRoutes from './routes/huaweiCloudRoutes.js';
import { startRealTimeMonitoring } from './services/realTimeDataService.js';
import { initRealtimeDataStream } from './controllers/dataMonitor.js';

// Initialize environment
dotenv.config();
validateEnv();

// Create Express app
const app = express();
const server = createServer(app);

// Database connection
connectDatabase().then(() => {
    // Start real-time monitoring after DB connects
    startRealTimeMonitoring();  

    // Initialize WebSocket server
    // initRealtimeDataStream(server);

    // Middlewares
    app.use(compression());
    app.use(logger);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors(corsOptions));
    app.use(morgan('combined'));
    app.use(metricsMiddleware);
    app.use(securityMiddleware);

    // Routes
    app.use('/api', apiLimiter, huaweiCloudRoutes);
    app.get('/health', healthCheck);
    app.use(errorHandler);

    // Graceful shutdown
    setupGracefulShutdown(server);

    // Start server
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
        // console.log(`Real-time monitoring: ${realTimeDataService.isMonitoring ? 'ACTIVE' : 'INACTIVE'}`);
    });
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});