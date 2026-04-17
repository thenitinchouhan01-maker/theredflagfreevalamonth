/**
 * Google Vision Image Match Provider
 * Uses Google Vision API for reverse image search
 */

const { ImageMatchProvider } = require('../ProviderInterfaces');
const axios = require('axios');
const logger = require('../../../utils/logger');

class GoogleVisionImageProvider extends ImageMatchProvider {
  constructor() {
    super('GoogleVisionImageProvider');
    this.apiKey = process.env.GOOGLE_VISION_API_KEY;
    this.baseUrl = 'https://vision.googleapis.com/v1/images:annotate';
    
    if (!this.apiKey) {
      logger.warn('Google Vision API key not configured');
      this.enabled = false;
    }
  }

  /**
   * Search for image matches using Google Vision
   * @param {Object} context - Search context with image data
   * @returns {Promise<Object>} Image match results
   */
  async searchImages(context) {
    if (!this.enabled) {
      return this.getEmptyResult('API key not configured');
    }

    if (!context.image || !context.image.url) {
      return this.getEmptyResult('No image URL provided');
    }

    try {
      const imageUrl = context.image.url;
      
      logger.info('Google Vision image search', { imageUrl });

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: 'WEB_DETECTION', maxResults: 20 },
                { type: 'LABEL_DETECTION', maxResults: 10 }
              ]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const results = this.normalizeResults(response.data);
      
      logger.info('Google Vision search completed', { 
        matchesCount: results.matches.length 
      });

      return {
        matches: results.matches,
        labels: results.labels,
        metadata: {
          provider: this.name,
          searchedAt: new Date().toISOString(),
          totalFound: results.matches.length
        }
      };

    } catch (error) {
      logger.error('Google Vision API error', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return this.getEmptyResult(error.message);
    }
  }

  /**
   * Normalize Google Vision results to our format
   * @param {Object} data - Google Vision API response
   * @returns {Object} Normalized results
   */
  normalizeResults(data) {
    const matches = [];
    const labels = [];
    const seenUrls = new Set();

    if (!data.responses || !data.responses[0]) {
      return { matches, labels };
    }

    const response = data.responses[0];
    const webDetection = response.webDetection;

    // Extract labels for identity hints
    if (response.labelAnnotations) {
      for (const label of response.labelAnnotations) {
        labels.push({
          description: label.description,
          score: Math.round(label.score * 100),
          confidence: Math.round(label.score * 100)
        });
      }
    }

    if (!webDetection) {
      return { matches, labels };
    }

    // Full matching images (exact matches)
    if (webDetection.fullMatchingImages) {
      for (const image of webDetection.fullMatchingImages) {
        if (!seenUrls.has(image.url)) {
          seenUrls.add(image.url);
          matches.push({
            source: this.extractSource(image.url),
            url: image.url,
            similarity: 100,
            matchType: 'exact',
            foundAt: new Date().toISOString()
          });
        }
      }
    }

    // Partial matching images
    if (webDetection.partialMatchingImages) {
      for (const image of webDetection.partialMatchingImages) {
        if (!seenUrls.has(image.url)) {
          seenUrls.add(image.url);
          matches.push({
            source: this.extractSource(image.url),
            url: image.url,
            similarity: 85,
            matchType: 'partial',
            foundAt: new Date().toISOString()
          });
        }
      }
    }

    // Pages with matching images
    if (webDetection.pagesWithMatchingImages) {
      for (const page of webDetection.pagesWithMatchingImages) {
        const imageUrl = page.fullMatchingImages?.[0]?.url || 
                        page.partialMatchingImages?.[0]?.url;
        
        if (imageUrl && !seenUrls.has(imageUrl)) {
          seenUrls.add(imageUrl);
          
          const source = this.extractSource(page.url);
          const similarity = page.fullMatchingImages?.length > 0 ? 95 : 80;
          
          matches.push({
            source,
            url: imageUrl,
            pageUrl: page.url,
            pageTitle: page.pageTitle || '',
            similarity,
            matchType: page.fullMatchingImages?.length > 0 ? 'page_exact' : 'page_partial',
            foundAt: new Date().toISOString(),
            metadata: {
              platform: source
            }
          });
        }
      }
    }

    // Visually similar images
    if (webDetection.visuallySimilarImages) {
      for (const image of webDetection.visuallySimilarImages.slice(0, 10)) {
        if (!seenUrls.has(image.url)) {
          seenUrls.add(image.url);
          matches.push({
            source: this.extractSource(image.url),
            url: image.url,
            similarity: 70,
            matchType: 'similar',
            foundAt: new Date().toISOString()
          });
        }
      }
    }

    // Best guess labels
    if (webDetection.bestGuessLabels) {
      for (const guess of webDetection.bestGuessLabels) {
        if (guess.label) {
          labels.push({
            description: guess.label,
            score: 90,
            confidence: 90,
            type: 'best_guess'
          });
        }
      }
    }

    return { matches, labels };
  }

  /**
   * Extract source/platform from URL
   * @param {string} url - Image or page URL
   * @returns {string} Source name
   */
  extractSource(url) {
    if (!url) return 'Web';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('instagram.com')) return 'Instagram';
    if (urlLower.includes('facebook.com')) return 'Facebook';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter';
    if (urlLower.includes('linkedin.com')) return 'LinkedIn';
    if (urlLower.includes('pinterest.com')) return 'Pinterest';
    if (urlLower.includes('reddit.com')) return 'Reddit';
    if (urlLower.includes('tumblr.com')) return 'Tumblr';
    if (urlLower.includes('flickr.com')) return 'Flickr';
    if (urlLower.includes('imgur.com')) return 'Imgur';
    if (urlLower.includes('youtube.com')) return 'YouTube';
    if (urlLower.includes('tiktok.com')) return 'TikTok';
    
    // News sites
    if (urlLower.includes('news') || urlLower.includes('article')) return 'News';
    
    // Try to extract domain
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Web';
    }
  }

  /**
   * Get empty result structure
   * @param {string} reason - Reason for empty result
   * @returns {Object} Empty result
   */
  getEmptyResult(reason) {
    return {
      matches: [],
      labels: [],
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: 0,
        note: reason || 'No matches found'
      }
    };
  }
}

module.exports = GoogleVisionImageProvider;
