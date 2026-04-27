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
    console.log('═══════════════════════════════════════');
    console.log('SERPER PROVIDER CALLED');
    console.log('enabled:', this.enabled);
    console.log('apiKeyExists:', !!this.apiKey);
    console.log('apiKeyLength:', this.apiKey?.length || 0);
    console.log('═══════════════════════════════════════');

    if (!this.enabled) {
      console.log('❌ SERPER DISABLED - returning empty');
      return this.getEmptyResult('API key not configured');
    }

    try {
      const query = this.buildSearchQuery(context);
      
      console.log('═══════════════════════════════════════');
      console.log('SERPER REQUEST');
      console.log('query:', query);
      console.log('endpoint:', this.baseUrl);
      console.log('apiKey (first 10 chars):', this.apiKey?.substring(0, 10) + '...');
      console.log('═══════════════════════════════════════');

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

      console.log('═══════════════════════════════════════');
      console.log('SERPER RESPONSE RECEIVED');
      console.log('status:', response.status);
      console.log('statusText:', response.statusText);
      console.log('data keys:', Object.keys(response.data || {}));
      console.log('organic results count:', response.data?.organic?.length || 0);
      console.log('═══════════════════════════════════════');
      console.log('SERPER RAW RESPONSE:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════');

      const results = this.normalizeResults(response.data);
      
      console.log('═══════════════════════════════════════');
      console.log('SERPER NORMALIZED RESULTS');
      console.log('profiles count:', results.profiles.length);
      console.log('sources count:', results.sources.length);
      if (results.profiles.length > 0) {
        console.log('First profile:', JSON.stringify(results.profiles[0], null, 2));
      }
      console.log('═══════════════════════════════════════');

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
      console.error('═══════════════════════════════════════');
      console.error('SERPER API ERROR');
      console.error('error message:', error.message);
      console.error('error code:', error.code);
      console.error('response status:', error.response?.status);
      console.error('response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('stack:', error.stack);
      console.error('═══════════════════════════════════════');

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
    console.log('═══════════════════════════════════════');
    console.log('NORMALIZING SERPER RESULTS');
    console.log('data.organic exists:', !!data.organic);
    console.log('data.organic length:', data.organic?.length || 0);
    console.log('═══════════════════════════════════════');

    const profiles = [];
    const sources = [];
    const seenUrls = new Set();

    if (data.organic) {
      console.log('Processing', data.organic.length, 'organic results...');
      
      for (const result of data.organic) {
        console.log('---');
        console.log('Result:', {
          position: result.position,
          title: result.title,
          link: result.link,
          snippet: result.snippet?.substring(0, 100)
        });

        if (seenUrls.has(result.link)) {
          console.log('❌ Skipped: duplicate URL');
          continue;
        }
        seenUrls.add(result.link);

        const platform = this.extractPlatform(result.link);
        console.log('Extracted platform:', platform);
        
        const isValid = this.isValidPlatform(platform);
        console.log('Is valid platform:', isValid);

        if (isValid) {
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

          console.log('✅ Profile created:', {
            platform: profile.platform,
            username: profile.username,
            displayName: profile.displayName,
            confidence: profile.confidence
          });

          profiles.push(profile);
          
          sources.push({
            name: platform,
            url: result.link,
            searchedAt: new Date().toISOString(),
            resultsCount: 1,
            status: 'success'
          });
        } else {
          console.log('❌ Skipped: invalid platform');
        }
      }
    } else {
      console.log('❌ No organic results in response');
    }

    console.log('═══════════════════════════════════════');
    console.log('NORMALIZATION COMPLETE');
    console.log('Total profiles created:', profiles.length);
    console.log('Total sources created:', sources.length);
    console.log('═══════════════════════════════════════');

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
