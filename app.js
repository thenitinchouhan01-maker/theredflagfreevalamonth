require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const { config } = require('./config/env');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORS Configuration - Mobile App Friendly
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Allows:
// - Mobile apps (no origin header)
// - Configured web origins
// - Razorpay payment gateway
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, Razorpay)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // In production, check configured origins
    const allowedOrigins = config.cors.origin;
    if (allowedOrigins === '*' || allowedOrigins === true) {
      return callback(null, true);
    }
    
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Reject unknown origins in production
    logger.warn('CORS blocked origin', { origin, ip: origin });
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-device-id',
    'x-app-user-id',
    'x-razorpay-signature'  // For webhook (future use)
  ],
  credentials: true,
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));

app.use(compression());
app.use(hpp());
app.use('/api/', rateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SECURITY FIX: Add NoSQL injection and XSS protection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('NoSQL injection attempt detected', {
      ip: req.ip,
      key: key,
      url: req.originalUrl
    });
  }
}));
app.use(xss()); if (config.nodeEnv === 'development') { app.use(morgan('dev')); } else { app.use(morgan('combined', { stream: { write: function (message) { logger.info(message.trim()); } } })); } app.set('trust proxy', 1);

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