const mongoose = require('mongoose');
const { config } = require('./env');

// Drop stale indexes left over from old schema versions
const cleanupStaleIndexes = async () => {
  try {
    const stale = ['razorpayOrderId_1', 'planId_1', 'razorpayPaymentId_1'];
    const col = mongoose.connection.collection('payments');
    
    for (const idx of stale) {
      try {
        await col.dropIndex(idx);
        console.log(`✅ Dropped stale index: ${idx}`);
      } catch (err) {
        if (err.codeName !== 'IndexNotFound' && err.code !== 27) {
          console.warn(`⚠️  Could not drop stale index ${idx}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
    // Don't throw - continue anyway
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    console.log('MongoDB Connected: ' + conn.connection.host);
    
    // Run cleanup in background - don't block server startup
    cleanupStaleIndexes().catch(err => {
      console.error('❌ Index cleanup failed:', err.message);
    });
    
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB: ' + error.message);
    process.exit(1);
  }
};

module.exports = connectDB;