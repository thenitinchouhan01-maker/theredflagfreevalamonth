/**
 * Search Processor
 * Main orchestrator for the search pipeline
 */

const InputNormalizer = require('./InputNormalizer');
const MatchAggregator = require('./MatchAggregator');
const FlagGenerator = require('./FlagGenerator');
const ReportBuilder = require('./ReportBuilder');
const SerperWebProvider = require('./providers/SerperWebProvider');
const GoogleVisionImageProvider = require('./providers/GoogleVisionImageProvider');
const OpenRouterSummaryProvider = require('./providers/OpenRouterSummaryProvider');
const logger = require('../../utils/logger');

class SearchProcessor {
  constructor() {
    // Initialize real providers
    this.webProvider = new SerperWebProvider();
    this.imageProvider = new GoogleVisionImageProvider();
    this.summaryProvider = new OpenRouterSummaryProvider();
  }

  /**
   * Process a complete search through the pipeline
   * @param {Object} search - Search document from database
   * @param {Object} upload - Upload document (if image search)
   * @returns {Promise<Object>} Processed result
   */
  async process(search, upload = null) {
    try {
      logger.info('Starting search processing', {
        searchId: search._id.toString(),
        searchType: search.searchType
      });

      // Phase 1: Input Normalization
      const normalized = InputNormalizer.normalize({
        searchType: search.searchType,
        nameQuery: search.nameQuery,
        usernameQuery: search.usernameQuery,
        imageId: search.imageId
      });

      const context = InputNormalizer.buildSearchContext(normalized, upload);

      logger.debug('Input normalized', { context });

      // Phase 2: Provider Orchestration
      const providerResults = await this.orchestrateProviders(context, search);

      // Phase 3: Match Aggregation
      const aggregatedData = this.aggregateResults(providerResults);

      // Phase 4: Flag Generation
      const flags = FlagGenerator.generateFlags(aggregatedData, context);

      // Phase 5: AI Summary Generation
      const aiSummary = await this.generateAISummary(aggregatedData, context);

      // Phase 6: Report Building
      const report = ReportBuilder.buildReport(aggregatedData, context, flags, aiSummary);

      logger.info('Search processing complete', {
        searchId: search._id.toString(),
        profilesFound: report.matchedProfiles.length,
        imageMatchesFound: report.imageMatches.length
      });

      return report;

    } catch (error) {
      logger.error('Error in search processing', {
        searchId: search._id.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Orchestrate provider calls based on search type
   * @param {Object} context - Search context
   * @param {Object} search - Search document
   * @returns {Promise<Object>} Provider results
   */
  async orchestrateProviders(context, search) {
    console.log('═══════════════════════════════════════');
    console.log('ORCHESTRATING PROVIDERS');
    console.log('searchType:', context.searchType);
    console.log('═══════════════════════════════════════');

    const results = {
      profiles: [],
      imageMatches: [],
      sources: []
    };

    const providerCalls = [];

    // Determine which providers to call based on search type
    switch (context.searchType) {
      case 'name':
      case 'username':
        console.log('➡️ Calling web provider for name/username search');
        providerCalls.push(
          this.callWebProvider(context, search)
        );
        break;

      case 'photo':
        console.log('➡️ Calling image provider for photo search');
        providerCalls.push(
          this.callImageProvider(context, search)
        );
        break;

      case 'mixed':
        console.log('➡️ Calling web + image providers for mixed search');
        providerCalls.push(
          this.callWebProvider(context, search),
          this.callImageProvider(context, search)
        );
        break;
    }

    // Execute provider calls in parallel
    const providerResults = await Promise.allSettled(providerCalls);

    console.log('═══════════════════════════════════════');
    console.log('PROVIDER RESULTS');
    console.log('Total provider calls:', providerResults.length);
    
    // Collect successful results
    for (let i = 0; i < providerResults.length; i++) {
      const result = providerResults[i];
      console.log(`Provider ${i + 1}:`, result.status);
      
      if (result.status === 'fulfilled' && result.value) {
        console.log('  - profiles:', result.value.profiles?.length || 0);
        console.log('  - matches:', result.value.matches?.length || 0);
        console.log('  - sources:', result.value.sources?.length || 0);
        
        if (result.value.profiles) {
          results.profiles.push(result.value);
        }
        if (result.value.matches) {
          results.imageMatches.push(result.value);
        }
        if (result.value.sources) {
          results.sources.push(result.value);
        }
        if (result.value.labels) {
          results.labels = result.value.labels;
        }
      } else if (result.status === 'rejected') {
        console.log('  ❌ Error:', result.reason?.message);
        logger.warn('Provider call failed', { error: result.reason?.message });
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('ORCHESTRATION COMPLETE');
    console.log('profiles arrays:', results.profiles.length);
    console.log('imageMatches arrays:', results.imageMatches.length);
    console.log('sources arrays:', results.sources.length);
    console.log('═══════════════════════════════════════');

    return results;
  }

  /**
   * Call profile provider with progress tracking
   * @param {Object} context - Search context
   * @param {Object} search - Search document
   * @returns {Promise<Object>} Profile results
   */
  async callProfileProvider(context, search) {
    try {
      await search.updateProgress(25, ['social_media']);
      const result = await this.profileProvider.searchProfiles(context);
      await search.updateProgress(50, ['social_media']);
      return result;
    } catch (error) {
      logger.error('Profile provider error', { error: error.message });
      return { profiles: [], metadata: { error: error.message } };
    }
  }

  /**
   * Call image provider with progress tracking
   * @param {Object} context - Search context
   * @param {Object} search - Search document
   * @returns {Promise<Object>} Image match results
   */
  async callImageProvider(context, search) {
    try {
      await search.updateProgress(50, ['images']);
      const result = await this.imageProvider.searchImages(context);
      await search.updateProgress(75, ['images']);
      return result;
    } catch (error) {
      logger.error('Image provider error', { error: error.message });
      return { matches: [], metadata: { error: error.message } };
    }
  }

  /**
   * Call web provider with progress tracking
   * @param {Object} context - Search context
   * @param {Object} search - Search document
   * @returns {Promise<Object>} Source results
   */
  async callWebProvider(context, search) {
    try {
      await search.updateProgress(75, ['google']);
      const result = await this.webProvider.searchSources(context);
      await search.updateProgress(90, ['google']);
      return result;
    } catch (error) {
      logger.error('Web provider error', { error: error.message });
      return { sources: [], metadata: { error: error.message } };
    }
  }

  /**
   * Aggregate results from all providers
   * @param {Object} providerResults - Results from providers
   * @returns {Object} Aggregated data
   */
  aggregateResults(providerResults) {
    console.log('═══════════════════════════════════════');
    console.log('AGGREGATING RESULTS');
    console.log('profiles arrays to aggregate:', providerResults.profiles.length);
    console.log('imageMatches arrays to aggregate:', providerResults.imageMatches.length);
    console.log('sources arrays to aggregate:', providerResults.sources.length);
    console.log('═══════════════════════════════════════');

    const aggregated = {
      profiles: [],
      imageMatches: [],
      sources: []
    };

    // Aggregate profiles
    if (providerResults.profiles.length > 0) {
      console.log('Aggregating profiles...');
      const profileAgg = MatchAggregator.aggregateProfiles(providerResults.profiles);
      aggregated.profiles = profileAgg.profiles;
      console.log('Aggregated profiles count:', aggregated.profiles.length);
    } else {
      console.log('❌ No profile arrays to aggregate');
    }

    // Aggregate image matches
    if (providerResults.imageMatches.length > 0) {
      console.log('Aggregating image matches...');
      const imageAgg = MatchAggregator.aggregateImageMatches(providerResults.imageMatches);
      aggregated.imageMatches = imageAgg.matches;
      console.log('Aggregated image matches count:', aggregated.imageMatches.length);
    } else {
      console.log('❌ No image match arrays to aggregate');
    }

    // Aggregate sources
    if (providerResults.sources.length > 0) {
      console.log('Aggregating sources...');
      const sourceAgg = MatchAggregator.aggregateSources(providerResults.sources);
      aggregated.sources = sourceAgg.sources;
      console.log('Aggregated sources count:', aggregated.sources.length);
    } else {
      console.log('❌ No source arrays to aggregate');
    }

    console.log('═══════════════════════════════════════');
    console.log('AGGREGATION COMPLETE');
    console.log('Final profiles:', aggregated.profiles.length);
    console.log('Final imageMatches:', aggregated.imageMatches.length);
    console.log('Final sources:', aggregated.sources.length);
    console.log('═══════════════════════════════════════');

    return aggregated;
  }

  /**
   * Generate AI summary from aggregated results
   * @param {Object} aggregatedData - Aggregated search results
   * @param {Object} context - Search context
   * @returns {Promise<Object>} AI summary
   */
  async generateAISummary(aggregatedData, context) {
    try {
      const summaryData = {
        profiles: aggregatedData.profiles || [],
        imageMatches: aggregatedData.imageMatches || [],
        labels: aggregatedData.labels || [],
        searchQuery: {
          name: context.queries?.name?.original,
          username: context.queries?.username?.original
        }
      };

      const summary = await this.summaryProvider.generateSummary(summaryData);
      return summary;
    } catch (error) {
      logger.error('AI summary generation error', { error: error.message });
      return null;
    }
  }

  /**
   * Replace a provider with a real implementation
   * @param {string} providerType - Type of provider (profile, image, web)
   * @param {Object} providerInstance - New provider instance
   */
  replaceProvider(providerType, providerInstance) {
    switch (providerType) {
      case 'profile':
        this.profileProvider = providerInstance;
        logger.info('Profile provider replaced', { provider: providerInstance.name });
        break;
      case 'image':
        this.imageProvider = providerInstance;
        logger.info('Image provider replaced', { provider: providerInstance.name });
        break;
      case 'web':
        this.webProvider = providerInstance;
        logger.info('Web provider replaced', { provider: providerInstance.name });
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  /**
   * Get current provider configuration
   * @returns {Object} Provider info
   */
  getProviderInfo() {
    return {
      profile: this.profileProvider.getMetadata(),
      image: this.imageProvider.getMetadata(),
      web: this.webProvider.getMetadata()
    };
  }
}

module.exports = new SearchProcessor();
