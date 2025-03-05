/**
 * Calculates the Air Quality Index (AQI) based on pollutant measurements.
 * This implementation uses multiple pollutant values and returns the maximum index value as the overall AQI.
 *
 * For each pollutant, a simplified conversion factor is applied:
 * - PM2.5: AQI = pm25 value directly.
 * - PM10: AQI = pm10 * 0.8.
 * - CO: AQI = co * 10.
 * - NO2: AQI = no2 * 0.5.
 *
 * Note: The function expects an object with the following keys:
 * { pm25, pm10, co, no2 }
 *
 * If these keys are missing or if an object with different property names is passed,
 * the default value of 0 will be used, leading to an AQI of 0.
 *
 * @param {Object} measurements - Object containing pollutant data (e.g., { pm25, pm10, co, no2 }).
 * @returns {number} The calculated overall AQI, determined as the maximum individual pollutant index.
 */
export function calculateAQI(measurements) {
    // Destructure the expected properties with default values of 0
    const { pm25 = 0, pm10 = 0, co = 0, no2 = 0 } = measurements;

    const aqiPm25 = Math.round(pm25);
    const aqiPm10 = Math.round(pm10 * 0.8);
    const aqiCo = Math.round(co * 10);
    const aqiNo2 = Math.round(no2 * 0.5);

    // The overall AQI is the maximum of the individual indices.
    return Math.max(aqiPm25, aqiPm10, aqiCo, aqiNo2);
}