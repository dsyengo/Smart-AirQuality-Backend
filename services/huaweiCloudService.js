import { EventEmitter } from 'events';
import { processDataWithModel } from '../services/huaweiModelService.js';
import ObsClient from 'esdk-obs-nodejs';
import dotenv from 'dotenv';


dotenv.config();

const OBS_BUCKET = process.env.OBS_BUCKET;
const FILE_KEY = 'sensor-data/data.json';

// Initialize Huawei OBS Client if not already initialized
if (!global.obsClient) {
    global.obsClient = new ObsClient({
        access_key_id: process.env.OBS_AK,
        secret_access_key: process.env.OBS_SK,
        server: process.env.OBS_ENDPOINT,
    });
    console.log("[INFO] Huawei OBS Client Initialized");
}

// Create an event emitter to broadcast data updates
const cloudDataEmitter = new EventEmitter();

// Stores the latest processed timestamp
let lastProcessedTimestamp = null;

// Polling interval (in milliseconds)
const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL) || 10000; // Default 10 seconds

/**
 * Fetches the latest sensor data from Huawei Cloud.
 * @returns {Promise<Object|null>} The latest data object or null if no new data is available.
 */
export async function fetchLatestCloudData() {
    console.log("[INFO] Fetching data from OBS...");
    const params = {
        Bucket: OBS_BUCKET,
        Key: FILE_KEY,
    };

    try {
        const result = await global.obsClient.getObject(params);
        if (result.CommonMsg.Status <= 300) {
            console.log("[INFO] Data successfully retrieved from OBS");

            // Parse and sort data by timestamp
            const allData = JSON.parse(result.InterfaceResult.Content.toString());

            if (Array.isArray(allData) && allData.length > 0) {
                // Find the latest timestamp record
                const latestData = allData.reduce((latest, record) => {
                    return new Date(record.timestamp) > new Date(latest.timestamp) ? record : latest;
                }, allData[0]);

                return latestData;
            }
            return null;
        } else {
            console.error("[ERROR] Failed to retrieve data from OBS:", result.CommonMsg);
            return null;
        }
    } catch (error) {
        console.error(`[ERROR] OBS Fetch Error: ${error.message}`);
        return null;
    }
}

/**
 * Checks for new sensor records and processes only the latest one.
 */
async function updateCloudData() {
    const latestData = await fetchLatestCloudData();

    if (latestData && (!lastProcessedTimestamp || new Date(latestData.timestamp) > new Date(lastProcessedTimestamp))) {
        console.log("[INFO] New record detected:", JSON.stringify(latestData, null, 2));

        // Emit the latest data
        cloudDataEmitter.emit('dataUpdated', latestData);
        processDataWithModel(latestData);

        // Update last processed timestamp
        lastProcessedTimestamp = latestData.timestamp;
    }
}

/**
 * Starts monitoring Huawei Cloud data for updates.
 */
export function startDataMonitoring() {
    updateCloudData(); // Initial fetch
    setInterval(updateCloudData, POLLING_INTERVAL);
}

/**
 * Allows subscribers to listen for new sensor data updates.
 * @param {Function} callback - Function to call when new data is available.
 */
export function subscribeToDataUpdates(callback) {
    cloudDataEmitter.on('dataUpdated', callback);
}