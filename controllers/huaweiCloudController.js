
import { fetchLatestCloudData } from '../services/huaweiCloudService.js'
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
export const getHuaweiCloudData = async (req, res, next) => {
    try {
        const data = await fetchLatestCloudData();

        const allData = {
            Temperature: data.temperature,
            Humidity: data.humidity,
            PM2_5: data.pm25,
            PM10: data.pm10,
            NO2: data.no2,
            SO2: data.so2,
            CO: data.co,
            Proximity_to_Industrial_Areas: data?.context?.Proximity_to_Industrial_Areas || 0.89,
            Population_Density: data?.context?.Population_Density || 3000
        }
        const aqiData = {
            PM2_5: data.pm25,
            PM10: data.pm10,
            NO2: data.no2,
            SO2: data.so2,
            CO: data.co,
        }
        if (allData) {
            // Process the sensor data with the Huawei Model service.
            const modelResponse = await processDataWithModel(allData);

            // Calculate the Air Quality Index (AQI) using pollutant measurements.
            // Assumes sensor data includes a "measurements" object with properties like pm25, pm10, etc.
            const AQI = calculateAQI(aqiData);

            const predictioData = {
                modelResponse,
                AQI
            }
            console.log(predictioData)
            //get prediction analysis
            const predictionAnalysis = await getPredictionAnalysis(predictioData)

            // Consolidate sensor data, model response, and the calculated AQI.
            const combinedData = {
                sensorData: allData,
                modelResponse,
                predictionAnalysis,
                AQI
            };

            // Use the Gemini NLP service to analyze the consolidated data.
            const nlpAnalysis = await analyzeDataWithGemini(combinedData);

            // Append the NLP analysis to the combined data.
            const finalData = {
                ...combinedData,
                nlpAnalysis
            };

            // Save the consolidated data to the database.
            const savedEntry = await DataModel.create({ data: finalData });

            // Return the stored data to the client.
            res.json({
                success: true,
                data: savedEntry,
            });

            console.log('Data sent to client:', savedEntry)
        } else {
            res.status(503).json({
                success: false,
                message: 'No data available yet. Please try again later.',
            });
        }
    } catch (error) {
        next(error);
    }
};