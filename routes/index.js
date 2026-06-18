const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const planRoutes = require('./plan.routes');
const paymentRoutes = require('./payment.routes');
const uploadRoutes = require('./upload.routes');
const searchRoutes = require('./search.routes');
const resultRoutes = require('./result.routes');
const reportRoutes = require('./report.routes');
const instagramSearchRoutes = require('./instagramSearch.routes');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DeepTrust API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/debug-r2', async (req, res) => {
  const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
  const { config } = require('../config/env');
  try {
    const client = new S3Client({
      region: config.r2.region,
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey
      }
    });
    await client.send(new ListBucketsCommand({}));
    res.json({
      success: true,
      r2: {
        bucket: config.r2.bucketName,
        endpoint: config.r2.endpoint,
        publicUrl: config.r2.publicUrl,
        accessKeyId: config.r2.accessKeyId ? config.r2.accessKeyId.slice(0,6) + '...' : 'NOT SET',
        secretSet: !!config.r2.secretAccessKey
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      r2Config: {
        bucket: config.r2.bucketName || 'NOT SET',
        endpoint: config.r2.endpoint || 'NOT SET',
        publicUrl: config.r2.publicUrl || 'NOT SET',
        accessKeyId: config.r2.accessKeyId ? config.r2.accessKeyId.slice(0,6) + '...' : 'NOT SET',
        secretSet: !!config.r2.secretAccessKey
      }
    });
  }
});

router.use('/users', userRoutes);
router.use('/plans', planRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/searches', searchRoutes);
router.use('/results', resultRoutes);
router.use('/reports', reportRoutes);
router.use('/search', instagramSearchRoutes);

module.exports = router;