const mongoose = require('mongoose');
const { config } = require('./env');

// Drop stale indexes left over from old schema versions
const cleanupStaleIndexes = async () => {
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
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log('MongoDB Connected: ' + conn.connection.host);
    await cleanupStaleIndexes();
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB: ' + error.message);
    process.exit(1);
  }
};

module.exports = connectDB;