/**
 * Mock Web Provider for Testing
 * Returns sample data when real API keys are not configured
 */

const { WebSourceProvider } = require('../ProviderInterfaces');
const logger = require('../../../utils/logger');

class MockWebProvider extends WebSourceProvider {
  constructor() {
    super('MockWebProvider');
    this.enabled = true;
  }

  /**
   * Search web sources (returns mock data)
   * @param {Object} context - Search context
   * @returns {Promise<Object>} Mock search results
   */
  async searchSources(context) {
    logger.info('Mock web search (using sample data)', { 
      searchType: context.searchType,
      query: context.queries?.name?.original || context.queries?.username?.original
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const query = context.queries?.name?.original || context.queries?.username?.original || 'Unknown';

    const profiles = [
      {
        platform: 'LinkedIn',
        username: 'johndoe',
        profileUrl: 'https://linkedin.com/in/johndoe',
        displayName: query,
        bio: 'Software Engineer at Tech Company',
        profileImage: 'https://via.placeholder.com/150',
        followers: 500,
        following: 300,
        location: 'San Francisco, CA',
        isVerified: false,
        confidence: 85,
        metadata: {
          position: 1,
          source: 'mock'
        }
      },
      {
        platform: 'Twitter',
        username: 'johndoe',
        profileUrl: 'https://twitter.com/johndoe',
        displayName: query,
        bio: 'Tech enthusiast | Software Developer',
        profileImage: 'https://via.placeholder.com/150',
        followers: 1200,
        following: 450,
        posts: 350,
        isVerified: false,
        confidence: 75,
        metadata: {
          position: 2,
          source: 'mock'
        }
      },
      {
        platform: 'GitHub',
        username: 'johndoe',
        profileUrl: 'https://github.com/johndoe',
        displayName: query,
        bio: 'Open source contributor',
        profileImage: 'https://via.placeholder.com/150',
        followers: 89,
        following: 45,
        location: 'San Francisco, CA',
        isVerified: false,
        confidence: 70,
        metadata: {
          position: 3,
          source: 'mock'
        }
      }
    ];

    const sources = [
      {
        name: 'LinkedIn',
        url: 'https://linkedin.com',
        searchedAt: new Date().toISOString(),
        resultsCount: 1,
        status: 'success'
      },
      {
        name: 'Twitter',
        url: 'https://twitter.com',
        searchedAt: new Date().toISOString(),
        resultsCount: 1,
        status: 'success'
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        searchedAt: new Date().toISOString(),
        resultsCount: 1,
        status: 'success'
      }
    ];

    logger.info('Mock search completed', { 
      resultsCount: profiles.length 
    });

    return {
      profiles,
      sources,
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: profiles.length,
        query,
        note: 'MOCK DATA - Replace with real provider when API keys are configured'
      }
    };
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: 'web_source',
      enabled: this.enabled,
      note: 'Mock provider for testing - returns sample data'
    };
  }
}

module.exports = MockWebProvider;
