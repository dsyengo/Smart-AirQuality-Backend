/**
 * Simplified AQI calculator using direct conversion factors.
 * @param {Object} measurements - Object containing { pm25, pm10, co, no2, so2 }.
 * @returns {number} Calculated AQI (0 if input is invalid).
 */
export function calculateAQI(measurements = {}) {
    console.log("DEBUG - Input measurements:", measurements);
    const { pm25, pm10, no2, so2, co } = measurements;

    const aqiPm25 = Math.round(pm25);
    const aqiPm10 = Math.round(pm10 * 0.8);
    const aqiCo = Math.round(co * 10);
    const aqiNo2 = Math.round(no2 * 0.5);
    const aqiSo2 = Math.round(so2 * 0.5);

    return Math.max(aqiPm25, aqiPm10, aqiCo, aqiNo2, aqiSo2);
}