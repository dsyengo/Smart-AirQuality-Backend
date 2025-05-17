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


app.use(errorHandler);

// Setup graceful shutdown
setupGracefulShutdown(server, mongoose); // Removed wss, as it's handled in initRealtimeDataStream

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});