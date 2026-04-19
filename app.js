require('dotenv').config(); const express = require('express'); const cors = require('cors'); const helmet = require('helmet'); const compression = require('compression'); const hpp = require('hpp'); const morgan = require('morgan'); const { config } = require('./config/env'); const connectDB = require('./config/database'); const errorHandler = require('./middlewares/errorHandler'); const rateLimiter = require('./middlewares/rateLimiter'); const routes = require('./routes'); const logger = require('./utils/logger'); const app = express(); connectDB(); app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); var corsOrigin = config.cors.origin; if (typeof corsOrigin === 'string' && corsOrigin === '*') { corsOrigin = true; } app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-app-user-id'], credentials: true })); app.use(compression()); app.use(hpp()); app.use('/api/', rateLimiter); app.use(express.json({ limit: '10mb' })); app.use(express.urlencoded({ extended: true, limit: '10mb' })); if (config.nodeEnv === 'development') { app.use(morgan('dev')); } else { app.use(morgan('combined', { stream: { write: function (message) { logger.info(message.trim()); } } })); } app.set('trust proxy', 1);

// Root health routes (must be before /api routes)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DeepTrust API is running',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'OK'
  });
});

app.use('/api', routes); app.use(function (req, res) { res.status(404).json({ success: false, message: 'Route not found', errorCode: 'ROUTE_NOT_FOUND', path: req.originalUrl }); }); app.use(errorHandler); module.exports = app;