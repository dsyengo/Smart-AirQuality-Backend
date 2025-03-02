import https from 'https';

const PANGU_BASE_URL = "api.ecmwf.int";
const PANGU_API_PATH = "/v1"; // Pangu API endpoint
const PANGU_API_KEY = "1689a36ea97cf2d720eb453c662802d1";
const PANGU_EMAIL = "deniswilson028@gmail.com";

/**
 * Fetches weather data from the Pangu platform for a given location.
 * The location is specified by latitude and longitude.
 *
 * The function sends a POST request to Pangu with a JSON payload that includes
 * the location coordinates. The API key and email are included in the request headers
 * for authentication.
 *
 * Request payload format:
 *
 * {
 *   "data": {
 *     "req_data": [{
 *       "lat": <latitude>,
 *       "lng": <longitude>
 *     }]
 *   }
 * }
 *
 * Example usage:
 * 
 * fetchWeatherDataForLocation({ lat: 36.9741, lng: -122.0308 })
 *   .then(data => console.log("Weather data:", data))
 *   .catch(err => console.error("Error fetching weather data:", err));
 *
 * @param {Object} location - An object representing the location.
 * @param {number} location.lat - The latitude.
 * @param {number} location.lng - The longitude.
 * @returns {Promise<Object>} A promise that resolves with the weather data from Pangu.
 */
export function fetchWeatherDataForLocation(location) {
    return new Promise((resolve, reject) => {
        if (
            !location ||
            typeof location.lat !== 'number' ||
            typeof location.lng !== 'number'
        ) {
            return reject(new Error("Invalid location data. 'lat' and 'lng' are required as numbers."));
        }

        // Construct the request payload using the location coordinates.
        const payload = {
            data: {
                req_data: [{
                    lat: location.lat,
                    lng: location.lng
                }]
            }
        };

        const bodyString = JSON.stringify(payload);

        // Configure the HTTPS request options.
        const options = {
            hostname: PANGU_BASE_URL,
            path: PANGU_API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyString),
                'apikey': PANGU_API_KEY,
                'email': PANGU_EMAIL
            }
        };

        // Send the HTTPS POST request.
        const req = https.request(options, (res) => {
            let chunks = [];

            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const responseBody = Buffer.concat(chunks).toString();
                try {
                    const data = JSON.parse(responseBody);
                    resolve(data);
                } catch (error) {
                    reject(new Error("Error parsing JSON response: " + error));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error("Request error: " + error));
        });

        req.write(bodyString);
        req.end();
    });
}