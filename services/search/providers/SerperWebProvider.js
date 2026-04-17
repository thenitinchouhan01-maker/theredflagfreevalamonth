/**
 * Serper Web Search Provider
 * Uses Serper.dev API for Google search results
 */

const { WebSourceProvider } = require('../ProviderInterfaces');
const axios = require('axios');
const logger = require('../../../utils/logger');

class SerperWebProvider extends WebSourceProvider {
  constructor() {
    super('SerperWebProvider');
    this.apiKey = process.env.SERPER_API_KEY;
    this.baseUrl = 'https://google.serper.dev/search';
    
    if (!this.apiKey) {
      logger.warn('Serper API key not configured');
      this.enabled = false;
    }
  }

  /**
   * Search web sources using Serper API
   * @param {Object} context - Search context
   * @returns {Promise<Object>} Web search results
   */
  async searchSources(context) {
    if (!this.enabled) {
      return this.getEmptyResult('API key not configured');
    }

    try {
      const query = this.buildSearchQuery(context);
      
      logger.info('Serper web search', { query });

      const response = await axios.post(
        this.baseUrl,
        { q: query, num: 20 },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const results = this.normalizeResults(response.data);
      
      logger.info('Serper search completed', { 
        resultsCount: results.profiles.length 
      });

      return {
        profiles: results.profiles,
        sources: results.sources,
        metadata: {
          provider: this.name,
          searchedAt: new Date().toISOString(),
          totalFound: results.profiles.length,
          query
        }
      };

    } catch (error) {
      logger.error('Serper API error', { 
        error: error.message,
        status: error.response?.status 
      });
      
      return this.getEmptyResult(error.message);
    }
  }

  /**
   * Build search query from context
   * @param {Object} context - Search context
   * @returns {string} Search query
   */
  buildSearchQuery(context) {
    const { searchType, queries } = context;
    
    if (searchType === 'name' && queries.name) {
      return `"${queries.name.original}" site:linkedin.com OR site:twitter.com OR site:instagram.com OR site:facebook.com OR site:github.com`;
    }
    
    if (searchType === 'username' && queries.username) {
      return `"${queries.username.original}" site:linkedin.com OR site:twitter.com OR site:instagram.com OR site:facebook.com OR site:github.com`;
    }
    
    if (searchType === 'mixed' && queries.name && queries.username) {
      return `"${queries.name.original}" "${queries.username.original}" site:linkedin.com OR site:twitter.com OR site:instagram.com`;
    }
    
    return queries.name?.original || queries.username?.original || '';
  }

  /**
   * Normalize Serper results to our format
   * @param {Object} data - Serper API response
   * @returns {Object} Normalized results
   */
  normalizeResults(data) {
    const profiles = [];
    const sources = [];
    const seenUrls = new Set();

    if (data.organic) {
      for (const result of data.organic) {
        if (seenUrls.has(result.link)) continue;
        seenUrls.add(result.link);

        const platform = this.extractPlatform(result.link);
        
        if (this.isValidPlatform(platform)) {
          const profile = {
            platform,
            username: this.extractUsername(result.link, platform),
            profileUrl: result.link,
            displayName: this.cleanTitle(result.title),
            bio: result.snippet || '',
            isVerified: false,
            confidence: this.calculateConfidence(result, platform),
            metadata: {
              position: result.position,
              source: 'serper'
            }
          };

          profiles.push(profile);
          
          sources.push({
            name: platform,
            url: result.link,
            searchedAt: new Date().toISOString(),
            resultsCount: 1,
            status: 'success'
          });
        }
      }
    }

    return { profiles, sources };
  }

  /**
   * Extract platform from URL
   * @param {string} url - Profile URL
   * @returns {string} Platform name
   */
  extractPlatform(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('linkedin.com')) return 'LinkedIn';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter';
    if (urlLower.includes('instagram.com')) return 'Instagram';
    if (urlLower.includes('facebook.com')) return 'Facebook';
    if (urlLower.includes('github.com')) return 'GitHub';
    if (urlLower.includes('medium.com')) return 'Medium';
    if (urlLower.includes('youtube.com')) return 'YouTube';
    
    return 'Web';
  }

  /**
   * Check if platform is valid for profiles
   * @param {string} platform - Platform name
   * @returns {boolean} Is valid
   */
  isValidPlatform(platform) {
    const validPlatforms = [
      'LinkedIn', 'Twitter', 'Instagram', 
      'Facebook', 'GitHub', 'Medium', 'YouTube'
    ];
    return validPlatforms.includes(platform);
  }

  /**
   * Extract username from URL
   * @param {string} url - Profile URL
   * @param {string} platform - Platform name
   * @returns {string} Username
   */
  extractUsername(url, platform) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      
      if (platform === 'LinkedIn') {
        const inIndex = pathParts.indexOf('in');
        return inIndex >= 0 && pathParts[inIndex + 1] 
          ? pathParts[inIndex + 1] 
          : pathParts[0] || 'unknown';
      }
      
      if (platform === 'GitHub') {
        return pathParts[0] || 'unknown';
      }
      
      return pathParts[0] || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clean title text
   * @param {string} title - Raw title
   * @returns {string} Cleaned title
   */
  cleanTitle(title) {
    return title
      .replace(/\s*-\s*LinkedIn.*$/i, '')
      .replace(/\s*\|\s*LinkedIn.*$/i, '')
      .replace(/\s*on Twitter.*$/i, '')
      .replace(/\s*\(@.*\).*$/i, '')
      .replace(/\s*•.*$/i, '')
      .trim();
  }

  /**
   * Calculate confidence score
   * @param {Object} result - Search result
   * @param {string} platform - Platform name
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidence(result, platform) {
    let score = 50; // Base score
    
    // Position bonus (higher = better)
    if (result.position <= 3) score += 20;
    else if (result.position <= 10) score += 10;
    else if (result.position <= 20) score += 5;
    
    // Platform credibility
    if (platform === 'LinkedIn') score += 15;
    else if (platform === 'GitHub') score += 10;
    else if (platform === 'Twitter') score += 10;
    else if (platform === 'Instagram') score += 5;
    
    // Has snippet
    if (result.snippet && result.snippet.length > 50) score += 10;
    
    // Title quality
    if (result.title && result.title.length > 20) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Get empty result structure
   * @param {string} reason - Reason for empty result
   * @returns {Object} Empty result
   */
  getEmptyResult(reason) {
    return {
      profiles: [],
      sources: [],
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: 0,
        note: reason || 'No results found'
      }
    };
  }
}

module.exports = SerperWebProvider;
