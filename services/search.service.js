const { Search, Result, Upload } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const SearchProcessor = require('./search/SearchProcessor');

class SearchService {
  /**
   * Create a new search
   * @param {Object} searchData - Search data
   * @param {string} searchData.userId - User ID
   * @param {string} searchData.searchType - Search type (name, username, photo, mixed)
   * @param {string} searchData.nameQuery - Name query
   * @param {string} searchData.usernameQuery - Username query
   * @param {string} searchData.imageId - Image ID
   * @param {Object} searchData.metadata - Additional metadata
   * @returns {Promise<Object>} Created search
   */
  async createSearch(searchData) {
    try {
      const { userId, searchType, nameQuery, usernameQuery, imageId, metadata = {} } = searchData;

      // Validate image exists if provided
      if (imageId) {
        const upload = await Upload.findOne({ _id: imageId, userId });
        if (!upload) {
          throw AppError.notFound('Image not found', 'IMAGE_NOT_FOUND');
        }
      }

      const search = await Search.create({
        userId,
        searchType,
        nameQuery: nameQuery?.trim() || null,
        usernameQuery: usernameQuery?.trim().toLowerCase() || null,
        imageId: imageId || null,
        metadata,
        status: 'pending'
      });

      logger.info('Search created', {
        searchId: search._id.toString(),
        userId: userId.toString(),
        searchType
      });

      // Start processing the search asynchronously
      this.processSearch(search._id).catch(error => {
        logger.error('Error in background search processing', { 
          error: error.message, 
          searchId: search._id.toString() 
        });
      });

      return search;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error creating search', { error: error.message });
      throw AppError.internal('Failed to create search', 'SEARCH_CREATE_FAILED');
    }
  }

  /**
   * Process a search through the real pipeline
   * @param {string} searchId - Search ID
   */
  async processSearch(searchId) {
    try {
      const search = await Search.findById(searchId).populate('imageId');
      
      if (!search) {
        logger.error('Search not found for processing', { searchId });
        return;
      }

      // Update status to processing
      await search.startProcessing();

      logger.info('Processing search through pipeline', {
        searchId: search._id.toString(),
        searchType: search.searchType
      });

      // Process through the real pipeline
      const reportData = await SearchProcessor.process(search, search.imageId);

      // Create result from report data
      await this.createResult(search, reportData);

      // Mark as completed
      await search.markAsCompleted();

      logger.info('Search completed', {
        searchId: search._id.toString(),
        duration: search.durationSeconds,
        profilesFound: reportData.matchedProfiles.length,
        imageMatchesFound: reportData.imageMatches.length
      });

    } catch (error) {
      logger.error('Error processing search', { 
        error: error.message, 
        searchId,
        stack: error.stack 
      });
      
      // Mark search as failed
      const search = await Search.findById(searchId);
      if (search) {
        await search.markAsFailed(error.message);
      }
    }
  }

  /**
   * Create result from processed report data
   * @param {Object} search - Search document
   * @param {Object} reportData - Report data from pipeline
   * @returns {Promise<Object>} Created result
   */
  async createResult(search, reportData) {
    try {
      const result = await Result.create({
        searchId: search._id,
        userId: search.userId,
        summary: reportData.summary,
        matchedProfiles: reportData.matchedProfiles,
        imageMatches: reportData.imageMatches,
        flags: reportData.flags,
        sources: reportData.sources,
        rawData: reportData.metadata
      });

      logger.info('Result created from pipeline', {
        resultId: result._id.toString(),
        searchId: search._id.toString(),
        profilesFound: reportData.matchedProfiles.length
      });

      // Log for monetization tracking
      logger.info('Search ready for monetization', {
        userId: search.userId.toString(),
        searchId: search._id.toString(),
        resultId: result._id.toString(),
        profiles: reportData.summary.totalProfilesFound,
        images: reportData.summary.totalImageMatches,
        confidence: reportData.summary.overallConfidence,
        searchType: search.searchType,
        hasResults: reportData.matchedProfiles.length > 0 || reportData.imageMatches.length > 0
      });

      return result;
    } catch (error) {
      logger.error('Error creating result', { 
        error: error.message, 
        searchId: search._id 
      });
      throw error;
    }
  }

  /**
   * Get search by ID
   * @param {string} searchId - Search ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Object>} Search
   */
  async getSearchById(searchId, userId) {
    try {
      const search = await Search.findOne({
        _id: searchId,
        userId
      }).populate('imageId', 'secureUrl width height');

      if (!search) {
        throw AppError.notFound('Search not found', 'SEARCH_NOT_FOUND');
      }

      return search;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error getting search', { error: error.message, searchId });
      throw AppError.internal('Failed to get search', 'SEARCH_GET_FAILED');
    }
  }

  /**
   * Get user's searches
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Searches
   */
  async getUserSearches(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, status } = options;
      
      const searches = await Search.getUserSearches(userId, { limit, skip, status });
      
      return searches;
    } catch (error) {
      logger.error('Error getting user searches', { error: error.message, userId });
      throw AppError.internal('Failed to get searches', 'SEARCHES_GET_FAILED');
    }
  }

  /**
   * Get search status
   * @param {string} searchId - Search ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Search status
   */
  async getSearchStatus(searchId, userId) {
    try {
      const search = await this.getSearchById(searchId, userId);
      
      return {
        searchId: search._id,
        status: search.status,
        progress: search.progress,
        startedAt: search.startedAt,
        completedAt: search.completedAt,
        sourcesSearched: search.sourcesSearched,
        isComplete: search.isComplete
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider information
   * @returns {Object} Provider info
   */
  getProviderInfo() {
    return SearchProcessor.getProviderInfo();
  }
}

module.exports = new SearchService();
