/**
 * Provider Interfaces
 * Defines the contract for all search providers
 */

/**
 * Base Provider Interface
 * All providers must implement these methods
 */
class BaseProvider {
  constructor(name) {
    this.name = name;
    this.enabled = true;
  }

  /**
   * Check if provider is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return this.enabled;
  }

  /**
   * Get provider metadata
   * @returns {Object}
   */
  getMetadata() {
    return {
      name: this.name,
      enabled: this.enabled,
      type: this.constructor.name
    };
  }
}

/**
 * Public Profile Provider Interface
 * For searching public profiles by name/username
 */
class PublicProfileProvider extends BaseProvider {
  /**
   * Search for public profiles
   * @param {Object} context - Search context
   * @returns {Promise<Object>} Search results
   */
  async searchProfiles(context) {
    throw new Error('searchProfiles() must be implemented by provider');
  }

  /**
   * Expected return format:
   * {
   *   profiles: [
   *     {
   *       platform: string,
   *       username: string,
   *       profileUrl: string,
   *       displayName: string,
   *       bio: string (optional),
   *       profileImage: string (optional),
   *       followers: number (optional),
   *       following: number (optional),
   *       posts: number (optional),
   *       location: string (optional),
   *       isVerified: boolean,
   *       confidence: number (0-100),
   *       metadata: object (optional)
   *     }
   *   ],
   *   metadata: {
   *     provider: string,
   *     searchedAt: string,
   *     totalFound: number
   *   }
   * }
   */
}

/**
 * Image Match Provider Interface
 * For reverse image search
 */
class ImageMatchProvider extends BaseProvider {
  /**
   * Search for image matches
   * @param {Object} context - Search context with image data
   * @returns {Promise<Object>} Image match results
   */
  async searchImages(context) {
    throw new Error('searchImages() must be implemented by provider');
  }

  /**
   * Expected return format:
   * {
   *   matches: [
   *     {
   *       source: string,
   *       url: string,
   *       thumbnailUrl: string (optional),
   *       similarity: number (0-100),
   *       pageTitle: string (optional),
   *       pageUrl: string (optional),
   *       foundAt: string (ISO date),
   *       metadata: object (optional)
   *     }
   *   ],
   *   metadata: {
   *     provider: string,
   *     searchedAt: string,
   *     totalFound: number
   *   }
   * }
   */
}

/**
 * Web Source Provider Interface
 * For general web/source search
 */
class WebSourceProvider extends BaseProvider {
  /**
   * Search web sources
   * @param {Object} context - Search context
   * @returns {Promise<Object>} Source results
   */
  async searchSources(context) {
    throw new Error('searchSources() must be implemented by provider');
  }

  /**
   * Expected return format:
   * {
   *   sources: [
   *     {
   *       name: string,
   *       url: string (optional),
   *       searchedAt: string,
   *       resultsCount: number,
   *       status: 'success' | 'partial' | 'failed' | 'skipped'
   *     }
   *   ],
   *   metadata: {
   *     provider: string,
   *     searchedAt: string,
   *     totalSearched: number
   *   }
   * }
   */
}

module.exports = {
  BaseProvider,
  PublicProfileProvider,
  ImageMatchProvider,
  WebSourceProvider
};
