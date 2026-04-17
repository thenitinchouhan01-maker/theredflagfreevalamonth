# Search Pipeline Architecture

## Overview

The DeepTrust backend now uses a **production-oriented, modular search processing pipeline** that replaces the previous mocked implementation. The architecture is designed to be extensible, testable, and ready for real provider integrations.

---

## Architecture Layers

### 1. Input Normalization (`InputNormalizer.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Validates and normalizes search inputs before processing

**Features**:
- Name query normalization (split into parts, extract first/last name)
- Username normalization (handle @ prefix, lowercase, variations)
- Image reference validation
- Search type validation (name, username, photo, mixed)
- Input sanitization and length validation

**Example**:
```javascript
Input: { searchType: 'name', nameQuery: '  John Doe  ' }
Output: {
  searchType: 'name',
  queries: {
    name: {
      original: 'John Doe',
      normalized: 'john doe',
      parts: ['John', 'Doe'],
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe'
    }
  }
}
```

---

### 2. Provider Abstraction (`ProviderInterfaces.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Defines contracts for all search providers

**Provider Types**:

#### PublicProfileProvider
- Searches public profiles by name/username
- Returns: profiles array with platform, username, profileUrl, confidence, etc.

#### ImageMatchProvider
- Performs reverse image search
- Returns: matches array with source, url, similarity, etc.

#### WebSourceProvider
- Searches general web sources
- Returns: sources array with name, status, resultsCount, etc.

**All providers implement**:
- `isAvailable()` - Check if provider is ready
- `getMetadata()` - Get provider information

---

### 3. Placeholder Providers (`PlaceholderProviders.js`)
**Status**: ⚠️ Placeholder (Returns Empty Results)

**Purpose**: Provide empty implementations ready for real integrations

**Current Behavior**:
- `PlaceholderProfileProvider` - Returns empty profiles array
- `PlaceholderImageProvider` - Returns empty matches array
- `PlaceholderWebProvider` - Returns empty sources array

**Important**: These do NOT generate fake/random data. They return valid empty result structures.

**Ready for Integration**:
```javascript
// Example: Replace with real provider
const RealProfileProvider = require('./providers/RealProfileProvider');
SearchProcessor.replaceProvider('profile', new RealProfileProvider());
```

---

### 4. Search Orchestration (`SearchProcessor.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Main pipeline orchestrator

**Flow**:
1. Normalize input
2. Determine which providers to call based on search type
3. Execute provider calls in parallel
4. Handle partial failures gracefully
5. Update search progress
6. Aggregate results
7. Generate flags
8. Build report

**Search Type Routing**:
- `name` → ProfileProvider + WebProvider
- `username` → ProfileProvider + WebProvider
- `photo` → ImageProvider + WebProvider
- `mixed` → All providers

**Progress Tracking**:
- 0% - Search created
- 25% - Profile search started
- 50% - Profile search complete / Image search started
- 75% - Image search complete / Web search started
- 90% - Web search complete
- 100% - Report built

---

### 5. Match Aggregation (`MatchAggregator.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Merge and deduplicate results from multiple providers

**Features**:
- Profile deduplication by platform + username
- Image match deduplication by URL
- Source deduplication by name
- Confidence-based merging (keeps higher confidence)
- Sorting by confidence/similarity

**Example**:
```javascript
// Multiple providers return same profile
Provider1: { platform: 'LinkedIn', username: 'johndoe', confidence: 70 }
Provider2: { platform: 'LinkedIn', username: 'johndoe', confidence: 85 }

// Aggregator keeps higher confidence
Result: { platform: 'LinkedIn', username: 'johndoe', confidence: 85 }
```

---

### 6. Flag Generation (`FlagGenerator.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Generate structured, explainable flags

**Flag Types Generated**:
- No Results - When search returns empty
- Limited Profile Presence - Only 1 profile found
- Low Confidence Matches - Profiles with confidence < 50
- Verified Accounts - Verified profiles found
- Multi-Platform Presence - Profiles across 3+ platforms
- No Image Matches - Image search returned empty
- Multiple Image Matches - Image found in 5+ sources
- Varied Identifiers - Inconsistent usernames/display names
- Search Complete - Successful completion

**Flag Structure**:
```javascript
{
  type: 'info' | 'warning' | 'alert',
  category: 'Flag Category',
  message: 'Human-readable explanation',
  severity: 'low' | 'medium' | 'high' | 'critical',
  source: 'reason_code',
  generatedAt: '2024-01-01T00:00:00.000Z'
}
```

