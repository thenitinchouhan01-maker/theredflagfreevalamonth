const axios = require('axios');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Instagram Search Suggestions Controller
 * Searches Instagram profiles using Google Custom Search API
 */
class InstagramSearchController {
  /**
   * Get Instagram profile suggestions
   * POST /api/search/instagram-suggestions
   */
  getSuggestions = asyncHandler(async (req, res) => {
    const { query } = req.body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw AppError.badRequest('Query parameter is required', 'INVALID_QUERY');
    }

    const trimmedQuery = query.trim();

    // Validate query length
    if (trimmedQuery.length < 2) {
      throw AppError.badRequest('Query must be at least 2 characters', 'QUERY_TOO_SHORT');
    }

    if (trimmedQuery.length > 100) {
      throw AppError.badRequest('Query must be less than 100 characters', 'QUERY_TOO_LONG');
    }

    // Get API credentials from environment
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      logger.error('Google Custom Search API credentials not configured');
      throw AppError.internal(
        'Search service is not configured',
        'SERVICE_NOT_CONFIGURED'
      );
    }

    try {
      // Call Google Custom Search API
      const searchQuery = `site:instagram.com ${trimmedQuery}`;
      const googleApiUrl = 'https://www.googleapis.com/customsearch/v1';

      logger.info('Instagram search request', {
        query: trimmedQuery,
        searchQuery,
        ip: req.ip
      });

      const response = await axios.get(googleApiUrl, {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: searchQuery,
          num: 10, // Get up to 10 results
          safe: 'active' // Safe search
        },
        timeout: 5000 // 5 second timeout
      });

      // Parse Google API response
      const suggestions = this.parseGoogleResults(response.data);

      logger.info('Instagram search completed', {
        query: trimmedQuery,
        resultsFound: suggestions.length
      });

      // Return formatted response
      const apiResponse = new ApiResponse(res);
      apiResponse.success({
        query: trimmedQuery,
        suggestions,
        count: suggestions.length
      }, 'Instagram suggestions retrieved successfully');

    } catch (error) {
      // Handle Google API errors gracefully
      if (error.response) {
        // Google API returned an error
        logger.error('Google Custom Search API error', {
          status: error.response.status,
          message: error.response.data?.error?.message,
          query: trimmedQuery
        });

        // Return empty suggestions with message
        const apiResponse = new ApiResponse(res);
        return apiResponse.success({
          query: trimmedQuery,
          suggestions: [],
          count: 0,
          message: 'Search service temporarily unavailable'
        }, 'No suggestions found');
      }

      if (error.code === 'ECONNABORTED') {
        // Timeout error
        logger.error('Google API timeout', { query: trimmedQuery });
        const apiResponse = new ApiResponse(res);
        return apiResponse.success({
          query: trimmedQuery,
          suggestions: [],
          count: 0,
          message: 'Search timeout'
        }, 'No suggestions found');
      }

      // Unknown error
      logger.error('Instagram search error', {
        error: error.message,
        query: trimmedQuery
      });

      throw AppError.internal(
        'Failed to retrieve suggestions',
        'SEARCH_FAILED'
      );
    }
  });

  /**
   * Parse Google Custom Search API results into clean format
   * @param {Object} googleData - Raw Google API response
   * @returns {Array} Formatted suggestions
   */
  parseGoogleResults(googleData) {
    if (!googleData.items || googleData.items.length === 0) {
      return [];
    }

    const suggestions = [];
    const seenUsernames = new Set();

    for (const item of googleData.items) {
      try {
        const profileUrl = item.link;
        
        // Extract username from Instagram URL
        const username = this.extractUsername(profileUrl);
        
        if (!username || seenUsernames.has(username)) {
          continue; // Skip invalid or duplicate usernames
        }

        seenUsernames.add(username);

        // Extract display name from title
        const displayName = this.extractDisplayName(item.title);

        // Extract profile picture (if available in snippet/metatags)
        const profilePic = this.extractProfilePic(item);

        suggestions.push({
          username,
          displayName,
          profileUrl,
          profilePic: profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200`,
          snippet: item.snippet || '',
          source: 'google_custom_search'
        });

      } catch (err) {
        // Skip this result if parsing fails
        logger.warn('Failed to parse Instagram result', {
          error: err.message,
          link: item.link
        });
        continue;
      }
    }

    return suggestions;
  }

  /**
   * Extract Instagram username from URL
   * @param {string} url - Instagram profile URL
   * @returns {string|null} Username or null
   */
  extractUsername(url) {
    try {
      const urlObj = new URL(url);
      
      // Check if it's an Instagram URL
      if (!urlObj.hostname.includes('instagram.com')) {
        return null;
      }

      // Extract username from path
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      
      if (pathParts.length === 0) {
        return null;
      }

      const username = pathParts[0];

      // Validate username (alphanumeric, dots, underscores)
      if (/^[a-zA-Z0-9._]+$/.test(username)) {
        return username;
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Extract display name from Google result title
   * @param {string} title - Google result title
   * @returns {string} Display name
   */
  extractDisplayName(title) {
    if (!title) {
      return 'Instagram User';
    }

    // Remove common suffixes
    const cleaned = title
      .replace(/\s*\|\s*Instagram\s*$/i, '')
      .replace(/\s*-\s*Instagram\s*$/i, '')
      .replace(/\s*on Instagram\s*$/i, '')
      .replace(/\(@[^)]+\)\s*$/i, '')
      .trim();

    return cleaned || 'Instagram User';
  }

  /**
   * Extract profile picture URL from Google result
   * @param {Object} item - Google search result item
   * @returns {string|null} Profile picture URL or null
   */
  extractProfilePic(item) {
    // Try to get from pagemap (structured data)
    if (item.pagemap?.cse_thumbnail?.[0]?.src) {
      return item.pagemap.cse_thumbnail[0].src;
    }

    if (item.pagemap?.cse_image?.[0]?.src) {
      return item.pagemap.cse_image[0].src;
    }

    if (item.pagemap?.metatags?.[0]?.['og:image']) {
      return item.pagemap.metatags[0]['og:image'];
    }

    return null;
  }
}

module.exports = new InstagramSearchController();
