import https from 'https';
import { Signer, HttpRequest } from '../utils/signer.js';

const HUAWEI_MODEL_AK = process.env.HUAWEI_MODEL_SDK_AK;
const HUAWEI_MODEL_SK = process.env.HUAWEI_MODEL_SDK_SK
const HUAWEI_MODEL_URL = process.env.HUAWEI_MODEL_API_URL       // e.g., "https://<host>/v1/infers/<model-id>"

/**
 * Posts sensor data to the Huawei Model endpoint for inference.
 * This function makes a POST request with the provided sensor data.
 *
 * Expected structure:
 * {
 *   measurements: {
 *     temperature: number,
 *     humidity: number,
 *     pm25: number,
 *     pm10: number,
 *     no2: number,
 *     so2: number,
 *     co: number
 *   },
 *   context: {
 *     Proximity_to_Industrial_Areas: number,
 *     Population_Density: number
 *   }
 * }
 *
 * @param {Object} data - Sensor data containing air quality measurements and context information.
 * @returns {Promise<Object>} The parsed JSON response from the Huawei Model API.
 */
export async function processDataWithModel(data) {
    return new Promise((resolve, reject) => {
        // Construct the payload according to the model's expected format.
        const payload = {
            data: {
                req_data: [
                    {
                        Temperature: data.measurements.temperature,
                        Humidity: data.measurements.humidity,
                        PM2_5: data.measurements.pm25,
                        PM10: data.measurements.pm10,
                        NO2: data.measurements.no2,
                        SO2: data.measurements.so2,
                        CO: data.measurements.co,
                        Proximity_to_Industrial_Areas: data.context?.Proximity_to_Industrial_Areas,
                        Population_Density: data.context?.Population_Density
                    }
                ]
            }
        };

        // Convert the payload to a JSON string.
        const bodyString = JSON.stringify(payload);

        // Create an HttpRequest object using the POST method.
        const httpRequest = new HttpRequest("POST", HUAWEI_MODEL_URL, { "Content-Type": "application/json" }, bodyString);

        // Initialize the signer and set the access key (AK) and secret key (SK).
        const sig = new Signer();
        sig.Key = HUAWEI_MODEL_AK;
        sig.Secret = HUAWEI_MODEL_SK;

        // Sign the request to obtain the necessary authentication headers.
        const options = sig.Sign(httpRequest);

        // Send the HTTPS POST request.
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on("data", (chunk) => {
                chunks.push(chunk);
            });
            res.on("end", () => {
                const responseBody = Buffer.concat(chunks).toString();
                try {
                    const result = JSON.parse(responseBody);
                    resolve(result);
                } catch (error) {
                    return reject(new Error("Error parsing JSON response: " + error));
                }
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        // Ensure the request is POST and send the body.
        req.write(bodyString);
        req.end();
    });
}