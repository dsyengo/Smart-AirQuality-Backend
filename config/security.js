import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import expressMongoSanitize from 'express-mongo-sanitize';

// Rate limiting
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});

// Security middleware
export const securityMiddleware = [
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"]
        }
    }),
    expressMongoSanitize(),
    hpp()
];

// CORS configuration
export const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};