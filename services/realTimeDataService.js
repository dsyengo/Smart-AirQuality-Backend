import { EventEmitter } from 'events';
import ObsClient from 'esdk-obs-nodejs';
import dotenv from 'dotenv';

dotenv.config();

const OBS_BUCKET = process.env.OBS_BUCKET;
const FILE_KEY = 'sensor-data/data.json';
const REAL_TIME_POLL_INTERVAL = Number(process.env.REAL_TIME_POLL_INTERVAL) || 3000;
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Initialize Huawei OBS Client if not already initialized
if (!global.obsClient) {
    global.obsClient = new ObsClient({
        access_key_id: process.env.OBS_AK,
        secret_access_key: process.env.OBS_SK,
        server: process.env.OBS_ENDPOINT,
    });
    console.log("[INFO] Huawei OBS Client Initialized for Real-Time Service");
}

class RealTimeDataService extends EventEmitter {
    constructor() {
        super();
        this.lastETag = null;
        this.lastModified = null;
        this.lastTimestamp = null;
        this.isMonitoring = false;
        this.pollingInterval = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
    }

    /**
     * Fetches the latest data from OBS and checks for changes
     * @returns {Promise<Array|null>} Array of new entries or null if no changes
     */
    async fetchLatest() {
        const params = {
            Bucket: OBS_BUCKET,
            Key: FILE_KEY,
            IfNoneMatch: this.lastETag,
            IfModifiedSince: this.lastModified
        };

        if (DEBUG_MODE) {
            console.debug("[DEBUG] Fetching with params:", {
                IfNoneMatch: this.lastETag,
                IfModifiedSince: this.lastModified
            });
        }

        try {
            const result = await global.obsClient.getObject(params);

            if (DEBUG_MODE) {
                console.debug("[DEBUG] OBS Response Status:", result.CommonMsg.Status);
                if (result.InterfaceResult) {
                    console.debug("[DEBUG] OBS Headers:", {
                        ETag: result.InterfaceResult.ETag,
                        LastModified: result.InterfaceResult.LastModified,
                        ContentLength: result.InterfaceResult.ContentLength
                    });
                }
            }

            // Handle 304 Not Modified
            if (result.CommonMsg.Status === 304) {
                if (DEBUG_MODE) console.debug("[DEBUG] OBS returned 304 - no changes");
                this.consecutiveErrors = 0;
                return null;
            }

            // Handle 200 OK
            if (result.CommonMsg.Status === 200) {
                if (!result.InterfaceResult?.Content) {
                    console.warn("[REALTIME] OBS returned 200 but no content");
                    return null;
                }

                let dataArray;
                try {
                    dataArray = JSON.parse(result.InterfaceResult.Content.toString());
                    if (DEBUG_MODE) console.debug("[DEBUG] Parsed data length:", dataArray?.length);
                } catch (parseError) {
                    console.error("[REALTIME] Failed to parse OBS content:", parseError.message);
                    return null;
                }

                // Validate data format
                if (!Array.isArray(dataArray)) {
                    console.warn("[REALTIME] Data is not an array - resetting tracking");
                    this.resetTracking();
                    return null;
                }

                // Get current headers
                const currentETag = result.InterfaceResult.ETag;
                const currentLastModified = result.InterfaceResult.LastModified;

                // Verify if content actually changed
                if (currentETag === this.lastETag && currentLastModified === this.lastModified) {
                    if (DEBUG_MODE) console.debug("[DEBUG] ETag and LastModified unchanged despite 200 response");
                    return null;
                }

                // Update tracking headers
                this.lastETag = currentETag;
                this.lastModified = currentLastModified;

                // Find new entries
                const newEntries = this.findNewEntries(dataArray);

                if (newEntries.length > 0) {
                    this.consecutiveErrors = 0;
                    console.log(`[REALTIME] Found ${newEntries.length} new entries`);
                    return newEntries;
                } else {
                    if (DEBUG_MODE) console.debug("[DEBUG] No new entries found");
                    return null;
                }
            }

            // Handle other status codes
            console.warn(`[REALTIME] Unexpected OBS status: ${result.CommonMsg.Status}`);
            return null;

        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    /**
     * Finds new entries in the data array
     * @param {Array} dataArray - Array of data entries
     * @returns {Array} Array of new entries
     */
    findNewEntries(dataArray) {
        const newEntries = [];

        for (const entry of dataArray) {
            if (!entry?.timestamp) continue;

            try {
                const entryDate = new Date(entry.timestamp);
                if (isNaN(entryDate.getTime())) continue;

                if (!this.lastTimestamp || entryDate > new Date(this.lastTimestamp)) {
                    newEntries.push(entry);
                }
            } catch (dateError) {
                console.warn("[REALTIME] Invalid timestamp format:", entry.timestamp);
                continue;
            }
        }

        // Update last timestamp if we found new entries
        if (newEntries.length > 0) {
            const latestEntry = newEntries.reduce((latest, entry) => {
                const entryDate = new Date(entry.timestamp);
                const latestDate = new Date(latest.timestamp);
                return entryDate > latestDate ? entry : latest;
            }, newEntries[0]);

            this.lastTimestamp = latestEntry.timestamp;
        }

        return newEntries;
    }

    /**
     * Handles fetch errors
     * @param {Error} error - The error object
     * @returns {null}
     */
    handleFetchError(error) {
        if (error.code === 'NotModified') {
            if (DEBUG_MODE) console.debug("[DEBUG] OBS client reported NotModified");
            this.consecutiveErrors = 0;
            return null;
        }

        console.error(`[REALTIME-ERROR] Fetch error: ${error.message}`);
        this.consecutiveErrors++;
        this.retryCount++;

        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            console.warn("[REALTIME] Too many consecutive errors - resetting tracking");
            this.resetTracking();
            this.consecutiveErrors = 0;
        }

        if (this.retryCount >= this.maxRetries) {
            this.emit('error', new Error('Max retries reached'));
            this.stopMonitoring();
        }

        return null;
    }

    /**
     * Resets tracking headers and timestamp
     */
    resetTracking() {
        this.lastETag = null;
        this.lastModified = null;
        this.lastTimestamp = null;
    }

    /**
     * Starts the real-time monitoring service
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log("[REALTIME] Monitoring is already running");
            return;
        }

        console.log("[REALTIME] Starting real-time data monitoring");
        this.isMonitoring = true;
        this.retryCount = 0;
        this.consecutiveErrors = 0;

        // Initial fetch to establish baseline
        this.initialFetch()
            .then(() => {
                // Start polling after initial fetch
                this.pollingInterval = setInterval(async () => {
                    try {
                        const latestData = await this.fetchLatest();
                        if (latestData && latestData.length > 0) {
                            this.emit('data', latestData);
                        }
                    } catch (err) {
                        console.error(`[REALTIME] Polling error: ${err.message}`);
                    }
                }, REAL_TIME_POLL_INTERVAL);
            })
            .catch(err => {
                console.error(`[REALTIME] Initial fetch failed: ${err.message}`);
                this.isMonitoring = false;
            });
    }

    /**
     * Performs initial fetch to establish baseline
     */
    async initialFetch() {
        const params = {
            Bucket: OBS_BUCKET,
            Key: FILE_KEY
        };

        const result = await global.obsClient.getObject(params);
        if (result.CommonMsg.Status === 200) {
            this.lastETag = result.InterfaceResult.ETag;
            this.lastModified = result.InterfaceResult.LastModified;

            const dataArray = JSON.parse(result.InterfaceResult.Content.toString());

            if (Array.isArray(dataArray) && dataArray.length > 0) {
                // Get the most recent entry
                const latestEntry = dataArray.reduce((latest, entry) => {
                    const entryDate = new Date(entry.timestamp);
                    const latestDate = new Date(latest.timestamp);
                    return entryDate > latestDate ? entry : latest;
                }, dataArray[0]);

                this.lastTimestamp = latestEntry.timestamp;

                if (DEBUG_MODE) {
                    console.debug("[DEBUG] Initial fetch successful. Latest timestamp:", this.lastTimestamp);
                }

                // Emit the latest data point
                this.emit('data', [latestEntry]);
            }
        } else {
            throw new Error(`Initial fetch failed with status ${result.CommonMsg.Status}`);
        }
    }

    /**
     * Stops the real-time monitoring service
     */
    stopMonitoring() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isMonitoring = false;
        console.log("[REALTIME] Monitoring stopped");
    }
}

// Singleton instance
const realTimeService = new RealTimeDataService();

// Export the singleton instance and main methods
export const realTimeDataService = realTimeService;

/**
 * Starts the real-time data monitoring service
 */
export function startRealTimeMonitoring() {
    realTimeService.startMonitoring();
}

/**
 * Stops the real-time data monitoring service
 */
export function stopRealTimeMonitoring() {
    realTimeService.stopMonitoring();
}

/**
 * Subscribes to real-time data updates
 * @param {Function} callback - Function to call when new data is available
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRealTimeData(callback) {
    realTimeService.on('data', callback);
    return () => realTimeService.off('data', callback);
}

/**
 * Subscribes to error events
 * @param {Function} callback - Function to call when errors occur
 * @returns {Function} Unsubscribe function
 */
export function subscribeToErrors(callback) {
    realTimeService.on('error', callback);
    return () => realTimeService.off('error', callback);
}