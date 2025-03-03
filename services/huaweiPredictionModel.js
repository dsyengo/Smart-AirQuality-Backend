import https from 'https';
import { Signer, HttpRequest } from '../utils/signer.js';
import dotenv from 'dotenv'
dotenv.config()

// Access credentials from environment variables
const PREDICTION_MODEL_AK = process.env.HUAWEI_MODEL_SDK_AK;
const PREDICTION_MODEL_SK = process.env.HUAWEI_MODEL_SDK_SK;
const PREDICTION_MODEL_URL = process.env.HUAWEI_PREDICTION_MODEL_URL;

// Define the request payload based on the expected air quality monitoring data format
const payload = {
    data: {
        req_data: [{
            "Country": "United States",
            "City": "Santa Cruz",
            "AQI Value": 50,
            "CO AQI Value": 1,
            "CO AQI Category": "Good",
            "Ozone AQI Value": 30,
            "Ozone AQI Category": "Good",
            "NO2 AQI Value": 2,
            "NO2 AQI Category": "Good",
            "PM2_5 AQI Value": 45,
            "PM2_5 AQI Category": "Good",
            "lat": 36.9741,
            "lng": -122.0308
        }]
    }
};

/**
 * Fetches prediction analysis from the model by signing the request.
 * The logic is derived from a Python example where the request is signed
 * with a provided access key (AK) and secret key (SK) before sending.
 *
 * @returns {Promise<Object>} Resolves with the model's response.
 */
export async function getPredictionAnalysis() {
    return new Promise((resolve, reject) => {
        // Convert payload to JSON string
        const bodyString = JSON.stringify(payload);
        // Create an HttpRequest object for a POST request with JSON content.
        const httpRequest = new HttpRequest("POST", PREDICTION_MODEL_URL, { "Content-Type": "application/json" }, bodyString);

        // Initialize the signer with credentials and sign the request.
        const sig = new Signer();
        sig.Key = PREDICTION_MODEL_AK;
        sig.Secret = PREDICTION_MODEL_SK;
        const options = sig.Sign(httpRequest);

        // Make the HTTPS request.
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                try {
                    const responseBody = Buffer.concat(chunks).toString();
                    resolve(JSON.parse(responseBody));
                } catch (error) {
                    reject(new Error("Error parsing response: " + error));
                }
            });
        });

        req.on("error", (err) => reject(new Error("Request error: " + err)));
        req.write(bodyString);
        req.end();
    });
}

// Execute a test call if the module is run directly.
// The final output is formatted as a JSON string for terminal display.
getPredictionAnalysis()
    .then(result => console.log(JSON.stringify({ response: result }, null, 2)))
    .catch(err => console.error(JSON.stringify({ error: err.message }, null, 2)));