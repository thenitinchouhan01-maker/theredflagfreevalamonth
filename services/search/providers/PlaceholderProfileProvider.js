const { PublicProfileProvider } = require('./BaseProvider');
const logger = require('../../../utils/logger');

/**
 * Placeholder Public Profile Provider
 * Returns empty results - ready for real integration
 * 
 * INTEGRATION POINT:
 * Replace this with real social media API integrations:
 * - LinkedIn API (official or third-party)
 * - Twitter/X API
 * - Instagram Graph API
 * - Facebook Graph API
 * - GitHub API
 * - Public profile aggregators
 */
class PlaceholderProfileProvider extends PublicProfileProvider {
  constructor(config = {}) {
    super('PlaceholderProfileProvider', config);
  }

  /**
   * Search for public profiles
   * PLACEHOLDER: Returns empty array
   * 
   * Real implementation should:
   * 1. Query social media APIs with name/username
   * 2. Filter for public profiles only
   * 3. Extract profile metadata
   * 4. Calculate confidence scores
   * 
   * @param {Object} query - Normalized query
   * @returns {Promise<Array>} Empty array (placeholder)
   */
  async searchProfiles(query) {
    logger.info('PlaceholderProfileProvider.searchProfiles called', {
      searchType: query.searchType,
      hasName: !!query.name,
      hasUsername: !!query.username
    });

    // PLACEHOLDER: Return empty results
    // Real implementation would query APIs here
    return [];
  }

  /**
   * Get profile details by URL
   * PLACEHOLDER: Returns null
   * 
   * @param {string} profileUrl - Profile URL
   * @returns {Promise<Object>} null (placeholder)
   */
  async getProfileDetails(profileUrl) {
    logger.info('PlaceholderProfileProvider.getProfileDetails called', { profileUrl });
    
    // PLACEHOLDER: Return null
    // Real implementation would fetch profile data
    return null;
  }

  /**
   * Check if provider is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    // Placeholder is always "available" but returns no data
    return true;
  }
}

module.exports = PlaceholderProfileProvider;
