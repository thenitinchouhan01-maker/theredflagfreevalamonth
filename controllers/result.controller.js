const resultService = require('../services/result.service');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/asyncHandler');

class ResultController {
  /**
   * Get result by search ID
   * GET /api/results/search/:searchId
   */
  getResultBySearchId = asyncHandler(async (req, res) => {
    const { searchId } = req.params;
    const userId = req.user._id;

    const result = await resultService.getResultBySearchId(searchId, userId);

    // If result is still processing
    if (result.status === 'processing') {
      const response = new ApiResponse(res);
      return response.success({
        status: result.status,
        progress: result.progress,
        message: result.message
      });
    }

    // Service now returns clean formatted response
    const response = new ApiResponse(res);
    response.success({ result });
  });

  /**
   * Get result by ID
   * GET /api/results/:resultId
   */
  getResultById = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const userId = req.user._id;

    logger.info('API HIT: GET /api/results/:resultId', { 
      resultId, 
      userId: userId.toString(),
      userAgent: req.get('user-agent')
    });

    const result = await resultService.getResultById(resultId, userId);

    logger.debug('Result retrieved, preparing response', {
      resultId,
      hasProfiles: result.matchedProfiles?.length > 0,
      profilesCount: result.matchedProfiles?.length || 0
    });

    // Service now returns clean formatted response
    const response = new ApiResponse(res);
    response.success({ result });
  });

  /**
   * Get user's results
   * GET /api/results
   */
  getUserResults = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const results = await resultService.getUserResults(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const response = new ApiResponse(res);
    response.success({
      results: results.map(result => ({
        id: result._id,
        searchId: result.searchId,
        search: result.searchId ? {
          id: result.searchId._id,
          searchType: result.searchId.searchType,
          nameQuery: result.searchId.nameQuery,
          usernameQuery: result.searchId.usernameQuery,
          status: result.searchId.status,
          createdAt: result.searchId.createdAt
        } : null,
        summary: result.summary,
        profilesCount: result.matchedProfiles?.length || 0,
        topProfiles: (result.matchedProfiles || []).slice(0, 3).map(p => ({
          platform: p.platform,
          username: p.username,
          displayName: p.displayName,
          isVerified: p.isVerified
        })),
        hasResults: result.hasResults,
        platformsCount: result.platformsCount,
        createdAt: result.createdAt
      }))
    });
  });
}

module.exports = new ResultController();