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
        pm25: rawData?.pms5003Dust || 0,
        pm10: rawData?.pms5003Dust || 0, // Assuming PM10 same as PM2.5 for now
        no2: rawData?.no2 || 30,
        so2: rawData?.so2 || 35,
        co: rawData?.mq7CO || 6,
        o3: rawData?.mq131Ozone || 10, // Use mq131Ozone for O3
    };

    ;
    const AQILevels = calculateAQI(aqiParams);

    console.log('Calculated AQI:', AQILevels);
    return {
        rawData,
        AQI: AQILevels,
        timestamp: rawData?.rtcTime || new Date().toISOString(),
        temperature: rawData?.dht11Temperature || 30,
        humidity: rawData?.dht11Humidity || 20,
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


