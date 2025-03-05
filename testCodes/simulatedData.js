
import { fetchCloudData } from './simulateData.js'
import { processDataWithModel } from '../services/huaweiModelService.js';
import { analyzeDataWithGemini } from '../services/geminiNLPService.js';
import { getPredictionAnalysis } from '../services/huaweiPredictionModel.js';
import DataModel from '../models/data.js';
import { calculateAQI } from '../utils/aqiCalculator.js';

/**
 * Controller that handles API requests to retrieve the latest Huawei Cloud sensor data.
 * This controller:
 *  - Retrieves the sensor data.
 *  - Processes the sensor data with the Huawei Model service to get a model response.
 *  - Calculates the Air Quality Index (AQI) based on the sensor's pollutant measurements.
 *  - Uses the Gemini NLP service to analyze the consolidated data.
 *  - Consolidates the sensor data, model response, calculated AQI, and NLP analysis.
 *  - Saves the consolidated data into the database.
 *  - Returns the stored data to the client.
 */
export const getHuaweiCloudDataSim = async (req, res, next) => {
    try {
        const data = await fetchCloudData();
        if (!data) {
            return res.status(404).json({ success: false, message: "No sensor data available" });
        }

        const allData = {
            Temperature: data.temperature || 0,
            Humidity: data.humidity || 0,
            PM2_5: data.pm25 || 0,
            PM10: data.pm10 || 0,
            NO2: data.no2 || 0,
            SO2: data.so2 || 0,
            CO: data.co || 0,
            Proximity_to_Industrial_Areas: data.context?.Proximity_to_Industrial_Areas || "Unknown",
            Population_Density: data.context?.Population_Density || "Unknown"
        };

        const modelResponse = await processDataWithModel(allData);
        const AQI = calculateAQI(allData);
        const predictionAnalysis = await getPredictionAnalysis({ modelResponse, AQI });

        const combinedData = {
            sensorData: allData,
            modelResponse,
            predictionAnalysis,
            AQI
        };

        const nlpAnalysis = await analyzeDataWithGemini(combinedData);
        const finalData = { ...combinedData, nlpAnalysis };

        const savedEntry = await DataModel.create({ data: finalData });

        return res.json({ success: true, data: savedEntry });
    } catch (error) {
        console.error("Error fetching sensor data:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
