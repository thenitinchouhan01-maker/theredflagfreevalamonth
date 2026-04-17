const { WebSourceProvider } = require('./BaseProvider');
const logger = require('../../../utils/logger');

/**
 * Placeholder Web Source Provider
 * Returns empty results - ready for real integration
 * 
 * INTEGRATION POINT:
 * Replace this with real web search integrations:
 * - Google Custom Search API
 * - Bing Web Search API
 * - Public records databases
 * - News aggregators
 * - Domain-specific scrapers (with legal compliance)
 */
class PlaceholderWebProvider extends WebSourceProvider {
  constructor(config = {}) {
    super('PlaceholderWebProvider', config);
  }

  /**
   * Search web sources
   * PLACEHOLDER: Returns empty array
   * 
   * Real implementation should:
   * 1. Query web search APIs
   * 2. Search public records databases
   * 3. Aggregate news mentions
   * 4. Extract relevant metadata
   * 
   * @param {Object} query - Normalized search query
   * @returns {Promise<Array>} Empty array (placeholder)
   */
  async searchWeb(query) {
    logger.info('PlaceholderWebProvider.searchWeb called', {
      searchType: query.searchType,
      hasName: !!query.name,
      hasUsername: !!query.username
    });

    // PLACEHOLDER: Return empty results
    // Real implementation would query web search APIs
    return [];
  }

  /**
   * Extract structured data from URL
   * PLACEHOLDER: Returns null
   * 
   * @param {string} url - Web page URL
   * @returns {Promise<Object>} null (placeholder)
   */
  async extractData(url) {
    logger.info('PlaceholderWebProvider.extractData called', { url });

    // PLACEHOLDER: Return null
    // Real implementation would scrape and parse web pages
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

module.exports = PlaceholderWebProvider;
