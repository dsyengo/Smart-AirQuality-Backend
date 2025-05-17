// utils/dataProcessor.js
import { calculateAQI } from './aqiCalculator.js';

export const processSensorData = (sensorData) => {
    const rawData = Array.isArray(sensorData) ? sensorData[0] : sensorData;

    const aqiParams = {
        pm10: rawData?.pm1_0_ppm || 0,
        pm25: rawData?.pm2_5_ppm || 0,
        pm10: rawData?.pm10_ppm || 0,
        o3: rawData?.ozone_ppm || 0,
        co: rawData?.co_ppm || 0
    };

    const AQILevel = calculateAQI(aqiParams);
    console.log('[PROCESSOR] Calculated AQI:', AQILevel);

    let timestamp;
    try {
        const [day, month, year, time] = rawData?.timestamp.split(/[\s/]+/);
        timestamp = new Date(`${year}-${month}-${day}T${time}Z`).toISOString();
    } catch {
        timestamp = new Date().toISOString();
    }

    return {
        rawData,
        AQI: AQILevel,
        timestamp,
        temperature: rawData?.temp_celsius || 30,
        humidity: rawData?.humidity_percent || 20,
        gps: {
            latitude: rawData?.gps_lat || 0,
            longitude: rawData?.gps_lng || 0
        },
        buzzer: rawData?.buzzer_on || false
    };
};