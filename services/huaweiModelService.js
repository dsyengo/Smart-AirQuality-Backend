import https from 'https';
import { Signer, HttpRequest } from '../utils/signer.js';

const HUAWEI_MODEL_AK = process.env.HUAWEI_MODEL_SDK_AK
const HUAWEI_MODEL_SK = process.env.HUAWEI_MODEL_SDK_SK
const HUAWEI_MODEL_URL = process.env.HUAWEI_MODEL_API_URL;

/**
 * Posts sensor data to the Huawei Model endpoint for inference.
 * The payload is constructed based on the expected air quality monitoring data format.
 *
 * @param {Object} data - Sensor data containing air quality measurements and context information.
 * Expected structure:
 * {
 *   measurements: {
 *     temperature: number,
 *     humidity: number,
 *     pm25: number,
 *     pm10: number,
 *     // additional measurements if required
 *   },
 *   context: {
 *     Proximity_to_Industrial_Areas: number,
 *     Population_Density: number
 *   }
 * }
 *
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
                        Proximity_to_Industrial_Areas: data.context?.Proximity_to_Industrial_Areas,
                        Population_Density: data.context?.Population_Density
                    }
                ]
            }
        };

        // Convert the payload to a JSON string.
        const bodyString = JSON.stringify(payload);

        // Create an HttpRequest using the provided model endpoint.
        const httpRequest = new HttpRequest("POST", HUAWEI_MODEL_URL, { "Content-Type": "application/json" }, bodyString);

        // Initialize the signer and set the access key (AK) and secret key (SK)
        const sig = new Signer();
        sig.Key = HUAWEI_MODEL_AK;
        sig.Secret = HUAWEI_MODEL_SK;

        // Sign the request to obtain the necessary authentication headers.
        const options = sig.Sign(httpRequest);

        // Send the HTTPS request using the signed options.
        const req = https.request(options, (res) => {
            let chunks = [];

            res.on("data", (chunk) => {
                chunks.push(chunk);
            });

            res.on("end", () => {
                const responseBody = Buffer.concat(chunks).toString();
                let result;
                try {
                    result = JSON.parse(responseBody);
                } catch (error) {
                    return reject(new Error("Error parsing JSON response: " + error));
                }
                resolve(result);
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.write(bodyString);
        req.end();
    });
}