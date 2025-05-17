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
                try {
                    client.send(JSON.stringify(data));
                } catch (err) {
                    console.error('[WEBSOCKET] Broadcast error:', err.message);
                }
            }
        }
    };

    wss.on('connection', async (ws) => {
        activeConnections.add(ws);
        console.log('[WEBSOCKET] Client connected');

        try {
            let formattedData = null;

            // Try real-time data first
            const latestRawData = await realTimeDataService.fetchLatest();
            if (latestRawData && latestRawData.length > 0) {
                try {
                    const processed = processSensorData(latestRawData[0]);
                    formattedData = {
                        timestamp: processed.timestamp,
                        aqi: processed.AQI || 0,
                        pollutants: {
                            PM1_0: processed.rawData?.pm1_0_ppm || 0,
                            PM2_5: processed.rawData?.pm2_5_ppm || 0,
                            PM10: processed.rawData?.pm10_ppm || 0,
                            O3: processed.rawData?.ozone_ppm || 0,
                            CO: processed.rawData?.co_ppm || 0
                        },
                        temperature: processed.temperature || null,
                        humidity: processed.humidity || null,
                        gps: processed.gps || { latitude: processed.rawData?.gps_lat || 0, longitude: processed.rawData?.gps_lng || 0 },
                        buzzer: processed.buzzer_o || false
                    };
                    console.log('[WEBSOCKET] Real-time data processed:', formattedData);
                } catch (processError) {
                    console.error('[WEBSOCKET] Error processing real-time data:', processError.message);
                }
            }

            // Fallback to database
            if (!formattedData) {
                const latestDBData = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
                if (latestDBData) {
                    try {
                        const processed = processSensorData(latestDBData.toObject());
                        formattedData = {
                            timestamp: processed.timestamp,
                            aqi: processed.AQI || 0,
                            pollutants: {
                                PM1_0: processed.rawData?.pm1_0_ppm || 0,
                                PM2_5: processed.rawData?.pm2_5_ppm || 0,
                                PM10: processed.rawData?.pm10_ppm || 0,
                                O3: processed.rawData?.ozone_ppm || 0,
                                CO: processed.rawData?.co_ppm || 0
                            },
                            temperature: processed.temperature || null,
                            humidity: processed.humidity || null,
                            gps: processed.gps || { latitude: processed.rawData?.gps_lat || 0, longitude: processed.rawData?.gps_lng || 0 },
                            buzzer: processed.buzzer_o || false
                        };
                    } catch (processError) {
                        console.error('[WEBSOCKET] Error processing database data:', processError.message);
                    }
                }
            }

            ws.send(JSON.stringify({
                success: !!formattedData,
                message: formattedData ? 'Initial data' : 'No data available',
                data: formattedData || {}
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

    // Handle real-time updates
    subscribeToRealTimeData(async (newRawData) => {
        try {
            if (!newRawData || !newRawData.length) {
                console.warn('[WEBSOCKET] No new data received');
                return;
            }

            const processed = processSensorData(newRawData[0]);
            const update = {
                timestamp: processed.timestamp,
                aqi: processed.AQI || 0,
                pollutants: {
                    PM1_0: processed.rawData?.pm1_0_ppm || 0,
                    PM2_5: processed.rawData?.pm2_5_ppm || 0,
                    PM10: processed.rawData?.pm10_ppm || 0,
                    O3: processed.rawData?.ozone_ppm || 0,
                    CO: processed.rawData?.co_ppm || 0
                },
                temperature: processed.temperature || null,
                humidity: processed.humidity || null,
                gps: processed.gps || { latitude: processed.rawData?.gps_lat || 0, longitude: processed.rawData?.gps_lng || 0 },
                buzzer: processed.buzzer_o || false
            };



            // Broadcast first
            broadcast({
                success: true,
                message: 'Real-time update',
                data: update
            });
            console.log('[WEBSOCKET] Broadcasted AQI:', update.aqi);

            // Save to database
            try {
                await OBSData.create(processed);
                console.log('[DATABASE] Saved AQI:', processed.AQI);
            } catch (dbError) {
                console.error('[DATABASE] Save error:', dbError.message);
            }
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