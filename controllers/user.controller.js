const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

class UserController {
  /**
   * Create a new anonymous user
   * POST /api/users
   */
  createUser = asyncHandler(async (req, res) => {
    const { deviceId, deviceInfo } = req.body;

    const user = await userService.findOrCreateByDevice(deviceId, deviceInfo);

    const response = new ApiResponse(res);
    response.created({
      user: {
        id: user._id,
        appUserId: user.appUserId,
        deviceId: user.deviceId,
        createdAt: user.createdAt
      },
      credits: {
        available: user.credits,
        canSearch: user.credits >= 1
      }
    }, 'User created successfully');
  });

  /**
   * Restore user by appUserId
   * POST /api/users/restore
   */
  restoreUser = asyncHandler(async (req, res) => {
    const { appUserId, deviceId, deviceInfo } = req.body;

    const user = await userService.restoreUser(appUserId, deviceId, deviceInfo);
    const stats = await userService.getUserStats(user._id);

    const response = new ApiResponse(res);
    response.success({
      user: {
        id: user._id,
        appUserId: user.appUserId,
        deviceId: user.deviceId,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt
      },
      credits: {
        available: user.credits,
        canSearch: user.credits >= 1
      },
      stats
    }, 'User restored successfully');
  });

  /**
   * Get current user
   * GET /api/users/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    const stats = await userService.getUserStats(user._id);

    const response = new ApiResponse(res);
    response.success({
      user: {
        id: user._id,
        appUserId: user.appUserId,
        deviceId: user.deviceId,
        deviceInfo: user.deviceInfo,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt
      },
      credits: {
        available: user.credits,
        canSearch: user.credits >= 1
      },
      stats
    });
  });

  /**
   * Update user device info
   * PATCH /api/users/me
   */
  updateDeviceInfo = asyncHandler(async (req, res) => {
    const { deviceInfo } = req.body;
    const userId = req.user._id;

    const user = await userService.updateDeviceInfo(userId, deviceInfo);

    const response = new ApiResponse(res);
    response.success({
      user: {
        id: user._id,
        appUserId: user.appUserId,
        deviceInfo: user.deviceInfo,
        updatedAt: user.updatedAt
      }
    }, 'Device info updated successfully');
  });

  /**
   * Get user stats
   * GET /api/users/me/stats
   */
  getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await userService.getUserStats(userId);

    const response = new ApiResponse(res);
    response.success({
      stats,
      credits: {
        available: req.user.credits,
        canSearch: req.user.credits >= 1
      }
    });
  });
}

module.exports = new UserController();