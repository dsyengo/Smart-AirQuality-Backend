import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDatabase from './config/database.js';
import huaweiCloudRoutes from './routes/huaweiCloudRoutes.js';
import { startDataMonitoring } from './services/huaweiCloudService.js';

dotenv.config()


const app = express();

//database connection before any route handling

//middlwares
app.use(helmet()) // Use Helmet to set various HTTP headers for security
app.use(express.urlencoded({ extended: true })) //parse url encoded bodies
app.use(cors());
app.use(express.json());
app.use(morgan('combined')) // Use Morgan to log HTTP requests in combined format for detailed logging

//routes
app.use('/api', huaweiCloudRoutes);

// Health check route.
app.get('/', (req, res) => {
    res.send('Smart AirQuality Cloud API is running.');
});



// register error handler after all routes and middlewares
app.use(errorHandler);

// Start continuous monitoring of Huawei Cloud data.
startDataMonitoring();

const PORT = process.env.PORT || 5000
// Connect to the database before starting the server
connectDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Smart AirQuality System running on http://localhost:${PORT}`);
    });
});