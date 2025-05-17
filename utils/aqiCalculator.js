// ../utils/aqiCalculator.js

// EPA and custom breakpoints for each pollutant
const breakpoints = {
    pm1: [
        { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 8.0 },
        { aqiLow: 51, aqiHigh: 100, concLow: 8.1, concHigh: 20.0 },
        { aqiLow: 101, aqiHigh: 150, concLow: 20.1, concHigh: 35.0 },
        { aqiLow: 151, aqiHigh: 200, concLow: 35.1, concHigh: 90.0 },
        { aqiLow: 201, aqiHigh: 300, concLow: 90.1, concHigh: 150.0 },
        { aqiLow: 301, aqiHigh: 500, concLow: 150.1, concHigh: 300.0 },
    ],
    pm25: [
        { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 12.0 },
        { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
        { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
        { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
        { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
        { aqiLow: 301, aqiHigh: 500, concLow: 250.5, concHigh: 500.4 },
    ],
    pm10: [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 54 },
        { aqiLow: 51, aqiHigh: 100, concLow: 55, concHigh: 154 },
        { aqiLow: 101, aqiHigh: 150, concLow: 155, concHigh: 254 },
        { aqiLow: 151, aqiHigh: 200, concLow: 255, concHigh: 354 },
        { aqiLow: 201, aqiHigh: 300, concLow: 355, concHigh: 424 },
        { aqiLow: 301, aqiHigh: 500, concLow: 425, concHigh: 604 },
    ],
    o3: [
        { aqiLow: 0, aqiHigh: 50, concLow: 0.000, concHigh: 0.054 },
        { aqiLow: 51, aqiHigh: 100, concLow: 0.055, concHigh: 0.070 },
        { aqiLow: 101, aqiHigh: 150, concLow: 0.071, concHigh: 0.085 },
        { aqiLow: 151, aqiHigh: 200, concLow: 0.086, concHigh: 0.105 },
        { aqiLow: 201, aqiHigh: 300, concLow: 0.106, concHigh: 0.200 },
        { aqiLow: 301, aqiHigh: 500, concLow: 0.201, concHigh: 0.500 },
    ],
    co: [
        { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 4.4 },
        { aqiLow: 51, aqiHigh: 100, concLow: 4.5, concHigh: 9.4 },
        { aqiLow: 101, aqiHigh: 150, concLow: 9.5, concHigh: 12.4 },
        { aqiLow: 151, aqiHigh: 200, concLow: 12.5, concHigh: 15.4 },
        { aqiLow: 201, aqiHigh: 300, concLow: 15.5, concHigh: 30.4 },
        { aqiLow: 301, aqiHigh: 500, concLow: 30.5, concHigh: 50.4 },
    ],
};

// Rounding rules for concentrations
const roundConcentration = (pollutant, value) => {
    if (value < 0) return 0; // Handle negative values
    switch (pollutant) {
        case 'pm1':
        case 'pm25':
            return Math.round(value * 10) / 10; // 1 decimal place
        case 'pm10':
            return Math.round(value); // Integer
        case 'o3':
            return Math.round(value * 1000) / 1000; // 3 decimal places
        case 'co':
            return Math.round(value * 10) / 10; // 1 decimal place
        default:
            return value;
    }
};

// Calculate AQI for a single pollutant
const calculatePollutantAQI = (pollutant, concentration) => {
    const roundedConc = roundConcentration(pollutant, concentration);
    const bp = breakpoints[pollutant];

    // Find the appropriate breakpoint
    for (const { aqiLow, aqiHigh, concLow, concHigh } of bp) {
        if (roundedConc >= concLow && roundedConc <= concHigh) {
            return Math.round(
                ((aqiHigh - aqiLow) / (concHigh - concLow)) * (roundedConc - concLow) + aqiLow
            );
        }
    }

    // Handle out-of-range values
    if (roundedConc < bp[0].concLow) return 0;
    if (roundedConc > bp[bp.length - 1].concHigh) return 500;
    return 0; // Default
};

/**
 * Calculate AQI based on EPA methodology for PM1.0, PM2.5, PM10, O3, and CO.
 * @param {Object} measurements - Object containing { pm10, pm25, pm10, o3, co }.
 * @returns {number} The overall AQI level.
 */
export function calculateAQI(measurements = {}) {
    console.log("DEBUG - Input measurements:", measurements);
    const { pm1 = 0, pm25 = 0, pm10 = 0, o3 = 0, co = 0 } = measurements;

    // Calculate AQI for each pollutant
    const aqiValues = {
        pm1: calculatePollutantAQI('pm1', pm1),
        pm25: calculatePollutantAQI('pm25', pm25),
        pm10: calculatePollutantAQI('pm10', pm10),
        o3: calculatePollutantAQI('o3', o3),
        co: calculatePollutantAQI('co', co),
    };

    // Return the maximum AQI
    return Math.max(...Object.values(aqiValues));
}