---

### 7. Report Building (`ReportBuilder.js`)
**Status**: ✅ Fully Implemented

**Purpose**: Build deterministic, structured reports

**Report Structure**:
```javascript
{
  summary: {
    totalProfilesFound: number,
    totalImageMatches: number,
    platformsSearched: string[],
    platformsWithResults: string[],
    overallConfidence: number (0-100),
    summaryText: string,
    searchType: string,
    hasResults: boolean
  },
  matchedProfiles: Profile[],
  imageMatches: ImageMatch[],
  flags: Flag[],
  sources: Source[],
  metadata: {
    searchType: string,
    searchQuery: object,
    processedAt: string,
    providersUsed: string[],
    architecture: 'production-pipeline-v1'
  }
}
```

**Empty State Handling**:
- When no providers return data, returns valid empty report
- No fake/random data generation
- Clear flags indicating no results found

---

## Data Flow

```
1. User creates search
   ↓
2. SearchService.createSearch()
   ↓
3. SearchService.processSearch() (async)
   ↓
4. SearchProcessor.process()
   ├─ InputNormalizer.normalize()
   ├─ SearchProcessor.orchestrateProviders()
   │  ├─ ProfileProvider.searchProfiles()
   │  ├─ ImageProvider.searchImages()
   │  └─ WebProvider.searchSources()
   ├─ MatchAggregator.aggregate()
   ├─ FlagGenerator.generateFlags()
   └─ ReportBuilder.buildReport()
   ↓
5. SearchService.createResult()
   ↓
6. Search marked as completed
```

---

## What's Real vs Placeholder

### ✅ Fully Real (Production-Ready)
- Input normalization
- Provider interface definitions
- Search orchestration logic
- Match aggregation and deduplication
- Flag generation
- Report building
- Progress tracking
- Error handling
- Database persistence

### ⚠️ Placeholder (Returns Empty Results)
- Profile search provider
- Image match provider
- Web source provider

**These placeholders return empty arrays, NOT fake data.**

---

## Integration Points

### Adding a Real Profile Provider

```javascript
// 1. Create provider class
const { PublicProfileProvider } = require('./ProviderInterfaces');

class LinkedInProvider extends PublicProfileProvider {
  constructor(apiKey) {
    super('LinkedInProvider');
    this.apiKey = apiKey;
  }

  async searchProfiles(context) {
    // Call LinkedIn API
    const response = await fetch(`https://api.linkedin.com/search?q=${context.queries.name.normalized}`);
    const data = await response.json();

    // Transform to standard format
    return {
      profiles: data.results.map(profile => ({
        platform: 'LinkedIn',
        username: profile.username,
        profileUrl: profile.url,
        displayName: profile.name,
        bio: profile.headline,
        followers: profile.connections,
        isVerified: profile.verified,
        confidence: this.calculateConfidence(profile, context)
      })),
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: data.results.length
      }
    };
  }

  calculateConfidence(profile, context) {
    // Implement confidence scoring logic
    return 85;
  }
}

// 2. Replace placeholder
const SearchProcessor = require('./services/search/SearchProcessor');
SearchProcessor.replaceProvider('profile', new LinkedInProvider(process.env.LINKEDIN_API_KEY));
```

### Adding a Real Image Provider

```javascript
const { ImageMatchProvider } = require('./ProviderInterfaces');

class GoogleVisionProvider extends ImageMatchProvider {
  constructor(apiKey) {
    super('GoogleVisionProvider');
    this.apiKey = apiKey;
  }

  async searchImages(context) {
    // Call Google Vision API
    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: context.image.url } },
          features: [{ type: 'WEB_DETECTION' }]
        }]
      })
    });

    const data = await response.json();

    return {
      matches: data.responses[0].webDetection.pagesWithMatchingImages.map(page => ({
        source: 'Google Vision',
        url: page.url,
        thumbnailUrl: page.pageTitle,
        similarity: page.score * 100,
        pageTitle: page.pageTitle,
        pageUrl: page.url,
        foundAt: new Date().toISOString()
      })),
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: data.responses[0].webDetection.pagesWithMatchingImages.length
      }
    };
  }
}

