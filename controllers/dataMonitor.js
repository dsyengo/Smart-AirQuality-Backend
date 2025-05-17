import {
    startRealTimeMonitoring,
    realTimeDataService
} from '../services/realTimeDataService.js';
import { calculateAQI } from '../utils/aqiCalculator.js';
import OBSData from '../models/sensor-data.js';



// Initialize real-time monitoring (only once)
startRealTimeMonitoring();



// Data processing helper
export const processSensorData = (sensorData) => {

    const rawData = Array.isArray(sensorData) ? sensorData[0] : sensorData;
    const aqiParams = {
        pm10: rawData?.pm1_0_ppm,
        pm25: rawData?.pm2_5_ppm,
        pm10: rawData?.pm10_ppm, // Assuming PM10 same as PM2.5 for now
        co: rawData?.co_ppm,
        o3: rawData?.ozone_ppm,
    };

    ;
    const AQILevels = calculateAQI(aqiParams);

    console.log('Calculated AQI:', AQILevels);
    return {
        rawData,
        AQI: AQILevels,
        timestamp: rawData?.timestamp || new Date().toISOString(),
        temperature: rawData?.temp_celsius,
        humidity: rawData?.humidity_percent,
    };
};

/**
 * HTTP Controller - Gets latest available data
 */
export const getLatestData = async (req, res, next) => {
    try {
        // Try to get new data first
        const latestData = await realTimeDataService.fetchLatest();

        let result;

        if (latestData && latestData.length > 0) {
            // Process the most recent entry if new data exists
            result = await OBSData.create(
                processSensorData(latestData[latestData.length - 1])
            );
        } else {
            // If no new data, get the previous latest data from database
            result = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);

            if (!result) {
                return res.status(503).json({
                    success: false,
                    message: 'No data available'
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};


