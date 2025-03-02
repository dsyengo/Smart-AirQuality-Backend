import https from 'https';

const PANGU_BASE_URL = "api.ecmwf.int";
const PANGU_API_PATH = "/v1/pangu-weather"; // Adjust this if incorrect
const PANGU_API_KEY = "1689a36ea97cf2d720eb453c662802d1";
const PANGU_EMAIL = "deniswilson028@gmail.com";

/**
 * Fetches weather data from the Pangu platform for a given location.
 * The location is specified by latitude and longitude.
 *
 * @param {Object} location - An object representing the location.
 * @param {number} location.lat - The latitude.
 * @param {number} location.lng - The longitude.
 * @returns {Promise<Object>} A promise that resolves with the weather data from Pangu.
 */
export function fetchWeatherDataForLocation(location) {
    return new Promise((resolve, reject) => {
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return reject(new Error("Invalid location data. 'lat' and 'lng' are required as numbers."));
        }

        const payload = JSON.stringify({
            data: {
                req_data: [{ lat: location.lat, lng: location.lng }]
            }
        });

        const options = {
            hostname: PANGU_BASE_URL,
            path: PANGU_API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${PANGU_API_KEY}`,  // If Bearer Token is needed
                'apikey': PANGU_API_KEY, // Keep this if required
                'email': PANGU_EMAIL
            }
        };

        const req = https.request(options, (res) => {
            let chunks = [];

            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const responseBody = Buffer.concat(chunks).toString();

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`Pangu API Error: ${res.statusCode} - ${responseBody}`));
                }

                try {
                    const data = JSON.parse(responseBody);
                    resolve(data);
                } catch (error) {
                    reject(new Error("Error parsing JSON response: " + error));
                }
            });
        });

        req.on('error', (error) => reject(new Error("Request error: " + error)));
        req.write(payload);
        req.end();
    });
}

// Example Usage:
fetchWeatherDataForLocation({ lat: -1.286389, lng: 36.817223 }) // Nairobi, Kenya
    .then(data => console.log("Weather Data:", data))
    .catch(err => console.error("Error:", err));
