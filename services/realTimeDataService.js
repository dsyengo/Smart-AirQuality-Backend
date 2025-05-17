// services/realTimeDataService.js
import { EventEmitter } from 'events';
import ObsClient from 'esdk-obs-nodejs';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const OBS_BUCKET = process.env.OBS_BUCKET;
const FILE_KEY = process.env.FILE_KEY;
const REAL_TIME_POLL_INTERVAL = Number(process.env.REAL_TIME_POLL_INTERVAL) || 5000;
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

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
        this.lastTimestamp = null;
        this.isMonitoring = false;
        this.pollingInterval = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
    }

    normalizeTimestamp(timestamp) {
        if (!timestamp) return null;
        try {
            const [date, time] = timestamp.split(' ');
            const [day, month, year] = date.split('/').map(Number);
            const [hour, minute, second] = time.split(':').map(Number);
            const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
            return `${formattedDate}T${formattedTime}Z`;
        } catch (error) {
            console.warn("[REALTIME] Failed to normalize timestamp:", timestamp, error.message);
            return null;
        }
    }

    async fetchLatest() {
        const params = {
            Bucket: OBS_BUCKET,
            Key: FILE_KEY
        };

        if (DEBUG_MODE) {
            console.debug("[DEBUG] Fetching with params:", params);
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

            if (result.CommonMsg.Status === 200) {
                if (!result.InterfaceResult?.Content) {
                    console.warn("[REALTIME] OBS returned 200 but no content");
                    return null;
                }

                const rawContent = result.InterfaceResult.Content.toString();
                let dataArray;

                if (DEBUG_MODE) {
                    try {
                        await fs.writeFile('debug_sensor_data.json', rawContent);
                        console.debug("[DEBUG] Saved raw content to debug_sensor_data.json");
                    } catch (writeError) {
                        console.error("[DEBUG] Failed to write debug_sensor_data.json:", writeError.message);
                    }
                }

                try {
                    dataArray = rawContent
                        .split('\n')
                        .filter(line => line.trim())
                        .map((line, index) => {
                            try {
                                return JSON.parse(line);
                            } catch (lineError) {
                                console.error(`[REALTIME] Failed to parse NDJSON line ${index + 1}:`, lineError.message);
                                return null;
                            }
                        })
                        .filter(item => item !== null);
                    if (DEBUG_MODE) console.debug("[DEBUG] Parsed NDJSON data, length:", dataArray.length);
                } catch (ndjsonError) {
                    console.error("[REALTIME] Failed to parse NDJSON content:", ndjsonError.message);
                    console.error("[DEBUG] Raw content:", rawContent);
                    return null;
                }

                if (!Array.isArray(dataArray)) {
                    console.warn("[REALTIME] Data is not an array");
                    return null;
                }

                if (dataArray.length === 0) {
                    console.warn("[REALTIME] Data array is empty");
                    return null;
                }

                const latestEntry = this.findLatestEntry(dataArray);

                if (latestEntry) {
                    this.consecutiveErrors = 0;
                    console.log("[REALTIME] Found latest entry with timestamp:", latestEntry.timestamp);
                    return [latestEntry];
                } else {
                    if (DEBUG_MODE) console.debug("[DEBUG] No valid entries found");
                    return null;
                }
            }

            console.warn(`[REALTIME] Unexpected OBS status: ${result.CommonMsg.Status}`);
            return null;

        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    findLatestEntry(dataArray) {
        if (!dataArray || dataArray.length === 0) return null;

        let latestEntry = null;
        let latestDate = this.lastTimestamp ? new Date(this.normalizeTimestamp(this.lastTimestamp)) : null;

        for (const entry of dataArray) {
            if (!entry?.timestamp) continue;

            const normalizedTime = this.normalizeTimestamp(entry.timestamp);
            if (!normalizedTime) continue;

            try {
                const entryDate = new Date(normalizedTime);
                if (isNaN(entryDate.getTime())) continue;

                if (!latestDate || entryDate > latestDate) {
                    latestEntry = entry;
                    latestDate = entryDate;
                }
            } catch (dateError) {
                console.warn("[REALTIME] Invalid timestamp format:", entry.timestamp);
                continue;
            }
        }

        if (latestEntry && (!this.lastTimestamp || new Date(this.normalizeTimestamp(latestEntry.timestamp)) > new Date(this.normalizeTimestamp(this.lastTimestamp)))) {
            this.lastTimestamp = latestEntry.timestamp;
            return latestEntry;
        }

        return null;
    }

    handleFetchError(error) {
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

    resetTracking() {
        this.lastTimestamp = null;
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.log("[REALTIME] Monitoring is already running");
            return;
        }

        console.log("[REALTIME] Starting real-time data monitoring");
        this.isMonitoring = true;
        this.retryCount = 0;
        this.consecutiveErrors = 0;

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

        this.initialFetch()
            .then(() => {
                if (DEBUG_MODE) console.debug("[DEBUG] Initial fetch completed successfully");
            })
            .catch(err => {
                console.error(`[REALTIME] Initial fetch failed: ${err.message}`);
            });
    }

    async initialFetch() {
        const params = {
            Bucket: OBS_BUCKET,
            Key: FILE_KEY
        };

        try {
            const result = await global.obsClient.getObject(params);
            if (result.CommonMsg.Status === 200) {
                if (!result.InterfaceResult?.Content) {
                    console.warn('[REALTIME] Initial fetch returned no content');
                    return;
                }

                const rawContent = result.InterfaceResult.Content.toString();
                let dataArray;

                if (DEBUG_MODE) {
                    try {
                        await fs.writeFile('debug_sensor_data_initial.json', rawContent);
                        console.debug("[DEBUG] Saved initial fetch content to debug_sensor_data_initial.json");
                    } catch (writeError) {
                        console.error("[DEBUG] Failed to write debug_sensor_data_initial.json:", writeError.message);
                    }
                }

                try {
                    dataArray = rawContent
                        .split('\n')
                        .filter(line => line.trim())
                        .map((line, index) => {
                            try {
                                return JSON.parse(line);
                            } catch (lineError) {
                                console.error(`[REALTIME] Failed to parse initial fetch NDJSON line ${index + 1}:`, lineError.message);
                                return null;
                            }
                        })
                        .filter(item => item !== null);
                    if (DEBUG_MODE) console.debug("[DEBUG] Parsed initial fetch NDJSON data, length:", dataArray.length);
                } catch (ndjsonError) {
                    console.error("[REALTIME] Failed to parse initial fetch NDJSON content:", ndjsonError.message);
                    console.error("[DEBUG] Initial fetch raw content:", rawContent);
                    return;
                }

                if (!Array.isArray(dataArray)) {
                    console.warn('[REALTIME] Initial fetch data is not an array');
                    return;
                }

                if (dataArray.length === 0) {
                    console.warn('[REALTIME] Initial fetch data array is empty');
                    return;
                }

                const latestEntry = this.findLatestEntry(dataArray);

                if (latestEntry) {
                    this.lastTimestamp = latestEntry.timestamp;
                    if (DEBUG_MODE) {
                        console.debug("[DEBUG] Initial fetch successful. Latest timestamp:", this.lastTimestamp);
                    }
                    this.emit('data', [latestEntry]);
                } else {
                    console.warn('[REALTIME] No valid entries found in initial fetch');
                }
            } else {
                console.error('[DEBUG] Initial fetch response:', result);
                throw new Error(`Initial fetch failed with status ${result.CommonMsg.Status}`);
            }
        } catch (error) {
            console.error('[DEBUG] Initial fetch error details:', error);
            throw error;
        }
    }

    stopMonitoring() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isMonitoring = false;
        if (global.obsClient) {
            try {
                global.obsClient.close();
                console.log('[DEBUG] OBS client closed');
            } catch (error) {
                console.error('[DEBUG] Error closing OBS client:', error.message);
            }
        }
        console.log("[REALTIME] Monitoring stopped");
    }
}

const realTimeService = new RealTimeDataService();

export const realTimeDataService = realTimeService;

export function startRealTimeMonitoring() {
    realTimeService.startMonitoring();
}

export function stopRealTimeMonitoring() {
    realTimeService.stopMonitoring();
}

export function subscribeToRealTimeData(callback) {
    realTimeService.on('data', callback);
    return () => realTimeService.off('data', callback);
}

export function subscribeToErrors(callback) {
    realTimeService.on('error', callback);
    return () => realTimeService.off('error', callback);
}