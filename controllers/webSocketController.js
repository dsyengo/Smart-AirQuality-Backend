// controllers/webSocketController.js
import { WebSocketServer } from 'ws';
import { realTimeDataService, subscribeToRealTimeData } from '../services/realTimeDataService.js';
import { processSensorData } from '../utils/dataProcessor.js';
import OBSData from '../models/sensor-data.js';

const activeConnections = new Set();

export const initRealtimeDataStream = (server) => {
    const wss = new WebSocketServer({ server });

    const broadcast = (data) => {
        for (const client of activeConnections) {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(data));
            }
        }
    };

    wss.on('connection', async (ws) => {
        activeConnections.add(ws);
        console.log('[WEBSOCKET] Client connected');

        try {
            // Send initial data
            const latestRawData = await realTimeDataService.fetchLatest();
            let formattedData;

            if (latestRawData && latestRawData.length > 0) {
                const processed = processSensorData(latestRawData[0]);
                formattedData = {
                    timestamp: processed.timestamp,
                    aqi: processed.AQI || 0,
                    pollutants: {
                        PM10: processed.rawData?.pm1_0_ppm || 0,
                        PM25: processed.rawData?.pm2_5_ppm || 0,
                        PM10: processed.rawData?.pm10_ppm || 0,
                        O3: processed.rawData?.ozone_ppm || 0,
                        CO: processed.rawData?.co_ppm || 0
                    },
                    temperature: processed.temperature || null,
                    humidity: processed.humidity || null,
                    gps: processed.gps || { latitude: 0, longitude: 0 },
                    buzzer: processed.buzzer || false
                };
            } else {
                const latestDBData = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
                if (latestDBData) {
                    formattedData = {
                        timestamp: latestDBData.timestamp,
                        aqi: latestDBData.AQI || 0,
                        pollutants: {
                            PM10: latestDBData.rawData?.pm1_0_ppm || 0,
                            PM25: latestDBData.rawData?.pm2_5_ppm || 0,
                            PM10: latestDBData.rawData?.pm10_ppm || 0,
                            O3: latestDBData.rawData?.ozone_ppm || 0,
                            CO: latestDBData.rawData?.co_ppm || 0
                        },
                        temperature: processed.temp_celsius || null,
                        humidity: processed.humidity_percent || null,
                        gps: processed.gps || { latitude: gps_lat, longitude: gps_lng },
                        buzzer: processed.buzzer_o || false
                    };
                }
            }

            ws.send(JSON.stringify({
                success: true,
                message: 'Initial data',
                data: formattedData || { message: 'No data available' }
            }));
        } catch (err) {
            console.error('[WEBSOCKET] Initial data error:', err.message);
            ws.send(JSON.stringify({
                success: false,
                message: 'Error fetching initial data'
            }));
        }

        ws.on('close', () => {
            activeConnections.delete(ws);
            console.log('[WEBSOCKET] Client disconnected');
        });

        ws.on('error', (err) => {
            console.error('[WEBSOCKET] Error:', err.message);
            activeConnections.delete(ws);
        });
    });

    // Subscribe to real-time data
    subscribeToRealTimeData(async (newRawData) => {
        try {
            if (!newRawData || !newRawData.length) return;

            const processed = processSensorData(newRawData[0]);
            const update = {
                timestamp: processed.timestamp,
                aqi: processed.AQI || 0,
                pollutants: {
                    PM10: processed.rawData?.pm1_0_ppm || 0,
                    PM25: processed.rawData?.pm2_5_ppm || 0,
                    PM10: processed.rawData?.pm10_ppm || 0,
                    O3: processed.rawData?.ozone_ppm || 0,
                    CO: processed.rawData?.co_ppm || 0
                },
                temperature: processed.temp_celsius || null,
                humidity: processed.humidity_percent || null,
                gps: processed.gps || { latitude: gps_lat, longitude: gps_lng },
                buzzer: processed.buzzer_o || false
            };

            // Broadcast to clients
            broadcast({
                success: true,
                message: 'Real-time update',
                data: update
            });
            console.log('[WEBSOCKET] Broadcasted AQI:', update.aqi);

            // Save to database
            await OBSData.create(processed);
            console.log('[DATABASE] Saved AQI:', processed.AQI);
        } catch (err) {
            console.error('[WEBSOCKET] Data processing error:', err.message);
            broadcast({
                success: false,
                message: 'Error processing data',
                timestamp: new Date().toISOString()
            });
        }
    });

    wss.on('close', () => {
        activeConnections.clear();
        console.log('[WEBSOCKET] Server closed');
    });
};