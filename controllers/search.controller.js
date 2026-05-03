const searchService = require('../services/search.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

class SearchController {
  /**
   * Create a new search
   * POST /api/searches
   */
  createSearch = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { searchType, nameQuery, usernameQuery, imageId } = req.body;

    const search = await searchService.createSearch({
      userId,
      searchType,
      nameQuery,
      usernameQuery,
      imageId,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    const response = new ApiResponse(res);
    response.created({
      search: {
        id: search._id,
        searchType: search.searchType,
        nameQuery: search.nameQuery,
        usernameQuery: search.usernameQuery,
        imageId: search.imageId,
        status: search.status,
        progress: search.progress,
        resultType: search.resultType,
        createdAt: search.createdAt
      }
    }, 'Search created successfully');
  });

  /**
   * Get user's searches
   * GET /api/searches
   */
  getUserSearches = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;

    const searches = await searchService.getUserSearches(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status
    });

    const response = new ApiResponse(res);
    response.success({
      searches: searches.map(search => ({
        id: search._id,
        searchType: search.searchType,
        nameQuery: search.nameQuery,
        usernameQuery: search.usernameQuery,
        imageId: search.imageId,
        status: search.status,
        progress: search.progress,
        resultType: search.resultType,
        sourcesSearched: search.sourcesSearched,
        startedAt: search.startedAt,
        completedAt: search.completedAt,
        createdAt: search.createdAt,
        isComplete: search.isComplete
      }))
    });
  });

  /**
   * Get search by ID
   * GET /api/searches/:searchId
   */
  getSearchById = asyncHandler(async (req, res) => {
    const { searchId } = req.params;
    const userId = req.user._id;

    const search = await searchService.getSearchById(searchId, userId);

    const response = new ApiResponse(res);
    response.success({
      search: {
        id: search._id,
        searchType: search.searchType,
        nameQuery: search.nameQuery,
        usernameQuery: search.usernameQuery,
        imageId: search.imageId,
        image: search.imageId ? {
          id: search.imageId._id,
          secureUrl: search.imageId.secureUrl,
          width: search.imageId.width,
          height: search.imageId.height
        } : null,
        status: search.status,
        progress: search.progress,
        resultType: search.resultType,
        sourcesSearched: search.sourcesSearched,
        totalSources: search.totalSources,
        completedSources: search.completedSources,
        startedAt: search.startedAt,
        completedAt: search.completedAt,
        failedAt: search.failedAt,
        failureReason: search.failureReason,
        createdAt: search.createdAt,
        isComplete: search.isComplete,
        duration: search.durationSeconds
      }
    });
  });

  /**
   * Get search status
   * GET /api/searches/:searchId/status
   */
  getSearchStatus = asyncHandler(async (req, res) => {
    const { searchId } = req.params;
    const userId = req.user._id;

    const status = await searchService.getSearchStatus(searchId, userId);

    const response = new ApiResponse(res);
    response.success({ status });
  });
}

module.exports = new SearchController();
