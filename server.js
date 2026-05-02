require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { config, validateEnv, getConfigSummary } = require('./config/env');
const logger = require('./utils/logger');

// Validate environment variables before starting
validateEnv();

const PORT = process.env.PORT || 8080;
let server = null;

/**
 * 🧹 PERMANENT FIX: Clean payment collection and ensure correct indexes
 */
const fixPaymentCollection = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('🧹 Fixing payment collection...');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Existing indexes:', indexes.map(i => i.name).join(', '));

    // Drop duplicate/stale indexes (but not _id_)
    for (const index of indexes) {
      if (index.name !== '_id_' && index.name.includes('razorpay')) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped stale index: ${index.name}`);
        } catch (err) {
          console.log(`⚠️  Could not drop ${index.name}:`, err.message);
        }
      }
    }

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
    try {
      await collection.createIndex(
        { razorpayOrderId: 1 },
        { unique: true, sparse: true }
      );
      console.log('✅ Created razorpayOrderId index');
    } catch (err) {
      console.log('⚠️  Index already exists or error:', err.message);
    }

    console.log('✅ Payment DB ready');

  } catch (err) {
    console.error('❌ Fix error:', err.message);
    // Don't throw - let server continue
  }
};

// Run fix after MongoDB connection is established
mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB connection established');
  try {
    await fixPaymentCollection();
  } catch (err) {
    console.error('❌ Payment collection fix failed:', err.message);
    // Continue anyway - don't crash the server
  }
});

// Start server FIRST (Railway-safe)
server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`ENV: ${process.env.NODE_ENV}`);
});

// Connect DB AFTER server starts (non-blocking)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Graceful shutdown handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  });

  console.error('\n❌ Unhandled Promise Rejection');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Gracefully shut down in all environments — an unhandled rejection
  // means the process is in an unknown state and must not keep serving traffic.
  if (server) {
    server.close(() => {
      console.error('❌ Server closed due to unhandled rejection. Exiting.');
      process.exit(1);
    });
    // Force exit if server.close() hangs
    setTimeout(() => {
      console.error('❌ Forced exit after timeout.');
      process.exit(1);
    }, 10000).unref();
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

module.exports = server;
