import {
    startRealTimeMonitoring,
    subscribeToRealTimeData,
    realTimeDataService
} from '../services/realTimeDataService.js';
import { calculateAQI } from '../utils/aqiCalculator.js';
import OBSData from '../models/sensor-data.js';
import WebSocket from 'ws';

// Initialize real-time monitoring (only once)
startRealTimeMonitoring();

// Store active WebSocket connections
const activeConnections = new Set();

// Data processing helper
const processSensorData = (sensorData) => {
    // Safely extract AQI parameters with defaults
    const aqiParams = {
        PM2_5: sensorData?.pm25 || 0,
        PM10: sensorData?.pm10 || 0,
        NO2: sensorData?.no2 || 0,
        SO2: sensorData?.so2 || 0,
        CO: sensorData?.co || 0
    };

    return {
        rawData: sensorData,
        AQI: calculateAQI(aqiParams),
        timestamp: sensorData?.timestamp || new Date().toISOString()
    };
};

/**
 * HTTP Controller - Gets latest available data
 */
export const getLatestData = async (req, res, next) => {
    try {
        // Trust the service to provide only new data
        const latestData = await realTimeDataService.fetchLatest();

        if (!latestData || latestData.length === 0) {
            return res.status(503).json({
                success: false,
                message: 'No new data available'
            });
        }

        // Process the most recent entry
        const result = await OBSData.create(
            processSensorData(latestData[latestData.length - 1])
        );

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * WebSocket Controller - Handles real-time connections
 */
export const initRealtimeDataStream = (server) => {
    const wss = new WebSocket.Server({ server });

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
            // Process all new entries (service already filtered them)
            for (const data of newDataArray) {
                const result = await OBSData.create(processSensorData(data));
                broadcast({ success: true, data: result });
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

        // Initial connection message
        ws.send(JSON.stringify({
            success: true,
            message: 'Connected to real-time stream',
            lastUpdate: realTimeDataService.lastTimestamp
        }));

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