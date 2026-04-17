/**
 * Flag Generator
 * Generates structured, explainable flags based on search results
 */

const logger = require('../../utils/logger');

class FlagGenerator {
  /**
   * Generate flags from search results
   * @param {Object} aggregatedData - Aggregated search results
   * @param {Object} context - Search context
   * @returns {Array} Generated flags
   */
  generateFlags(aggregatedData, context) {
    const flags = [];

    // No results flag
    if (aggregatedData.profiles.length === 0 && aggregatedData.imageMatches.length === 0) {
      flags.push(this.createFlag(
        'info',
        'No Results',
        'No matching profiles or images found for this search',
        'low',
        'search_completion'
      ));
    }

    // Low profile presence
    if (aggregatedData.profiles.length > 0 && aggregatedData.profiles.length < 2) {
      flags.push(this.createFlag(
        'info',
        'Limited Profile Presence',
        'Only one profile found - limited public presence detected',
        'low',
        'profile_count'
      ));
    }

    // Low confidence matches
    const lowConfidenceProfiles = aggregatedData.profiles.filter(p => p.confidence < 50);
    if (lowConfidenceProfiles.length > 0) {
      flags.push(this.createFlag(
        'warning',
        'Low Confidence Matches',
        `${lowConfidenceProfiles.length} profile(s) have low confidence scores`,
        'medium',
        'confidence'
      ));
    }

    // Verified accounts found
    const verifiedProfiles = aggregatedData.profiles.filter(p => p.isVerified);
    if (verifiedProfiles.length > 0) {
      flags.push(this.createFlag(
        'info',
        'Verified Accounts',
        `${verifiedProfiles.length} verified account(s) found`,
        'low',
        'verification'
      ));
    }

    // Multiple platforms
    const platforms = [...new Set(aggregatedData.profiles.map(p => p.platform))];
    if (platforms.length >= 3) {
      flags.push(this.createFlag(
        'info',
        'Multi-Platform Presence',
        `Profiles found across ${platforms.length} different platforms`,
        'low',
        'platform_diversity'
      ));
    }

    // Image search specific flags
    if (context.searchType === 'photo' || context.searchType === 'mixed') {
      if (aggregatedData.imageMatches.length === 0) {
        flags.push(this.createFlag(
          'info',
          'No Image Matches',
          'No matching images found in public sources',
          'low',
          'image_search'
        ));
      } else if (aggregatedData.imageMatches.length > 5) {
        flags.push(this.createFlag(
          'info',
          'Multiple Image Matches',
          `Image appears in ${aggregatedData.imageMatches.length} different sources`,
          'medium',
          'image_usage'
        ));
      }
    }

    // Inconsistent identifiers
    const uniqueUsernames = new Set(aggregatedData.profiles.map(p => p.username.toLowerCase()));
    const uniqueDisplayNames = new Set(aggregatedData.profiles.map(p => (p.displayName || '').toLowerCase()));
    
    if (uniqueUsernames.size > 1 && uniqueDisplayNames.size > 1) {
      flags.push(this.createFlag(
        'info',
        'Varied Identifiers',
        'Multiple different usernames and display names found across profiles',
        'low',
        'identifier_consistency'
      ));
    }

    // Search completion flag
    if (aggregatedData.profiles.length > 0 || aggregatedData.imageMatches.length > 0) {
      flags.push(this.createFlag(
        'info',
        'Search Complete',
        'Search completed successfully with results',
        'low',
        'search_completion'
      ));
    }

    logger.debug('Flags generated', {
      totalFlags: flags.length,
      searchType: context.searchType
    });

    return flags;
  }

  /**
   * Create a structured flag
   * @param {string} type - Flag type (info, warning, alert)
   * @param {string} category - Flag category
   * @param {string} message - Human-readable message
   * @param {string} severity - Severity level (low, medium, high, critical)
   * @param {string} source - Source/reason for flag
   * @returns {Object} Flag object
   */
  createFlag(type, category, message, severity, source) {
    return {
      type,
      category,
      message,
      severity,
      source,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Analyze profile quality
   * @param {Object} profile - Profile object
   * @returns {Object} Quality analysis
   */
  analyzeProfileQuality(profile) {
    const quality = {
      score: 0,
      factors: []
    };

    // Has profile URL
    if (profile.profileUrl) {
      quality.score += 20;
      quality.factors.push('has_url');
    }

    // Has bio/description
    if (profile.bio && profile.bio.length > 10) {
      quality.score += 15;
      quality.factors.push('has_bio');
    }

    // Has profile image
    if (profile.profileImage) {
      quality.score += 15;
      quality.factors.push('has_image');
    }

    // Has follower data
    if (profile.followers !== undefined && profile.followers !== null) {
      quality.score += 10;
      quality.factors.push('has_followers');
    }

    // Is verified
    if (profile.isVerified) {
      quality.score += 20;
      quality.factors.push('verified');
    }

    // Has location
    if (profile.location) {
      quality.score += 10;
      quality.factors.push('has_location');
    }

    // High confidence
    if (profile.confidence >= 80) {
      quality.score += 10;
      quality.factors.push('high_confidence');
    }

    return quality;
  }
}

module.exports = new FlagGenerator();
