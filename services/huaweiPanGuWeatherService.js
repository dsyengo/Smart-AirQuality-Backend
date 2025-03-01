import fetch from 'node-fetch';

// URL for fetching weather forecast using the Huawei Pangu Weather model (set in your .env file).
const HUAWEI_PANGU_WEATHER_API_URL = process.env.HUAWEI_PANGU_WEATHER_API_URL;

/**
 * Retrieves a weather forecast for the specified location using the Huawei Pangu Weather model API.
 *
 * @param {Object} location - An object containing latitude and longitude (e.g., { latitude, longitude }).
 * @returns {Promise<Object>} The weather forecast data as returned by the API.
 */
export async function getWeatherForecast(location) {
    try {
        // Construct a query with latitude and longitude.
        const url = `${HUAWEI_PANGU_WEATHER_API_URL}?lat=${location.latitude}&lon=${location.longitude}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error from Pangu Weather API! Status: ${response.status}`);
        }
        const forecast = await response.json();
        return forecast;
    } catch (error) {
        console.error('Error fetching weather forecast from Huawei Pangu Weather model:', error);
        throw error;
    }
}