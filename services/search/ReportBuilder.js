/**
 * Report Builder
 * Builds deterministic, structured reports from search results
 */

const logger = require('../../utils/logger');

class ReportBuilder {
  /**
   * Build complete report from aggregated data
   * @param {Object} aggregatedData - Aggregated search results
   * @param {Object} context - Search context
   * @param {Array} flags - Generated flags
   * @param {Object} aiSummary - AI-generated summary (optional)
   * @returns {Object} Complete report
   */
  buildReport(aggregatedData, context, flags, aiSummary = null) {
    let summary;

    // Validate AI summary with strict type checking
    const isValidAISummary =
      aiSummary &&
      typeof aiSummary === 'object' &&
      aiSummary.summary &&
      typeof aiSummary.identityConfidence === 'number';

    if (isValidAISummary) {
      summary = this.mapAISummaryToLegacy(aiSummary, aggregatedData, context);

      // Enforce logical consistency: prevent AI hallucination
      const hasData =
        (aggregatedData.profiles?.length || 0) > 0 ||
        (aggregatedData.images?.length || 0) > 0 ||
        (aggregatedData.imageMatches?.length || 0) > 0;

      if (!hasData) {
        const originalConfidence = summary.overallConfidence;
        
        // Cap confidence at 20 when no data exists
        summary.overallConfidence = Math.min(summary.overallConfidence, 20);

        // Override summary text to reflect reality
        summary.summaryText =
          'No strong matches found. Results may be inaccurate or unavailable.';

        logger.warn('Confidence corrected due to no data', {
          originalConfidence: originalConfidence,
          correctedConfidence: summary.overallConfidence,
          aiConfidence: aiSummary?.identityConfidence,
          profiles: aggregatedData.profiles?.length || 0,
          images: aggregatedData.imageMatches?.length || 0,
          reason: 'AI hallucination prevention'
        });
                                } else {
        // Data strength validation: normalize confidence based on actual data quality
        const profilesCount = aggregatedData.profiles?.length || 0;
        const imagesCount = (aggregatedData.images?.length || 0) + (aggregatedData.imageMatches?.length || 0);

        // Calculate data strength multiplier
        let dataStrength = 0;

        if (profilesCount >= 5) {
          dataStrength = 1.0;  // Strong data: 5+ profiles
        } else if (profilesCount >= 3) {
          dataStrength = 0.7;  // Moderate data: 3-4 profiles
        } else if (profilesCount >= 1) {
          dataStrength = 0.4;  // Weak data: 1-2 profiles
        } else if (imagesCount > 0) {
          dataStrength = 0.3;  // Very weak: only images, no profiles
        } else {
          dataStrength = 0;    // No data
        }

        // Store original confidence for logging
        const originalConfidence = summary.overallConfidence;

        // Normalize confidence: 60% AI confidence + 40% data strength
        summary.overallConfidence = Math.round(
          (summary.overallConfidence * 0.6) + (dataStrength * 100 * 0.4)
        );

        // Safety cap: ensure no data = low confidence
        if (profilesCount === 0 && imagesCount === 0) {
          summary.overallConfidence = Math.min(summary.overallConfidence, 20);
        }

        logger.info('Confidence normalized based on data strength', {
          originalConfidence: originalConfidence,
          normalizedConfidence: summary.overallConfidence,
          dataStrength: dataStrength,
          profilesCount: profilesCount,
          imagesCount: imagesCount,
          reason: 'Data strength validation'
        });
      }

      logger.info('Using AI-generated summary', {
        confidence: summary.overallConfidence,
        riskLevel: summary.riskLevel,
        usedAISummary: true,
        corrected: !hasData
      });
    } else {
      summary = this.buildSummary(aggregatedData, context);

      logger.warn('Falling back to static summary', {
        reason: 'AI summary missing or invalid',
        usedAISummary: false
      });
    }

    // Debug log before saving to DB
    logger.debug('Final summary being saved', {
      confidence: summary.overallConfidence,
      profiles: summary.totalProfilesFound,
      images: summary.totalImageMatches,
      usedAI: isValidAISummary
    });

    const report = {
      summary: summary,
      matchedProfiles: this.formatProfiles(aggregatedData.profiles || []),
      imageMatches: aggregatedData.imageMatches || [],
      imageLabels: aggregatedData.labels || [],
      flags: flags || [],
      sources: aggregatedData.sources || [],
      aiAnalysis: aiSummary || null,
      metadata: this.buildMetadata(context, aggregatedData)
    };

    logger.info('Report built', {
      profilesFound: report.matchedProfiles.length,
      imageMatchesFound: report.imageMatches.length,
      flagsGenerated: report.flags.length,
      sourcesSearched: report.sources.length,
      usedAISummary: isValidAISummary,
      summaryConfidence: summary.overallConfidence
    });

    return report;
  }

