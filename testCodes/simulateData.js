import { simulateHuaweiCloudData } from './simulateHuawiCloudData.js'
import { EventEmitter } from "events";
import { processDataWithModel } from "../services/huaweiModelService.js";
import isEqual from "lodash.isequal"; // Deep comparison for accurate change detection

// Event emitter to notify subscribers (e.g., WebSockets, API controllers)
const cloudDataEmitter = new EventEmitter();

// Store the most recent Huawei Cloud data
let latestCloudData = null;

// Define polling interval, ensuring it's a number
const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL) || 10000;

/**
 * Fetches simulated data from Huawei Cloud.
 * @returns {Promise<Object|null>} Simulated data or null in case of an error.
 */
export async function fetchCloudData() {
    try {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulated delay

        const data = simulateHuaweiCloudData();

        // Validate data format
        if (!data || typeof data !== "object") {
            throw new Error("Invalid simulated data format: Expected an object.");
        }

        return data;
    } catch (error) {
        console.error("Error fetching simulated Huawei Cloud data:", error);
        return null;
    }
}

/**
 * Checks if the newly fetched data has changed compared to the latest stored data.
 * @param {Object} newData - Newly fetched data
 * @returns {boolean} True if the data has changed, otherwise false.
 */
function hasDataChanged(newData) {
    return !isEqual(newData, latestCloudData);
}

/**
 * Updates cloud data if new changes are detected.
 * Notifies subscribers and sends data for processing.
 */
async function updateCloudData() {
    try {
        const newData = await fetchCloudData();

        if (newData && hasDataChanged(newData)) {
            latestCloudData = newData;
            console.log("New simulated data fetched from Huawei Cloud:", latestCloudData);

            // Emit event to notify subscribers
            cloudDataEmitter.emit("dataUpdated", latestCloudData);

            // Process data with Huawei Cloud model
            await processDataWithModel(latestCloudData);
        }
    } catch (error) {
        console.error("Error updating cloud data:", error);
    }
}

/**
 * Starts polling to monitor Huawei Cloud data.
 * This process continuously fetches and checks for updates at the defined interval.
 */
export function startDataMonitoring() {
    console.log(`Starting Huawei Cloud data monitoring... (Polling every ${POLLING_INTERVAL}ms)`);

    // Initial fetch
    updateCloudData();

    // Set up polling with error handling
    setInterval(async () => {
        try {
            await updateCloudData();
        } catch (error) {
            console.error("Polling error:", error);
        }
    }, POLLING_INTERVAL);
}

/**
 * Retrieves the latest available Huawei Cloud data.
 * @returns {Object|null} The most recent cloud data.
 */
export function getLatestData() {
    return latestCloudData;
}

/**
 * Allows external subscribers (e.g., API routes, WebSockets) to listen for data updates.
 * @param {Function} callback - Callback function triggered when new data is available.
 * @returns {Function} Unsubscribe function to remove the listener when no longer needed.
 */
export function subscribeToDataUpdates(callback) {
    cloudDataEmitter.on("dataUpdated", callback);

    // Return function to allow unsubscription
    return () => cloudDataEmitter.off("dataUpdated", callback);
}