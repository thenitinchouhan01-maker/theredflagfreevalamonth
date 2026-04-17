/**
 * Provider Registry
 * Central registry for all search providers
 * 
 * TO ADD REAL PROVIDERS:
 * 1. Create new provider class extending BaseProvider interfaces
 * 2. Implement required methods (searchProfiles, searchImage, searchWeb)
 * 3. Add provider to registry below
 * 4. Configure in SearchProcessor
 */

const PlaceholderProfileProvider = require('./PlaceholderProfileProvider');
const PlaceholderImageProvider = require('./PlaceholderImageProvider');
const PlaceholderWebProvider = require('./PlaceholderWebProvider');

/**
 * Available provider implementations
 * Add real providers here as they are implemented
 */
const PROVIDERS = {
  // Profile providers
  profile: {
    placeholder: PlaceholderProfileProvider,
    // linkedin: LinkedInProvider,        // TODO: Implement
    // twitter: TwitterProvider,          // TODO: Implement
    // instagram: InstagramProvider,      // TODO: Implement
    // github: GitHubProvider,            // TODO: Implement
  },
  
  // Image providers
  image: {
    placeholder: PlaceholderImageProvider,
    // googleVision: GoogleVisionProvider,  // TODO: Implement
    // tineye: TinEyeProvider,              // TODO: Implement
    // bingVisual: BingVisualProvider,      // TODO: Implement
  },
  
  // Web providers
  web: {
    placeholder: PlaceholderWebProvider,
    // googleSearch: GoogleSearchProvider,  // TODO: Implement
    // bingSearch: BingSearchProvider,      // TODO: Implement
  }
};

/**
 * Get provider instance by type and name
 * @param {string} type - Provider type (profile, image, web)
 * @param {string} name - Provider name
 * @param {Object} config - Provider configuration
 * @returns {Object} Provider instance
 */
function getProvider(type, name, config = {}) {
  const ProviderClass = PROVIDERS[type]?.[name];
  
  if (!ProviderClass) {
    throw new Error(`Provider not found: ${type}.${name}`);
  }
  
  return new ProviderClass(config);
}

/**
 * Get all providers of a type
 * @param {string} type - Provider type
 * @returns {Array} Array of provider names
 */
function getProviderNames(type) {
  return Object.keys(PROVIDERS[type] || {});
}

module.exports = {
  PROVIDERS,
  getProvider,
  getProviderNames,
  PlaceholderProfileProvider,
  PlaceholderImageProvider,
  PlaceholderWebProvider
};
