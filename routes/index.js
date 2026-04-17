const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const planRoutes = require('./plan.routes');
const paymentRoutes = require('./payment.routes');
const uploadRoutes = require('./upload.routes');
const searchRoutes = require('./search.routes');
const resultRoutes = require('./result.routes');
const reportRoutes = require('./report.routes');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DeepTrust API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.use('/users', userRoutes);
router.use('/plans', planRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/searches', searchRoutes);
router.use('/results', resultRoutes);
router.use('/reports', reportRoutes);

module.exports = router;