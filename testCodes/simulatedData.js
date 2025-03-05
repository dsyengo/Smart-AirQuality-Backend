import { getLatestData } from '../testCodes/simulateData.js';
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
        const data = await getLatestData();
        if (!data) {
            return res.status(404).json({ success: false, message: "No sensor data available" });
        }

        // Extract the measurements from the simulated data.
        const measurements = data.measurements || {};

        // Create an object with keys exactly as expected by the AQI calculator.
        const aqiMeasurements = {
            pm25: measurements.pm25 || 0,
            pm10: measurements.pm10 || 0,
            co: measurements.co || 0,
            no2: measurements.no2 || 0
        };

        // Prepare all sensor data for further processing
        const allData = {
            Temperature: measurements.temperature || 0,
            Humidity: measurements.humidity || 0,
            PM2_5: measurements.pm25 || 0,
            PM10: measurements.pm10 || 0,
            NO2: measurements.no2 || 0,
            SO2: measurements.so2 || 0,
            CO: measurements.co || 0,
            Proximity_to_Industrial_Areas: data.context?.Proximity_to_Industrial_Areas || "Unknown",
            Population_Density: data.context?.Population_Density || "Unknown"
        };

        // Now pass the correctly structured object to calculateAQI.
        const AQI = calculateAQI(aqiMeasurements);

        // Continue with further processing
        const modelResponse = await processDataWithModel(allData);
        const predictionData = {
            AQI,
            no2: allData.NO2,
        }
        const predictionAnalysis = await getPredictionAnalysis(predictionData);

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