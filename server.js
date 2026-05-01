require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { config, validateEnv, getConfigSummary } = require('./config/env');
const logger = require('./utils/logger');

// Validate environment variables before starting
validateEnv();

// ✅ RAILWAY OPTIMIZATION: Use Railway's dynamic PORT
const PORT = parseInt(process.env.PORT) || config.port || 3000;
const MAX_PORT_ATTEMPTS = process.env.NODE_ENV === 'production' ? 1 : 10;
let server = null;

console.log('🚀 [RAILWAY] Starting server...');
console.log('🚀 [RAILWAY] PORT:', PORT);
console.log('🚀 [RAILWAY] NODE_ENV:', process.env.NODE_ENV || 'development');

/**
 * 🧹 PERMANENT FIX: Clean payment collection and ensure correct indexes
 */
const fixPaymentCollection = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('🧹 Fixing payment collection...');

    // Delete bad records with null/empty razorpayOrderId
    const deleteResult = await collection.deleteMany({
      $or: [
        { razorpayOrderId: null },
        { razorpayOrderId: '' },
        { razorpayOrderId: { $exists: false } }
      ]
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} bad payment record(s)`);
    }

    // Create correct index (will skip if already exists)
    await collection.createIndex(
      { razorpayOrderId: 1 },
      { unique: true, sparse: true }
    );

    console.log('✅ Payment DB ready');

  } catch (err) {
    console.error('❌ Fix error:', err.message);
  }
};

// Run fix after MongoDB connection is established
mongoose.connection.once('open', () => {
  console.log('✅ MongoDB connection established');
  fixPaymentCollection();
});

/**
 * Find available port starting from the configured port
 * @param {number} startPort - Starting port number
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>} Available port number
 */
async function findAvailablePort(startPort, maxAttempts = MAX_PORT_ATTEMPTS) {
  const net = require('net');
  
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    
    const isAvailable = await new Promise((resolve) => {
      const testServer = net.createServer();
      
      testServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      testServer.once('listening', () => {
        testServer.close();
        resolve(true);
      });
      
      testServer.listen(port);
    });
    
    if (isAvailable) {
      return port;
    }
  }
  
  throw new Error(`No available port found after trying ${maxAttempts} ports starting from ${startPort}`);
}

/**
 * Start the server - Railway optimized
 */
async function startServer() {
  try {
    // ✅ RAILWAY: In production, use exact PORT provided by Railway
    if (process.env.NODE_ENV === 'production') {
      // Railway provides exact port - don't search for alternatives
      server = app.listen(PORT, '0.0.0.0', () => {
        const configSummary = getConfigSummary();
        
        console.log('\n' + '='.repeat(60));
        console.log('  🚀 DeepTrust API Server Started (Railway)');
        console.log('='.repeat(60));
        console.log(`  Environment:     ${configSummary.environment}`);
        console.log(`  Port:            ${PORT}`);
        console.log(`  Database:        ${configSummary.database}`);
        console.log(`  Razorpay:        ${configSummary.razorpay}`);
        console.log(`  Storage:         ${configSummary.storage}`);
        console.log(`  CORS:            ${configSummary.cors}`);
        console.log('='.repeat(60));
        console.log(`  Health Check:    /health`);
        console.log(`  API Base:        /api`);
        console.log('='.repeat(60) + '\n');
        
        logger.info('DeepTrust API server running on Railway', {
          port: PORT,
          environment: config.nodeEnv
        });
      });
    } else {
      // Development: Find available port
      const availablePort = await findAvailablePort(PORT);
      
      if (availablePort !== PORT) {
        console.log(`\n⚠️  Port ${PORT} is already in use. Using port ${availablePort} instead.\n`);
        logger.warn(`Port ${PORT} in use, switching to ${availablePort}`);
      }
      
      server = app.listen(availablePort, () => {
        const configSummary = getConfigSummary();
        
        console.log('\n' + '='.repeat(60));
        console.log('  🚀 DeepTrust API Server Started');
        console.log('='.repeat(60));
        console.log(`  Environment:     ${configSummary.environment}`);
        console.log(`  Port:            ${availablePort}`);
        console.log(`  Database:        ${configSummary.database}`);
        console.log(`  Razorpay:        ${configSummary.razorpay}`);
        console.log(`  Storage:         ${configSummary.storage}`);
        console.log(`  CORS:            ${configSummary.cors}`);
        console.log(`  Real Credentials: ${configSummary.hasRealCredentials ? '✅ Yes' : '⚠️  No (using test values)'}`);
        console.log('='.repeat(60));
        console.log(`  Health Check:    http://localhost:${availablePort}/health`);
        console.log(`  API Base:        http://localhost:${availablePort}/api`);
        console.log('='.repeat(60) + '\n');
        
        logger.info('DeepTrust API server running', {
          port: availablePort,
          environment: config.nodeEnv,
          hasRealCredentials: configSummary.hasRealCredentials
        });
      });
    }
    
    // Handle server-level errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use`);
        logger.error('Port already in use', { port: PORT, error: err.message });
        process.exit(1);
      } else {
        console.error('\n❌ Server error:', err.message);
        logger.error('Server error', { error: err.message, stack: err.stack });
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', {
    error: err.message,
    stack: err.stack
  });
  
  console.error('\n❌ Unhandled Promise Rejection');
  console.error(err);
  
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  
  console.error('\n❌ Uncaught Exception');
  console.error(err);
  
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  console.log('\n⏹️  SIGTERM received. Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
      console.log('✅ Server closed. Process terminated.\n');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  console.log('\n⏹️  SIGINT received. Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
      console.log('✅ Server closed. Process terminated.\n');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server
startServer();

module.exports = server;
