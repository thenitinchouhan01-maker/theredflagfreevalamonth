/**
 * Match Aggregator
 * Merges and deduplicates results from multiple providers
 */

const logger = require('../../utils/logger');

class MatchAggregator {
  /**
   * Aggregate profile results from multiple providers
   * @param {Array} providerResults - Array of provider result objects
   * @returns {Object} Aggregated profiles
   */
  aggregateProfiles(providerResults) {
    const allProfiles = [];
    const seenProfiles = new Map(); // key: platform_username

    for (const result of providerResults) {
      if (!result.profiles || !Array.isArray(result.profiles)) continue;

      for (const profile of result.profiles) {
        const key = `${profile.platform}_${profile.username}`.toLowerCase();
        
        if (seenProfiles.has(key)) {
          // Merge with existing profile (take higher confidence)
          const existing = seenProfiles.get(key);
          if (profile.confidence > existing.confidence) {
            seenProfiles.set(key, profile);
          }
        } else {
          seenProfiles.set(key, profile);
        }
      }
    }

    const deduplicated = Array.from(seenProfiles.values());
    
    // Sort by confidence descending
    deduplicated.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    logger.debug('Profiles aggregated', {
      totalProviders: providerResults.length,
      totalProfiles: allProfiles.length,
      deduplicatedProfiles: deduplicated.length
    });

    return {
      profiles: deduplicated,
      metadata: {
        totalProviders: providerResults.length,
        totalFound: deduplicated.length,
        deduplicated: allProfiles.length - deduplicated.length
      }
    };
  }

  /**
   * Aggregate image match results
   * @param {Array} providerResults - Array of provider result objects
   * @returns {Object} Aggregated image matches
   */
  aggregateImageMatches(providerResults) {
    const allMatches = [];
    const seenUrls = new Set();

    for (const result of providerResults) {
      if (!result.matches || !Array.isArray(result.matches)) continue;

      for (const match of result.matches) {
        if (!seenUrls.has(match.url)) {
          seenUrls.add(match.url);
          allMatches.push(match);
        }
      }
    }

    // Sort by similarity descending
    allMatches.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    logger.debug('Image matches aggregated', {
      totalProviders: providerResults.length,
      totalMatches: allMatches.length
    });

    return {
      matches: allMatches,
      metadata: {
        totalProviders: providerResults.length,
        totalFound: allMatches.length
      }
    };
  }

  /**
   * Aggregate source results
   * @param {Array} providerResults - Array of provider result objects
   * @returns {Object} Aggregated sources
   */
  aggregateSources(providerResults) {
    const allSources = [];
    const seenSources = new Map(); // key: source name

    for (const result of providerResults) {
      if (!result.sources || !Array.isArray(result.sources)) continue;

      for (const source of result.sources) {
        const key = source.name.toLowerCase();
        
        if (seenSources.has(key)) {
          // Merge results count
          const existing = seenSources.get(key);
          existing.resultsCount += source.resultsCount || 0;
        } else {
          seenSources.set(key, { ...source });
        }
      }
    }

    const deduplicated = Array.from(seenSources.values());

    logger.debug('Sources aggregated', {
      totalProviders: providerResults.length,
      totalSources: deduplicated.length
    });

    return {
      sources: deduplicated,
      metadata: {
        totalProviders: providerResults.length,
        totalSearched: deduplicated.length
      }
    };
  }

  /**
   * Calculate overall confidence score
   * @param {Array} profiles - Matched profiles
   * @param {Array} imageMatches - Image matches
   * @returns {number} Overall confidence (0-100)
   */
  calculateOverallConfidence(profiles, imageMatches) {
    if (profiles.length === 0 && imageMatches.length === 0) {
      return 0;
    }

    let totalConfidence = 0;
    let count = 0;

    // Average profile confidences
    for (const profile of profiles) {
      if (profile.confidence) {
        totalConfidence += profile.confidence;
        count++;
      }
    }

    // Average image match similarities
    for (const match of imageMatches) {
      if (match.similarity) {
        totalConfidence += match.similarity;
        count++;
      }
    }

    return count > 0 ? Math.round(totalConfidence / count) : 0;
  }

  /**
   * Group profiles by potential person/entity
   * @param {Array} profiles - Matched profiles
   * @returns {Array} Grouped profiles
   */
  groupProfilesByEntity(profiles) {
    // Simple grouping by display name similarity
    // In production, this could use more sophisticated matching
    const groups = new Map();

    for (const profile of profiles) {
      const key = (profile.displayName || profile.username).toLowerCase().trim();
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(profile);
    }

    return Array.from(groups.values());
  }
}

module.exports = new MatchAggregator();
