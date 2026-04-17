const { ImageMatchProvider } = require('./BaseProvider');
const logger = require('../../../utils/logger');

/**
 * Placeholder Image Match Provider
 * Returns empty results - ready for real integration
 * 
 * INTEGRATION POINT:
 * Replace this with real reverse image search integrations:
 * - Google Vision API
 * - TinEye API
 * - Bing Visual Search API
 * - PimEyes API (face search)
 * - Custom image similarity models
 */
class PlaceholderImageProvider extends ImageMatchProvider {
  constructor(config = {}) {
    super('PlaceholderImageProvider', config);
  }

  /**
   * Search for image matches
   * PLACEHOLDER: Returns empty array
   * 
   * Real implementation should:
   * 1. Submit image to reverse search APIs
   * 2. Find visually similar images
   * 3. Extract source URLs and context
   * 4. Calculate similarity scores
   * 
   * @param {Object} imageData - Normalized image data
   * @returns {Promise<Array>} Empty array (placeholder)
   */
  async searchImage(imageData) {
    logger.info('PlaceholderImageProvider.searchImage called', {
      imageId: imageData.id,
      format: imageData.format,
      dimensions: `${imageData.width}x${imageData.height}`
    });

    // PLACEHOLDER: Return empty results
    // Real implementation would query reverse image search APIs
    return [];
  }

  /**
   * Compare two images for similarity
   * PLACEHOLDER: Returns 0
   * 
   * @param {string} imageUrl1 - First image URL
   * @param {string} imageUrl2 - Second image URL
   * @returns {Promise<number>} 0 (placeholder)
   */
  async compareImages(imageUrl1, imageUrl2) {
    logger.info('PlaceholderImageProvider.compareImages called', {
      imageUrl1,
      imageUrl2
    });

    // PLACEHOLDER: Return 0 similarity
    // Real implementation would use image comparison algorithms
    return 0;
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

module.exports = PlaceholderImageProvider;
