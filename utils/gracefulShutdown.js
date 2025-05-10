import { stopRealTimeMonitoring } from '../services/realTimeDataService.js';

export function setupGracefulShutdown(server) {
    const shutdownSignals = ['SIGTERM', 'SIGINT'];

    shutdownSignals.forEach(signal => {
        process.on(signal, () => {
            console.log(`Received ${signal}, shutting down gracefully...`);

            // Stop real-time monitoring first
            stopRealTimeMonitoring();

            // Close server
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });

            // Force shutdown if hanging
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 5000);
        });
    });
}