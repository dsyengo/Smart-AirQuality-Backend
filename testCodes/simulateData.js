import { simulateHuaweiCloudData } from './simulateHuawiCloudData.js'
import { EventEmitter } from 'events';
import { processDataWithModel } from '../services/huaweiModelService.js';

// Create an event emitter to broadcast data updates to subscribers (e.g., WebSocket controllers).
const cloudDataEmitter = new EventEmitter();

// This variable stores the most recent data fetched from Huawei Cloud.
let latestCloudData = null;

// Configure the interval (in milliseconds) for polling. Adjust as needed.
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10000; // default every 10 seconds

/**
 * Simulates fetching data from Huawei Cloud by using the simulation utility.
 * @returns {Promise<Object|null>} Returns the simulated data object.
 */
export async function fetchCloudData() {
    try {
        // Simulate network delay if needed
        await new Promise(resolve => setTimeout(resolve, 100));
        // Generate simulated data
        const data = simulateHuaweiCloudData();
        return data;
    } catch (error) {
        console.error('Error fetching simulated Huawei Cloud data:', error);
        return null;
    }
}

/**
 * Compares the newly fetched data with the latest stored data.
 * @param {Object} newData - The newly fetched data.
 * @returns {boolean} True if data has changed, false otherwise.
 */
function hasDataChanged(newData) {
    // Simple comparison logic (can be enhanced for deep comparisons or specific properties).
    return JSON.stringify(newData) !== JSON.stringify(latestCloudData);
}

/**
 * Updates stored cloud data if changes are detected.
 * Also triggers further processing by sending data to the Huawei Cloud model service
 * and emits an event to notify subscribers (e.g., frontend via websockets or API controllers).
 */
async function updateCloudData() {
    const newData = await fetchCloudData();
    if (newData && hasDataChanged(newData)) {
        latestCloudData = newData;
        console.log('New simulated data fetched from Huawei Cloud:', latestCloudData);

        // Emit an event notifying subscribers about the new data.
        cloudDataEmitter.emit('dataUpdated', latestCloudData);

        // Send the updated data to the Huawei Cloud model for further processing.
        processDataWithModel(latestCloudData);
    }
}

/**
 * Starts a polling mechanism that monitors changes in Huawei Cloud data.
 * The process runs continuously at the specified polling interval.
 */
export function startDataMonitoring() {
    // Immediately fetch data once.
    updateCloudData();

    // Setup polling at the specified interval.
    setInterval(updateCloudData, POLLING_INTERVAL);
}

/**
 * Returns the most recent Huawei Cloud data.
 * @returns {Object|null} The latest cloud data.
 */
export function getLatestData() {
    return latestCloudData;
}

/**
 * Allows subscribers (e.g., endpoints or WebSocket controllers) to listen for data updates.
 * @param {Function} callback - Function to call when new data is available.
 */
export function subscribeToDataUpdates(callback) {
    cloudDataEmitter.on('dataUpdated', callback);
}