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
  origin: function(origin, callback) {
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'x-app-user-id',
    'Authorization',
  ],
  credentials: true,
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
app.use(xss());

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: function (message) {
        logger.info(message.trim());
      }
    }
  }));
}

app.set('trust proxy', 1);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request logging middleware - logs every incoming request for debugging
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use((req, res, next) => {
  const start = Date.now();
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    appUserId: req.headers['x-app-user-id'] || null,
    deviceId: req.headers['x-device-id'] || null
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration + 'ms',
      ip: req.ip
    });
  });

  next();
});

// Root health routes (must be before /api routes)
app.get('/ping', (req, res) => {
  res.send('pong');
});

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

app.use('/api', routes);

// 404 handler for unmatched routes
app.use(function (req, res) {
  logger.warn('Route not found', { method: req.method, url: req.originalUrl, ip: req.ip });
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errorCode: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

app.use(errorHandler);

module.exports = app;