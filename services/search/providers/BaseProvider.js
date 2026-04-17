/**
 * Base Provider Interface
 * All search providers must implement this interface
 */
class BaseProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.enabled = config.enabled !== false;
  }

  /**
   * Search method - must be implemented by subclasses
   * @param {Object} query - Normalized search query
   * @returns {Promise<Object>} Search results
   */
  async search(query) {
    throw new Error('search() must be implemented by provider');
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
 * For searching public social media profiles
 */
class PublicProfileProvider extends BaseProvider {
  /**
   * Search for public profiles
   * @param {Object} query - Normalized query with name/username
   * @returns {Promise<Array>} Array of profile matches
   */
  async searchProfiles(query) {
    throw new Error('searchProfiles() must be implemented');
  }

  /**
   * Get profile details by URL
   * @param {string} profileUrl - Profile URL
   * @returns {Promise<Object>} Profile details
   */
  async getProfileDetails(profileUrl) {
    throw new Error('getProfileDetails() must be implemented');
  }
}

/**
 * Image Match Provider Interface
 * For reverse image search
 */
class ImageMatchProvider extends BaseProvider {
  /**
   * Search for image matches
   * @param {Object} imageData - Normalized image data
   * @returns {Promise<Array>} Array of image matches
   */
  async searchImage(imageData) {
    throw new Error('searchImage() must be implemented');
  }

  /**
   * Compare two images for similarity
   * @param {string} imageUrl1 - First image URL
   * @param {string} imageUrl2 - Second image URL
   * @returns {Promise<number>} Similarity score (0-100)
   */
  async compareImages(imageUrl1, imageUrl2) {
    throw new Error('compareImages() must be implemented');
  }
}

/**
 * Web Source Provider Interface
 * For searching web sources and public records
 */
class WebSourceProvider extends BaseProvider {
  /**
   * Search web sources
   * @param {Object} query - Normalized search query
   * @returns {Promise<Array>} Array of web results
   */
  async searchWeb(query) {
    throw new Error('searchWeb() must be implemented');
  }

  /**
   * Extract structured data from URL
   * @param {string} url - Web page URL
   * @returns {Promise<Object>} Extracted data
   */
  async extractData(url) {
    throw new Error('extractData() must be implemented');
  }
}

module.exports = {
  BaseProvider,
  PublicProfileProvider,
  ImageMatchProvider,
  WebSourceProvider
};
