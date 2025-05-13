import {
    startRealTimeMonitoring,
    subscribeToRealTimeData,
    realTimeDataService
} from '../services/realTimeDataService.js';
import { calculateAQI } from '../utils/aqiCalculator.js';
import OBSData from '../models/sensor-data.js';
import WebSocket, { WebSocketServer } from 'ws';

// Initialize real-time monitoring (only once)
startRealTimeMonitoring();

// Store active WebSocket connections
const activeConnections = new Set();

// Data processing helper
const processSensorData = (sensorData) => {
    // Safely extract AQI parameters with defaults
    const aqiParams = {
        pm25: sensorData.pms5003Dust,
        pm10: sensorData.pms5003Dust,
        no2: sensorData.no2 || 20,
        so2: sensorData.so2 || 20,
        co: sensorData.mq7CO || 10
    };

    console.log('AQI parameters:', aqiParams);
    const AQILevels = calculateAQI(aqiParams);

    console.log('Calculated AQI:', AQILevels);
    return {
        rawData: sensorData,
        AQI: AQILevels,
        timestamp: sensorData.rtcTime || new Date().toISOString()
    };
};

/**
 * HTTP Controller - Gets latest available data
 */
export const getLatestData = async (req, res, next) => {
    try {
        // Try to get new data first
        const latestData = await realTimeDataService.fetchLatest();

        let result;

        if (latestData && latestData.length > 0) {
            // Process the most recent entry if new data exists
            result = await OBSData.create(
                processSensorData(latestData[latestData.length - 1])
            );
        } else {
            // If no new data, get the previous latest data from database
            result = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);

            if (!result) {
                return res.status(503).json({
                    success: false,
                    message: 'No data available'
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * WebSocket Controller - Handles real-time connections
 */
export const initRealtimeDataStream = (server) => {
    const wss = new WebSocketServer({ server });

    // Broadcast helper
    const broadcast = (data) => {
        activeConnections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    };

    // Single subscription for all real-time updates
    let dataSubscription = subscribeToRealTimeData(async (newDataArray) => {
        try {
            // If we have new data, process and broadcast it
            if (newDataArray && newDataArray.length > 0) {
                for (const data of newDataArray) {
                    const result = await OBSData.create(processSensorData(data));
                    broadcast({ success: true, data: result });
                }
            } else {
                // If no new data, send the latest from database
                const latestData = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
                if (latestData) {
                    broadcast({ success: true, data: latestData });
                }
            }
        } catch (error) {
            console.error('Data processing error:', error);
            broadcast({
                success: false,
                message: 'Data processing error',
                timestamp: new Date().toISOString()
            });
        }
    });

    // New connection handler
    wss.on('connection', (ws) => {
        activeConnections.add(ws);

        // Send the latest data immediately on connection
        (async () => {
            try {
                const latestData = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
                if (latestData) {
                    ws.send(JSON.stringify({
                        success: true,
                        message: 'Connected to real-time stream',
                        data: latestData,
                        lastUpdate: realTimeDataService.lastTimestamp
                    }));
                } else {
                    ws.send(JSON.stringify({
                        success: true,
                        message: 'Connected to real-time stream (no data available yet)',
                        lastUpdate: realTimeDataService.lastTimestamp
                    }));
                }
            } catch (error) {
                console.error('Error sending initial data:', error);
                ws.send(JSON.stringify({
                    success: false,
                    message: 'Error retrieving initial data'
                }));
            }
        })();

        // Cleanup on close
        ws.on('close', () => {
            activeConnections.delete(ws);
            if (activeConnections.size === 0) {
                dataSubscription?.(); // Unsubscribe when no clients
                dataSubscription = null;
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            activeConnections.delete(ws);
        });
    });

    // Periodic cleanup
    const cleanupInterval = setInterval(() => {
        activeConnections.forEach(client => {
            if (client.readyState !== WebSocket.OPEN) {
                activeConnections.delete(client);
            }
        });

        // Resubscribe if needed
        if (activeConnections.size > 0 && !dataSubscription) {
            dataSubscription = subscribeToRealTimeData(/*...*/);
        }
    }, 30000);

    // Cleanup on server shutdown
    wss.on('close', () => {
        clearInterval(cleanupInterval);
        dataSubscription?.();
        activeConnections.clear();
    });
};

/**
 * System Status Endpoint
 */
export const getConnectionStatus = (req, res) => {
    res.json({
        success: true,
        status: realTimeDataService.isMonitoring ? 'active' : 'inactive',
        lastUpdate: realTimeDataService.lastTimestamp,
        activeConnections: activeConnections.size,
        pollingInterval: process.env.REAL_TIME_POLL_INTERVAL || 3000
    });
};