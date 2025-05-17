// controllers/dataController.js
import { realTimeDataService } from '../services/realTimeDataService.js';
import { processSensorData } from '../utils/dataProcessor.js';
import OBSData from '../models/sensor-data.js';
import { startRealTimeMonitoring } from '../services/realTimeDataService.js';

// Initialize real-time monitoring (only once)
startRealTimeMonitoring();

export const getLatestData = async (req, res, next) => {
    try {
        const latestData = await realTimeDataService.fetchLatest();
        let result;

        if (latestData && latestData.length > 0) {
            result = processSensorData(latestData[0]);
        } else {
            result = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
            if (!result) {
                return res.status(503).json({
                    success: false,
                    message: 'No data available'
                });
            }
        }

        res.json({
            success: true,
            data: {
                timestamp: result.timestamp,
                aqi: result.AQI || 0,
                pollutants: {
                    PM10: result.rawData?.pm1_0_ppm || 0,
                    PM25: result.rawData?.pm2_5_ppm || 0,
                    PM10: result.rawData?.pm10_ppm || 0,
                    O3: result.rawData?.ozone_ppm || 0,
                    CO: result.rawData?.co_ppm || 0
                },
                temperature: result.temperature || null,
                humidity: result.humidity || null,
                gps: result.gps || { latitude: 0, longitude: 0 },
                buzzer: result.buzzer || false
            }
        });
    } catch (error) {
        console.error('[CONTROLLER] Error fetching latest data:', error.message);
        next(error);
    }
};