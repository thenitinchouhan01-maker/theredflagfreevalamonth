const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateBody } = require('../middlewares/validate');
const { createUserSchema, restoreUserSchema } = require('../validators/user.validator');
const AppError = require('../utils/AppError');

// User identification middleware - exported so other routes can use it
const identifyUser = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const appUserId = req.headers['x-app-user-id'];
    const deviceId = req.body.deviceId || req.headers['x-device-id'];
    const deviceInfo = req.body.deviceInfo || {};

    // Debug logging
    console.log('👤 [IDENTIFY USER] Headers:', {
      appUserId: appUserId || 'none',
      deviceId: deviceId || 'none',
      hasDeviceInfo: Object.keys(deviceInfo).length > 0
    });

    if (appUserId) {
      const user = await User.findOneAndUpdate(
        { appUserId },
        { $set: { lastActiveAt: new Date() }, $setOnInsert: { appUserId, deviceInfo } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log('👤 [IDENTIFY USER] Lookup by appUserId:', {
        appUserId,
        found: !!user
      });

      req.user = user;

      console.log('✅ [IDENTIFY USER] User identified/created:', {
        id: user._id.toString(),
        appUserId: user.appUserId
      });
    } else if (deviceId) {
      req.user = await User.findOrCreateByDevice(deviceId, deviceInfo);
      console.log('✅ [IDENTIFY USER] User found/created by device:', {
        id: req.user._id.toString(),
        appUserId: req.user.appUserId
      });
    } else {
      req.user = await User.create({ deviceInfo });
      console.log('✅ [IDENTIFY USER] New user created:', {
        id: req.user._id.toString(),
        appUserId: req.user.appUserId
      });
    }

    next();
  } catch (error) {
    console.error('💥 [IDENTIFY USER] Error:', error.message);
    next(error);
  }
};

// Create anonymous user
router.post('/', validateBody(createUserSchema), identifyUser, userController.createUser);

// Restore user by appUserId
router.post('/restore', validateBody(restoreUserSchema), userController.restoreUser);

// Get current user
router.get('/me', identifyUser, userController.getCurrentUser);

// Update user device info
router.patch('/me', identifyUser, userController.updateDeviceInfo);

// Get user stats
router.get('/me/stats', identifyUser, userController.getUserStats);

module.exports = router;
module.exports.identifyUser = identifyUser;