/**
 * This utility file simulates Huawei Cloud data fetching by generating
 * random air quality and weather data. It mimics the data structure expected from 
 * the actual Huawei Cloud API and can be used for development and testing purposes.
 * 
 * NOTE: The simulated data structure has been updated to match the expected format 
 * required by other modules, such as the Huawei Model service. The service now expects 
 * an object with a "measurements" property (for sensor readings) and a "context" property 
 * (for additional metadata).
 */

/**
 * Generates a random number between min and max with the specified number of decimals.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @param {number} decimals - The number of decimals.
 * @returns {number} A random number.
 */
function getRandomNumber(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

/**
 * Simulates fetching Huawei Cloud data by generating random values for sensor measurements.
 * 
 * The returned object is structured to match the requirements of other modules:
 * {
 *   timestamp: Date,
 *   measurements: {
 *     temperature: number,   // in °C
 *     humidity: number,      // in percentage
 *     pm25: number,          // PM2.5 in µg/m³
 *     pm10: number,          // PM10 in µg/m³
 *     no2: number,           // NO2 in ppb
 *     so2: number,           // SO2 in ppb
 *     co: number             // CO in ppm
 *   },
 *   context: {
 *     Proximity_to_Industrial_Areas: number, // Ratio (0 to 1)
 *     Population_Density: number             // People per square km
 *   }
 * }
 *
 * @returns {Object} The simulated data with sensor measurements and additional context.
 */
export function simulateHuaweiCloudData() {
    return {
        timestamp: new Date(),
        measurements: {
            temperature: getRandomNumber(15, 35, 1),  // °C
            humidity: getRandomNumber(40, 100, 1),     // Percentage
            pm25: getRandomNumber(0, 100, 1),          // µg/m³
            pm10: getRandomNumber(0, 150, 1),          // µg/m³
            no2: getRandomNumber(0, 50, 1),            // ppb
            so2: getRandomNumber(0, 30, 1),            // ppb
            co: getRandomNumber(0, 10, 1)              // ppm
        },
        context: {
            Proximity_to_Industrial_Areas: getRandomNumber(0, 1, 2),
            Population_Density: Math.round(getRandomNumber(1000, 10000))
        }
    };
}

// For testing purposes, you can run this file directly with Node.js.
if (process.argv[1] && process.argv[1].endsWith('simulator.js')) {
    console.log(JSON.stringify(simulateHuaweiCloudData(), null, 2));
}