  /**
   * Format profiles for consistent API response and database storage
   * Limits to top 20 profiles to prevent payload bloat
   * @param {Array} profiles - Raw profiles from aggregation
   * @returns {Array} Formatted profiles
   */
  formatProfiles(profiles) {
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return [];
    }

    const formatted = profiles.slice(0, 20).map(profile => ({
      platform: profile.platform || 'unknown',
      username: profile.username || null,
      profileUrl: profile.profileUrl || profile.url || null,
      displayName: profile.displayName || profile.fullName || profile.name || null,
      bio: profile.bio || null,
      profileImage: profile.profileImage || profile.avatar || null,
      followers: profile.followers || 0,
      following: profile.following || 0,
      posts: profile.posts || 0,
      location: profile.location || null,
      isVerified: profile.isVerified || profile.verified || false,
      confidence: profile.confidence || 50,
      metadata: profile.metadata || null
    }));

    logger.debug('Profiles formatted', {
      totalProfiles: profiles.length,
      returnedProfiles: formatted.length,
      limited: profiles.length > 20
    });

    return formatted;
  }

  /**
   * Map AI summary to legacy database schema format
   * @param {Object} aiSummary - AI-generated summary from OpenRouter
   * @param {Object} aggregatedData - Aggregated search results
   * @param {Object} context - Search context
   * @returns {Object} Summary in legacy format
   */
  mapAISummaryToLegacy(aiSummary, aggregatedData, context) {
    const profiles = aggregatedData.profiles || [];
    const imageMatches = aggregatedData.imageMatches || [];
    
    // Extract unique platforms from profiles
    const platformsWithResults = [...new Set(profiles.map(p => p.platform))];
    
    return {
      totalProfilesFound: profiles.length,
      totalImageMatches: imageMatches.length,
      platformsSearched: this.getPlatformsSearched(context),
      platformsWithResults: platformsWithResults,
      overallConfidence: aiSummary.identityConfidence || 0,
      summaryText: aiSummary.summary || 'No summary available',
      searchType: context.searchType,
      hasResults: profiles.length > 0 || imageMatches.length > 0,
      // AI-specific fields (optional, for enhanced data)
      riskLevel: aiSummary.riskLevel,
      riskFlags: aiSummary.riskFlags || [],
      platformsFound: aiSummary.platformsFound || [],
      duplicateImageRisk: aiSummary.duplicateImageRisk || false,
      recommendations: aiSummary.recommendations || []
    };
  }

  /**
   * Build summary section
   * @param {Object} aggregatedData - Aggregated results
   * @param {Object} context - Search context
   * @returns {Object} Summary object
   */
  buildSummary(aggregatedData, context) {
    const totalProfiles = aggregatedData.profiles?.length || 0;
    const totalImageMatches = aggregatedData.imageMatches?.length || 0;
    const platforms = [...new Set((aggregatedData.profiles || []).map(p => p.platform))];
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      aggregatedData.profiles || [],
      aggregatedData.imageMatches || []
    );

    // Build summary text
    const summaryText = this.buildSummaryText(totalProfiles, totalImageMatches, context);

    return {
      totalProfilesFound: totalProfiles,
      totalImageMatches: totalImageMatches,
      platformsSearched: this.getPlatformsSearched(context),
      platformsWithResults: platforms,
      overallConfidence,
      summaryText,
      searchType: context.searchType,
      hasResults: totalProfiles > 0 || totalImageMatches > 0
    };
  }

  /**
   * Calculate overall confidence score
   * @param {Array} profiles - Matched profiles
   * @param {Array} imageMatches - Image matches
   * @returns {number} Confidence score (0-100)
   */
  calculateOverallConfidence(profiles, imageMatches) {
    if (profiles.length === 0 && imageMatches.length === 0) {
      return 0;
    }

    let totalConfidence = 0;
    let count = 0;

    for (const profile of profiles) {
      if (profile.confidence) {
        totalConfidence += profile.confidence;
        count++;
      }
    }

    for (const match of imageMatches) {
      if (match.similarity) {
        totalConfidence += match.similarity;
        count++;
      }
    }

    return count > 0 ? Math.round(totalConfidence / count) : 0;
  }

  /**
   * Build human-readable summary text
   * @param {number} profileCount - Number of profiles found
   * @param {number} imageCount - Number of image matches
   * @param {Object} context - Search context
   * @returns {string} Summary text
   */
  buildSummaryText(profileCount, imageCount, context) {
    if (profileCount === 0 && imageCount === 0) {
      return 'No matching profiles or images found for this search.';
    }

    const parts = [];

    if (profileCount > 0) {
      parts.push(`Found ${profileCount} potential profile${profileCount !== 1 ? 's' : ''}`);
    }

    if (imageCount > 0) {
      parts.push(`${imageCount} image match${imageCount !== 1 ? 'es' : ''}`);
    }

    let text = parts.join(' and ');
    
    if (context.searchType === 'name' && context.queries.name) {
      text += ` for "${context.queries.name.original}"`;
    } else if (context.searchType === 'username' && context.queries.username) {
      text += ` for username "${context.queries.username.original}"`;
    } else if (context.searchType === 'photo') {
      text += ' for the uploaded image';
    } else if (context.searchType === 'mixed') {
      text += ' matching your search criteria';
    }

    return text + '.';
  }

  /**
   * Get list of platforms searched
   * Note: These are category labels for Result.summary.platformsSearched (no enum restriction)
   * Different from Search.sourcesSearched which has strict enum validation
   * @param {Object} context - Search context
   * @returns {Array} Platform names
   */
  getPlatformsSearched(context) {
    // This would be determined by which providers were used
    // For now, return a standard list
    const platforms = [];

    if (context.searchType === 'name' || context.searchType === 'username' || context.searchType === 'mixed') {
      platforms.push('public_profiles', 'social_media');
    }

    if (context.searchType === 'photo' || context.searchType === 'mixed') {
      platforms.push('image_search');
    }

    platforms.push('web_sources');

    return platforms;
  }

  /**
   * Build metadata section
   * @param {Object} context - Search context
   * @param {Object} aggregatedData - Aggregated results
   * @returns {Object} Metadata object
   */
  buildMetadata(context, aggregatedData) {
    return {
      searchType: context.searchType,
      searchQuery: this.extractSearchQuery(context),
      processedAt: new Date().toISOString(),
      providersUsed: this.getProvidersUsed(aggregatedData),
      architecture: 'production-pipeline-v1',
      note: 'Results from pluggable provider architecture'
    };
  }

  /**
   * Extract search query for metadata
   * @param {Object} context - Search context
   * @returns {Object} Search query info
   */
  extractSearchQuery(context) {
    const query = {};

    if (context.queries.name) {
      query.name = context.queries.name.original;
    }

    if (context.queries.username) {
      query.username = context.queries.username.original;
    }

    if (context.image) {
      query.imageId = context.image.imageId;
    }

    return query;
  }

  /**
   * Get list of providers that were used
   * @param {Object} aggregatedData - Aggregated results
   * @returns {Array} Provider names
   */
  getProvidersUsed(aggregatedData) {
    const providers = new Set();

    if (aggregatedData.profiles && aggregatedData.profiles.length > 0) {
      providers.add('profile_provider');
    }

    if (aggregatedData.imageMatches && aggregatedData.imageMatches.length > 0) {
      providers.add('image_provider');
    }

    if (aggregatedData.sources && aggregatedData.sources.length > 0) {
      providers.add('source_provider');
    }

    return Array.from(providers);
  }

  /**
   * Build empty state report (when no results found)
   * @param {Object} context - Search context
   * @returns {Object} Empty state report
   */
  buildEmptyReport(context) {
    return {
      summary: {
        totalProfilesFound: 0,
        totalImageMatches: 0,
        platformsSearched: this.getPlatformsSearched(context),
        platformsWithResults: [],
        overallConfidence: 0,
        summaryText: 'No matching profiles or images found for this search.',
        searchType: context.searchType,
        hasResults: false
      },
      matchedProfiles: [],
      imageMatches: [],
      flags: [
        {
          type: 'info',
          category: 'No Results',
          message: 'Search completed but no matching results were found',
          severity: 'low',
          source: 'search_completion'
        }
      ],
      sources: [],
      metadata: {
        searchType: context.searchType,
        searchQuery: this.extractSearchQuery(context),
        processedAt: new Date().toISOString(),
        providersUsed: [],
        architecture: 'production-pipeline-v1',
        note: 'Empty result - no providers returned data'
      }
    };
  }
}

module.exports = new ReportBuilder();
