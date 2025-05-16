import { WebSocketServer } from 'ws';
import { realTimeDataService } from '../services/realTimeDataService.js';
import OBSData from '../models/sensor-data.js';
import { processSensorData } from './dataMonitor.js';

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
        console.log('WebSocket client connected');

        try {
            let formattedData;
            const latestRawData = await realTimeDataService.fetchLatest();

            if (latestRawData && latestRawData.length > 0) {
                const processed = processSensorData(latestRawData[latestRawData.length - 1]);
                formattedData = {
                    timestamp: processed.timestamp,
                    aqi: processed.AQI || 0, // Use AQI directly
                    pollutants: {
                        PM25: processed.rawData?.pms5003Dust || 0,
                        PM10: processed.rawData?.pms5003Dust || 0,
                        NO2: processed.rawData?.no2 || 0,
                        CO: processed.rawData?.mq7CO || 0,
                        SO2: processed.rawData?.so2 || 0,
                        O3: processed.rawData?.mq131Ozone || 0,
                    },
                    temperature: processed.temperature || null,
                    humidity: processed.humidity || null,
                };
            } else {
                const latestDBData = await OBSData.findOne().sort({ timestamp: -1 }).limit(1);
                if (latestDBData) {
                    formattedData = {
                        timestamp: latestDBData.timestamp,
                        aqi: latestDBData.AQI || 0, // Use AQI directly
                        pollutants: {
                            PM25: latestDBData.rawData?.pms5003Dust || 0,
                            PM10: latestDBData.rawData?.pms5003Dust || 0,
                            NO2: latestDBData.rawData?.no2 || 30,
                            CO: latestDBData.rawData?.mq7CO || 0,
                            SO2: latestDBData.rawData?.so2 || 20,
                            O3: latestDBData.rawData?.mq131Ozone || 0,
                        },
                        temperature: latestDBData.rawData?.dht11Temperature || null,
                        humidity: latestDBData.rawData?.dht11Humidity || null,
                    };
                }
            }

            if (formattedData) {
                ws.send(JSON.stringify({
                    success: true,
                    message: 'Initial data',
                    data: formattedData,
                }));
            } else {
                ws.send(JSON.stringify({
                    success: false,
                    message: 'No data available in real-time or database',
                }));
            }
        } catch (err) {
            console.error('Initial data error:', err);
            ws.send(JSON.stringify({
                success: false,
                message: 'Error fetching initial data',
            }));
        }

        ws.on('close', () => {
            activeConnections.delete(ws);
            console.log('WebSocket client disconnected');
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
            activeConnections.delete(ws);
        });
    });

    realTimeDataService.on('data', async (newRawData) => {
        try {
            const processed = processSensorData(newRawData);

            const update = {
                timestamp: processed.timestamp,
                aqi: processed.AQI || 0, // Use AQI directly
                pollutants: {
                    PM25: processed.rawData?.pms5003Dust || 0,
                    PM10: processed.rawData?.pms5003Dust || 0,
                    NO2: processed.rawData?.no2 || 10, // Will use processSensorData default (30)
                    CO: processed.rawData?.mq7CO || 0,
                    SO2: processed.rawData?.so2 || 5, // Will use processSensorData default (35)
                    O3: processed.rawData?.mq131Ozone || 0,
                },
                temperature: processed.temperature || null,
                humidity: processed.humidity || null,
            };
            console.log("UPdate sent to UI:", update);
            await OBSData.create(processed); // Save to database
            broadcast({
                success: true,
                message: 'Real-time update',
                data: update,
            });
        } catch (err) {
            console.error('Realtime data processing error:', err);
            broadcast({
                success: false,
                message: 'Error processing data',
                timestamp: new Date().toISOString(),
            });
        }
    });

    wss.on('close', () => {
        activeConnections.clear();
        console.log('WebSocket server closed');
    });
};