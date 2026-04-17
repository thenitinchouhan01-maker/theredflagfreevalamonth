/**
 * Placeholder Providers
 * Empty implementations ready for real integrations
 * These return empty results, not fake data
 */

const { PublicProfileProvider, ImageMatchProvider, WebSourceProvider } = require('./ProviderInterfaces');
const logger = require('../../utils/logger');

/**
 * Placeholder Public Profile Provider
 * Returns empty results - ready for real API integration
 */
class PlaceholderProfileProvider extends PublicProfileProvider {
  constructor() {
    super('PlaceholderProfileProvider');
  }

  async searchProfiles(context) {
    logger.info('PlaceholderProfileProvider: No real implementation - returning empty results', {
      searchType: context.searchType
    });

    // Return empty results structure
    return {
      profiles: [],
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: 0,
        note: 'Placeholder provider - integrate real profile search API here'
      }
    };
  }
}

/**
 * Placeholder Image Match Provider
 * Returns empty results - ready for reverse image search API
 */
class PlaceholderImageProvider extends ImageMatchProvider {
  constructor() {
    super('PlaceholderImageProvider');
  }

  async searchImages(context) {
    logger.info('PlaceholderImageProvider: No real implementation - returning empty results', {
      imageUrl: context.image?.url
    });

    // Return empty results structure
    return {
      matches: [],
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: 0,
        note: 'Placeholder provider - integrate reverse image search API here (e.g., Google Vision, TinEye)'
      }
    };
  }
}

/**
 * Placeholder Web Source Provider
 * Returns empty results - ready for web scraping/API integration
 */
class PlaceholderWebProvider extends WebSourceProvider {
  constructor() {
    super('PlaceholderWebProvider');
  }

  async searchSources(context) {
    logger.info('PlaceholderWebProvider: No real implementation - returning empty results', {
      searchType: context.searchType
    });

    // Return empty source list
    return {
      sources: [],
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalSearched: 0,
        note: 'Placeholder provider - integrate web scraping or search APIs here'
      }
    };
  }
}

module.exports = {
  PlaceholderProfileProvider,
  PlaceholderImageProvider,
  PlaceholderWebProvider
};
