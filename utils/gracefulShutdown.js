import WebSocket from 'ws';
import { stopRealTimeMonitoring } from '../services/realTimeDataService.js';

export function setupGracefulShutdown(server, wss, mongoose) {
    const shutdownSignals = ['SIGTERM', 'SIGINT'];

    // Track active HTTP connections
    const connections = new Set();

    server.on('connection', (conn) => {
        connections.add(conn);
        conn.on('close', () => connections.delete(conn));
    });

    shutdownSignals.forEach((signal) => {
        console.log(`[DEBUG] Registering handler for ${signal}`);

        process.on(signal, async () => {
            console.log(`[DEBUG] Received ${signal}, shutting down gracefully...`);

            const shutdownTimeout = setTimeout(() => {
                console.error('[DEBUG] Shutdown timeout reached. Forcing exit.');
                process.exit(1);
            }, 5000);

            try {
                // Stop monitoring (clear intervals/timers, close streams, etc.)
                console.log('[DEBUG] Stopping real-time monitoring');
                await stopRealTimeMonitoring();

                // Close WebSocket clients and server
                if (wss) {
                    console.log('[DEBUG] Closing WebSocket clients');
                    for (const client of wss.clients) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.terminate(); // safer than client.close()
                        }
                    }

                    await new Promise((resolve) => wss.close(resolve));
                    console.log('[DEBUG] WebSocket server closed');
                }

                // Close MongoDB connection
                if (mongoose && mongoose.connection) {
                    console.log('[DEBUG] Closing MongoDB connection');
                    await mongoose.connection.close();
                    console.log('[DEBUG] MongoDB connection closed');
                }

                // Destroy open HTTP connections
                console.log(`[DEBUG] Destroying ${connections.size} active HTTP connections`);
                for (const conn of connections) {
                    conn.destroy();
                }

                // Close HTTP server
                console.log('[DEBUG] Closing HTTP server');
                await new Promise((resolve) => server.close(resolve));
                console.log('[DEBUG] HTTP server closed');

                clearTimeout(shutdownTimeout);
                console.log('[DEBUG] Graceful shutdown complete. Exiting.');
                process.exit(0);

            } catch (err) {
                console.error('[DEBUG] Error during shutdown:', err);
                clearTimeout(shutdownTimeout);
                process.exit(1);
            }
        });
    });
}
