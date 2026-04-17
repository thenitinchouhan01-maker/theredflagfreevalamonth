const { User } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class UserService {
  /**
   * Create a new anonymous user
   * @param {Object} userData - User data
   * @param {string} userData.deviceId - Device identifier
   * @param {Object} userData.deviceInfo - Device information
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData = {}) {
    try {
      const user = await User.create({
        deviceId: userData.deviceId,
        deviceInfo: userData.deviceInfo || {}
      });

      logger.info('User created', { 
        userId: user._id.toString(), 
        appUserId: user.appUserId 
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      throw AppError.internal('Failed to create user', 'USER_CREATE_FAILED');
    }
  }

  /**
   * Find or create user by device ID
   * @param {string} deviceId - Device identifier
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} User
   */
  async findOrCreateByDevice(deviceId, deviceInfo = {}) {
    try {
      if (!deviceId) {
        // Create user without device ID
        return await this.createUser({ deviceInfo });
      }

      const user = await User.findOrCreateByDevice(deviceId, deviceInfo);
      
      logger.info('User found or created by device', { 
        userId: user._id.toString(),
        isNew: user.createdAt === user.updatedAt
      });

      return user;
    } catch (error) {
      logger.error('Error finding/creating user by device', { error: error.message });
      throw AppError.internal('Failed to process user', 'USER_PROCESS_FAILED');
    }
  }

  /**
   * Restore user by appUserId
   * @param {string} appUserId - App user ID (format: DTX-XXXX-XXXX)
   * @param {string} deviceId - New device ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} Restored user
   */
  async restoreUser(appUserId, deviceId, deviceInfo = {}) {
    try {
      // Validate appUserId format
      const appUserIdRegex = /^DTX-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!appUserIdRegex.test(appUserId)) {
        throw AppError.badRequest(
          'Invalid appUserId format',
          'INVALID_APP_USER_ID',
          { expectedFormat: 'DTX-XXXX-XXXX' }
        );
      }

      const user = await User.restoreByAppUserId(appUserId, deviceId, deviceInfo);

      if (!user) {
        throw AppError.notFound(
          'User not found with the provided appUserId',
          'USER_NOT_FOUND',
          { appUserId }
        );
      }

      logger.info('User restored', { 
        userId: user._id.toString(), 
        appUserId: user.appUserId 
      });

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error restoring user', { error: error.message, appUserId });
      throw AppError.internal('Failed to restore user', 'USER_RESTORE_FAILED');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting user by ID', { error: error.message, userId });
      throw AppError.internal('Failed to get user', 'USER_GET_FAILED');
    }
  }

  /**
   * Get user by appUserId
   * @param {string} appUserId - App user ID
   * @returns {Promise<Object>} User
   */
  async getUserByAppUserId(appUserId) {
    try {
      const user = await User.findOne({ appUserId });

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting user by appUserId', { error: error.message, appUserId });
      throw AppError.internal('Failed to get user', 'USER_GET_FAILED');
    }
  }

  /**
   * Update user device info
   * @param {string} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} Updated user
   */
  async updateDeviceInfo(userId, deviceInfo) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          deviceInfo: deviceInfo,
          lastActiveAt: new Date()
        },
        { new: true }
      );

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error updating user device info', { error: error.message, userId });
      throw AppError.internal('Failed to update user', 'USER_UPDATE_FAILED');
    }
  }

  /**
   * Update user last active timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastActive(userId) {
    try {
      await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
    } catch (error) {
      logger.error('Error updating last active', { error: error.message, userId });
      // Don't throw - this is a non-critical update
    }
  }

  /**
   * Get user activity stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User stats
   */
  async getUserStats(userId) {
    try {
      const { Search, Payment, Report } = require('../models');
      
      const [searchCount, paymentCount, reportCount] = await Promise.all([
        Search.countDocuments({ userId }),
        Payment.countDocuments({ userId, status: 'paid' }),
        Report.countDocuments({ userId })
      ]);

      return {
        searches: searchCount,
        payments: paymentCount,
        reports: reportCount
      };
    } catch (error) {
      logger.error('Error getting user stats', { error: error.message, userId });
      return { searches: 0, payments: 0, reports: 0 };
    }
  }
}

module.exports = new UserService();