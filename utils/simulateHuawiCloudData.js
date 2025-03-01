/**
 * This utility file simulates Huawei Cloud data fetching by generating
 * random air quality and weather data. It mimics the data structure expected from 
 * the actual Huawei Cloud API and can be used for development and testing purposes.
 */

/**
 * Generates a random number between min and max with the specified number of decimals.
 * @param {number} min The minimum value.
 * @param {number} max The maximum value.
 * @param {number} decimals The number of decimals.
 * @returns {number} A random number.
 */
function getRandomNumber(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

/**
 * Simulates the fetching of Huawei Cloud data by generating random values
 * for air quality measurements along with location and weather information.
 *
 * The generated data includes:
 * - Measurements: PM2.5, PM10, CO, NO2 levels.
 * - Location: latitude and longitude.
 * - Weather: temperature and humidity.
 * - A timestamp indicating when the data was generated.
 *
 * @returns {Object} An object representing the simulated Huawei Cloud data.
 */
export function simulateHuaweiCloudData() {
    return {
        timestamp: new Date(),
        measurements: {
            // PM2.5 in µg/m³ (commonly ranging from 0 to 250 for polluted environments)
            pm25: getRandomNumber(0, 250),
            // PM10 in µg/m³ (commonly ranging from 0 to 350)
            pm10: getRandomNumber(0, 350),
            // Carbon Monoxide (CO) in parts per million (ppm)
            co: getRandomNumber(0, 10),
            // Nitrogen Dioxide (NO2) in parts per billion (ppb)
            no2: getRandomNumber(0, 200),
        },
        location: {
            // Simulated geographical coordinates
            latitude: getRandomNumber(-90, 90, 6),
            longitude: getRandomNumber(-180, 180, 6)
        },
        weather: {
            // Temperature in °C
            temperature: getRandomNumber(-10, 40),
            // Humidity in percentage
            humidity: getRandomNumber(20, 100)
        }
    };
}