/**
 * Input Normalizer
 * Normalizes and validates search inputs before processing
 */

const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

class InputNormalizer {
  /**
   * Normalize search input based on search type
   * @param {Object} searchData - Raw search data
   * @returns {Object} Normalized search input
   */
  normalize(searchData) {
    const { searchType, nameQuery, usernameQuery, imageId } = searchData;

    const normalized = {
      searchType,
      queries: {},
      metadata: {
        originalInput: { nameQuery, usernameQuery, imageId },
        normalizedAt: new Date().toISOString()
      }
    };

    switch (searchType) {
      case 'name':
        normalized.queries.name = this.normalizeName(nameQuery);
        break;
      
      case 'username':
        normalized.queries.username = this.normalizeUsername(usernameQuery);
        break;
      
      case 'photo':
        normalized.queries.imageId = imageId;
        break;
      
      case 'mixed':
        normalized.queries.name = this.normalizeName(nameQuery);
        normalized.queries.username = this.normalizeUsername(usernameQuery);
        break;
      
      default:
        throw AppError.badRequest(`Invalid search type: ${searchType}`, 'INVALID_SEARCH_TYPE');
    }

    logger.debug('Input normalized', { searchType, normalized });
    return normalized;
  }

  /**
   * Normalize name query
   * @param {string} name - Raw name input
   * @returns {Object} Normalized name data
   */
  normalizeName(name) {
    if (!name || typeof name !== 'string') {
      throw AppError.badRequest('Name query is required', 'MISSING_NAME_QUERY');
    }

    const trimmed = name.trim();
    
    if (trimmed.length < 2) {
      throw AppError.badRequest('Name must be at least 2 characters', 'NAME_TOO_SHORT');
    }

    if (trimmed.length > 200) {
      throw AppError.badRequest('Name cannot exceed 200 characters', 'NAME_TOO_LONG');
    }

    // Split into parts
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    
    return {
      original: trimmed,
      normalized: trimmed.toLowerCase(),
      parts,
      firstName: parts[0] || null,
      lastName: parts.length > 1 ? parts[parts.length - 1] : null,
      fullName: parts.join(' ')
    };
  }

  /**
   * Normalize username/handle query
   * @param {string} username - Raw username input
   * @returns {Object} Normalized username data
   */
  normalizeUsername(username) {
    if (!username || typeof username !== 'string') {
      throw AppError.badRequest('Username query is required', 'MISSING_USERNAME_QUERY');
    }

    let trimmed = username.trim();
    
    if (trimmed.length < 2) {
      throw AppError.badRequest('Username must be at least 2 characters', 'USERNAME_TOO_SHORT');
    }

    if (trimmed.length > 100) {
      throw AppError.badRequest('Username cannot exceed 100 characters', 'USERNAME_TOO_LONG');
    }

    // Remove @ prefix if present
    const withoutAt = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;
    
    // Convert to lowercase
    const normalized = withoutAt.toLowerCase();
    
    // Extract variations
    const variations = [
      normalized,
      withoutAt,
      `@${normalized}`
    ];

    return {
      original: trimmed,
      normalized,
      withoutAt,
      withAt: `@${normalized}`,
      variations: [...new Set(variations)]
    };
  }

  /**
   * Validate image reference
   * @param {string} imageId - Image ID
   * @param {Object} upload - Upload document from database
   * @returns {Object} Validated image data
   */
  validateImage(imageId, upload) {
    if (!upload) {
      throw AppError.notFound('Image not found', 'IMAGE_NOT_FOUND');
    }

    // Support both R2 (fileUrl) and Cloudinary (secureUrl)
    const imageUrl = upload.fileUrl || upload.secureUrl;
    
    if (!imageUrl) {
      throw AppError.badRequest('Image URL not available', 'IMAGE_URL_MISSING');
    }

    return {
      imageId: upload._id.toString(),
      url: imageUrl,
      format: upload.format,
      width: upload.width,
      height: upload.height,
      r2Key: upload.r2Key,
      cloudinaryPublicId: upload.cloudinaryPublicId
    };
  }

  /**
   * Build search context from normalized input
   * @param {Object} normalized - Normalized input
   * @param {Object} upload - Upload document (if image search)
   * @returns {Object} Search context
   */
  buildSearchContext(normalized, upload = null) {
    const context = {
      searchType: normalized.searchType,
      queries: normalized.queries,
      metadata: normalized.metadata
    };

    if (upload) {
      context.image = this.validateImage(normalized.queries.imageId, upload);
    }

    return context;
  }
}

module.exports = new InputNormalizer();
