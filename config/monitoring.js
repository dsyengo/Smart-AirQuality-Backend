import prometheusBundle from 'express-prom-bundle';

// Prometheus metrics configuration
export const metricsMiddleware = prometheusBundle({
    includeMethod: true,
    includePath: true,
    customLabels: { project: 'air_quality_monitor' },
    promClient: {
        collectDefaultMetrics: {
            timeout: 1000
        }
    }
});

// Health check response
export const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            database: true,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        }
    });
};