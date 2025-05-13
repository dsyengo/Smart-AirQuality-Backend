export function setupGracefulShutdown(server, wss, mongoose) {
    const shutdownSignals = ['SIGINT', 'SIGTERM'];
    let isShuttingDown = false;

    shutdownSignals.forEach(signal => {
        process.on(signal, async () => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            console.log(`\n[${new Date().toISOString()}] Received ${signal}, shutting down...`);

            // 1. Close HTTP server and active connections
            if (server) {
                console.log('Closing HTTP server...');
                server.close(() => {
                    console.log('HTTP server closed');
                });

                // Force close active connections (Node.js 12.9.0+)
                server.getConnections((err, count) => {
                    if (!err && count > 0) {
                        console.log(`Closing ${count} active connections`);
                        server.closeAllConnections();
                    }
                });
            }

            // 2. Close WebSocket server
            if (wss) {
                console.log('Closing WebSocket connections...');
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.terminate(); // More forceful than close()
                    }
                });
                wss.close(() => {
                    console.log('WebSocket server closed');
                });
            }

            // 3. Close database connections
            if (mongoose) {
                console.log('Closing database connections...');
                await mongoose.disconnect().catch(err => {
                    console.error('Error closing MongoDB:', err);
                });
            }

            // 4. Force exit after timeout
            setTimeout(() => {
                console.error('Could not close gracefully, forcing exit');
                process.exit(1);
            }, 10000).unref(); // unref prevents the timer from keeping event loop active
        });
    });

    // Handle uncaught exceptions/rejections
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        if (!isShuttingDown) process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection:', reason);
        if (!isShuttingDown) process.exit(1);
    });
}