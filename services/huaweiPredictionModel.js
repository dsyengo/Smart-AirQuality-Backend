import https from 'https';
import { Signer, HttpRequest } from '../utils/signer.js';

/**
 * Prediction Model Service
 *
 * Sends air quality data to a prediction model for analysis.
 */

// Access credentials
const PREDICTION_MODEL_AK = "PIET896VZ8VUULKMSDBG";
const PREDICTION_MODEL_SK = "NH7HFtgvdms3ynPvw4Wt8GcsIS0IRbFdpvb0jDiM";

// API endpoint
const PREDICTION_MODEL_URL = "https://2fec676ce4e447d0980abfbeb404b0a3.apig.ap-southeast-3.huaweicloudapis.com/v1/infers/7630957a-eca7-49f2-bce6-64355129aaca";

// Request payload
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
 * Fetches prediction analysis from the model.
 * @returns {Promise<Object>} Resolves with model response.
 */
export async function getPredictionAnalysis() {
    return new Promise((resolve, reject) => {
        const bodyString = JSON.stringify(payload);
        const httpRequest = new HttpRequest("POST", PREDICTION_MODEL_URL, { "Content-Type": "application/json" }, bodyString);

        // Initialize and sign request
        const sig = new Signer();
        sig.Key = PREDICTION_MODEL_AK;
        sig.Secret = PREDICTION_MODEL_SK;
        const options = sig.Sign(httpRequest);

        // Make HTTPS request
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString()));
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

// Check if module is run directly in ES Modules
if (import.meta.url === `file://${process.argv[1]}`) {
    getPredictionAnalysis()
        .then(result => console.log("Response Body:", result))
        .catch(err => console.error("Error:", err));
}