SearchProcessor.replaceProvider('image', new GoogleVisionProvider(process.env.GOOGLE_VISION_KEY));
```

---

## Sample Result JSON

### Empty Result (Current with Placeholders)
```json
{
  "summary": {
    "totalProfilesFound": 0,
    "totalImageMatches": 0,
    "platformsSearched": ["public_profiles", "social_media", "web_sources"],
    "platformsWithResults": [],
    "overallConfidence": 0,
    "summaryText": "No matching profiles or images found for this search.",
    "searchType": "name",
    "hasResults": false
  },
  "matchedProfiles": [],
  "imageMatches": [],
  "flags": [
    {
      "type": "info",
      "category": "No Results",
      "message": "No matching profiles or images found for this search",
      "severity": "low",
      "source": "search_completion",
      "generatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "sources": [],
  "metadata": {
    "searchType": "name",
    "searchQuery": { "name": "John Doe" },
    "processedAt": "2024-01-01T00:00:00.000Z",
    "providersUsed": [],
    "architecture": "production-pipeline-v1",
    "note": "Empty result - no providers returned data"
  }
}
```

### Result with Real Provider Data (Example)
```json
{
  "summary": {
    "totalProfilesFound": 2,
    "totalImageMatches": 0,
    "platformsSearched": ["public_profiles", "social_media", "web_sources"],
    "platformsWithResults": ["LinkedIn", "Twitter"],
    "overallConfidence": 82,
    "summaryText": "Found 2 potential profiles for \"John Doe\".",
    "searchType": "name",
    "hasResults": true
  },
  "matchedProfiles": [
    {
      "platform": "LinkedIn",
      "username": "johndoe",
      "profileUrl": "https://linkedin.com/in/johndoe",
      "displayName": "John Doe",
      "bio": "Software Engineer at Tech Corp",
      "followers": 500,
      "isVerified": false,
      "confidence": 85
    },
    {
      "platform": "Twitter",
      "username": "johndoe",
      "profileUrl": "https://twitter.com/johndoe",
      "displayName": "John Doe",
      "followers": 1200,
      "isVerified": true,
      "confidence": 78
    }
  ],
  "imageMatches": [],
  "flags": [
    {
      "type": "info",
      "category": "Verified Accounts",
      "message": "1 verified account(s) found",
      "severity": "low",
      "source": "verification"
    },
    {
      "type": "info",
      "category": "Search Complete",
      "message": "Search completed successfully with results",
      "severity": "low",
      "source": "search_completion"
    }
  ],
  "sources": [
    {
      "name": "LinkedIn API",
      "searchedAt": "2024-01-01T00:00:00.000Z",
      "resultsCount": 1,
      "status": "success"
    },
    {
      "name": "Twitter API",
      "searchedAt": "2024-01-01T00:00:00.000Z",
      "resultsCount": 1,
      "status": "success"
    }
  ],
  "metadata": {
    "searchType": "name",
    "searchQuery": { "name": "John Doe" },
    "processedAt": "2024-01-01T00:00:00.000Z",
    "providersUsed": ["profile_provider", "source_provider"],
    "architecture": "production-pipeline-v1"
  }
}
```

---

## Testing

### Test with Current Placeholders
```bash
# All tests should pass with empty results
npm test

# Create a search
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"John Doe"}'

# Get result (will show empty result with proper structure)
curl http://localhost:3000/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

---

## Next Steps for Real Integrations

1. **Choose Provider APIs**:
   - Profile search: LinkedIn API, Twitter API, Facebook Graph API
   - Image search: Google Vision API, TinEye API, Bing Visual Search
   - Web scraping: Puppeteer, Cheerio, Scrapy

2. **Implement Provider Classes**:
   - Extend `PublicProfileProvider`, `ImageMatchProvider`, or `WebSourceProvider`
   - Implement required methods
   - Add API key configuration to `.env`

3. **Replace Placeholders**:
   ```javascript
   SearchProcessor.replaceProvider('profile', new YourProfileProvider());
   SearchProcessor.replaceProvider('image', new YourImageProvider());
   SearchProcessor.replaceProvider('web', new YourWebProvider());
   ```

4. **Test Integration**:
   - Create search
   - Verify provider is called
   - Check result structure
   - Validate confidence scores

5. **Monitor & Iterate**:
   - Check logs for provider errors
   - Adjust confidence scoring
   - Optimize API calls
   - Add caching if needed

---

**Architecture Status**: ✅ Production-Ready
**Provider Status**: ⚠️ Placeholders (Empty Results)
**Ready for Integration**: Yes
**Last Updated**: 2024-03-21
