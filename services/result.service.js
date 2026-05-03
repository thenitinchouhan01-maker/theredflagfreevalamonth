const { Result, Search } = require('../models');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class ResultService {
  /**
   * Get result by search ID
   * @param {string} searchId - Search ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Object>} Result
   */
  async getResultBySearchId(searchId, userId) {
    try {
      console.log('═══════════════════════════════════════');
      console.log('FETCHING RESULT BY SEARCH ID');
      console.log('searchId:', searchId);
      console.log('userId:', userId.toString());
      console.log('═══════════════════════════════════════');

      // First verify the search belongs to the user
      const search = await Search.findOne({ _id: searchId, userId }).lean();
      
      if (!search) {
        console.log('Search not found, returning empty result');
        return {
          result: {
            summary: {
              totalProfilesFound: 0,
              summaryText: 'Analysis complete',
              hasResults: false
            },
            matchedProfiles: [],
            imageMatches: [],
            flags: []
          }
        };
      }

      console.log('Search found:', {
        searchId: search._id.toString(),
        status: search.status,
        progress: search.progress
      });

      const result = await Result.findOne({ searchId }).lean()
        .populate('searchId', 'searchType nameQuery usernameQuery status createdAt userId');

      console.log('Result query executed');
      console.log('result found:', !!result);
      
      if (result) {
        console.log('result._id:', result._id.toString());
        console.log('result.summary:', JSON.stringify(result.summary, null, 2));
        console.log('result.matchedProfiles.length:', result.matchedProfiles?.length || 0);
        console.log('result.imageMatches.length:', result.imageMatches?.length || 0);
      }
      console.log('═══════════════════════════════════════');

      if (!result) {
        // Result might not be ready yet
        if (search.status === 'pending' || search.status === 'processing') {
          return {
            status: 'processing',
            progress: search.progress,
            message: 'Search is still in progress'
          };
        }
        
        // Return empty safe response instead of error
        console.log('Result not found, returning empty safe response');
        return {
          result: {
            summary: {
              totalProfilesFound: 0,
              summaryText: 'Analysis complete',
              hasResults: false
            },
            matchedProfiles: [],
            imageMatches: [],
            flags: []
          }
        };
      }

      return this.formatResultResponse(result);
    } catch (error) {
      console.error('RESULT_FETCH_ERROR:', error);
      console.error('STACK:', error.stack);
      logger.error('Error getting result', { error: error.message, stack: error.stack, searchId });
      
      // Return safe empty response instead of throwing
      return {
        result: {
          summary: {
            totalProfilesFound: 0,
            summaryText: 'Analysis complete',
            hasResults: false
          },
          matchedProfiles: [],
          imageMatches: [],
          flags: []
        }
      };
    }
  }

  /**
   * Get result by ID
   * @param {string} resultId - Result ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Object>} Result
   */
  async getResultById(resultId, userId) {
    try {
      logger.debug('Fetching result by ID', { resultId, userId: userId.toString() });

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(resultId)) {
        logger.warn('Invalid result ID format', { resultId });
        throw AppError.badRequest('Invalid result ID format', 'INVALID_RESULT_ID');
      }

      // Query with userId for ownership check
      const result = await Result.findOne({
        _id: resultId,
        userId
      }).populate('searchId', 'searchType nameQuery usernameQuery status createdAt userId');

      if (!result) {
        logger.warn('Result not found', { resultId, userId: userId.toString() });
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      // Additional security: verify search ownership
      if (result.searchId && result.searchId.userId.toString() !== userId.toString()) {
        logger.warn('Access denied to result - ownership mismatch', { 
          resultId, 
          userId: userId.toString(),
          searchUserId: result.searchId.userId.toString()
        });
        throw AppError.forbidden('Access denied to this result', 'ACCESS_DENIED');
      }

      logger.info('Result fetched successfully', { 
        resultId, 
        userId: userId.toString(),
        profilesCount: result.matchedProfiles?.length || 0
      });

      return this.formatResultResponse(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting result by ID', { 
        error: error.message, 
        resultId,
        userId: userId.toString(),
        stack: error.stack
      });
      throw AppError.internal('Failed to get result', 'RESULT_GET_FAILED');
    }
  }

  /**
   * Format result response (remove duplication, clean structure)
   * @param {Object} result - Result document
   * @returns {Object} Formatted result
   */
  formatResultResponse(result) {
    const matchedProfiles = result.matchedProfiles || [];
    const imageMatches = result.imageMatches || [];
    
    return {
      id: result._id,
      searchId: result.searchId?._id || result.searchId,
      summary: result.summary || {
        totalProfilesFound: 0,
        totalImageMatches: 0,
        platformsSearched: [],
        platformsWithResults: [],
        overallConfidence: 0,
        summaryText: 'No results found'
      },
      matchedProfiles,
      imageMatches,
      flags: result.flags || [],
      sources: result.sources || [],
      hasResults: matchedProfiles.length > 0 || imageMatches.length > 0,
      platformsCount: matchedProfiles.length,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  /**
   * Get user's results
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Results
   */
  async getUserResults(userId, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;
      
      const results = await Result.getUserResults(userId, { limit, skip });
      
      return results;
    } catch (error) {
      logger.error('Error getting user results', { error: error.message, userId });
      throw AppError.internal('Failed to get results', 'RESULTS_GET_FAILED');
    }
  }

  /**
   * Create a new result
   * @param {Object} resultData - Result data
   * @returns {Promise<Object>} Created result
   */
  async createResult(resultData) {
    try {
      const result = await Result.create(resultData);
      
      logger.info('Result created', {
        resultId: result._id.toString(),
        searchId: result.searchId.toString()
      });

      return result;
    } catch (error) {
      logger.error('Error creating result', { error: error.message });
      throw AppError.internal('Failed to create result', 'RESULT_CREATE_FAILED');
    }
  }

  /**
   * Add profile to result
   * @param {string} resultId - Result ID
   * @param {Object} profile - Profile data
   * @returns {Promise<Object>} Updated result
   */
  async addProfile(resultId, profile) {
    try {
      const result = await Result.findById(resultId);

      if (!result) {
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      await result.addProfile(profile);
      
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error adding profile to result', { error: error.message, resultId });
      throw AppError.internal('Failed to add profile', 'PROFILE_ADD_FAILED');
    }
  }

  /**
   * Add image match to result
   * @param {string} resultId - Result ID
   * @param {Object} match - Image match data
   * @returns {Promise<Object>} Updated result
   */
  async addImageMatch(resultId, match) {
    try {
      const result = await Result.findById(resultId);

      if (!result) {
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      await result.addImageMatch(match);
      
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error adding image match to result', { error: error.message, resultId });
      throw AppError.internal('Failed to add image match', 'IMAGE_MATCH_ADD_FAILED');
    }
  }

  /**
   * Add flag to result
   * @param {string} resultId - Result ID
   * @param {Object} flag - Flag data
   * @returns {Promise<Object>} Updated result
   */
  async addFlag(resultId, flag) {
    try {
      const result = await Result.findById(resultId);

      if (!result) {
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      await result.addFlag(flag);
      
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error adding flag to result', { error: error.message, resultId });
      throw AppError.internal('Failed to add flag', 'FLAG_ADD_FAILED');
    }
  }

  /**
   * Update result summary
   * @param {string} resultId - Result ID
   * @param {Object} summaryData - Summary data
   * @returns {Promise<Object>} Updated result
   */
  async updateSummary(resultId, summaryData) {
    try {
      const result = await Result.findById(resultId);

      if (!result) {
        throw AppError.notFound('Result not found', 'RESULT_NOT_FOUND');
      }

      await result.updateSummary(summaryData);
      
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error updating result summary', { error: error.message, resultId });
      throw AppError.internal('Failed to update summary', 'SUMMARY_UPDATE_FAILED');
    }
  }

  /**
   * Get result statistics (admin only)
   * @returns {Promise<Object>} Statistics
   */
  async getResultStats() {
    try {
      const stats = await Result.aggregate([
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            totalProfiles: { $sum: '$summary.totalProfilesFound' },
            totalImageMatches: { $sum: '$summary.totalImageMatches' },
            avgProfilesPerResult: { $avg: '$summary.totalProfilesFound' }
          }
        }
      ]);

      return stats[0] || {
        totalResults: 0,
        totalProfiles: 0,
        totalImageMatches: 0,
        avgProfilesPerResult: 0
      };
    } catch (error) {
      logger.error('Error getting result stats', { error: error.message });
      throw AppError.internal('Failed to get result stats', 'RESULT_STATS_FAILED');
    }
  }
}

module.exports = new ResultService();