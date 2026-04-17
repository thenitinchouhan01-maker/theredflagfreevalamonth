# Provider Integration - Quick Reference Card

## 🎯 At a Glance

| Provider | Status | Priority | API | Cost/Search | Time to Integrate |
|---|---|---|---|---|---|
| **PublicProfileProvider** | Placeholder | ⭐⭐⭐⭐⭐ | Pipl | $0.50-1.00 | 2-4 hours |
| **ImageMatchProvider** | Placeholder | ⭐⭐⭐⭐ | Google Vision | $0.001-0.003 | 3-5 hours |
| **WebSourceProvider** | Placeholder | ⭐⭐⭐ | SerpAPI | $0.01-0.05 | 1-2 hours |

---

## 📝 Provider Contracts

### PublicProfileProvider
```javascript
// INPUT
{
  searchType: "name" | "username" | "mixed",
  queries: {
    name: { original, normalized, firstName, lastName },
    username: { original, normalized, withoutAt, withAt }
  }
}

// OUTPUT
{
  profiles: [{
    platform: string,        // Required
    username: string,        // Required
    profileUrl: string,      // Required
    displayName: string,     // Required
    confidence: number,      // Required (0-100)
    isVerified: boolean,     // Required
    bio: string,            // Optional
    profileImage: string,   // Optional
    followers: number,      // Optional
    location: string        // Optional
  }],
  metadata: { provider, searchedAt, totalFound }
}
```

### ImageMatchProvider
```javascript
// INPUT
{
  searchType: "photo" | "mixed",
  image: {
    imageId: string,
    url: string,
    format: string,
    width: number,
    height: number
  }
}

// OUTPUT
{
  matches: [{
    source: string,         // Required
    url: string,           // Required
    similarity: number,    // Required (0-100)
    foundAt: string,       // Required (ISO date)
    pageUrl: string,       // Optional
    pageTitle: string      // Optional
  }],
  metadata: { provider, searchedAt, totalFound }
}
```

### WebSourceProvider
```javascript
// INPUT
{
  searchType: "name" | "username" | "photo" | "mixed",
  queries: { ... },
  image: { ... }
}

// OUTPUT
{
  sources: [{
    name: string,          // Required
    searchedAt: string,    // Required (ISO date)
    resultsCount: number,  // Required
    status: string,        // Required (success|partial|failed|skipped)
    url: string           // Optional
  }],
  metadata: { provider, searchedAt, totalSearched }
}
```

---

## 🚀 Integration Template

### Step 1: Create Provider File
```bash
# Create directory if needed
mkdir -p services/search/providers

# Create provider file
touch services/search/providers/YourProvider.js
```

### Step 2: Implement Provider
```javascript
const { PublicProfileProvider } = require('../ProviderInterfaces');
const axios = require('axios');
const logger = require('../../../utils/logger');

class YourProvider extends PublicProfileProvider {
  constructor() {
    super('YourProvider');
    this.apiKey = process.env.YOUR_API_KEY;
    this.baseUrl = 'https://api.example.com';
  }

  async searchProfiles(context) {
    try {
      // 1. Extract search parameters
      const { queries } = context;
      
      // 2. Call external API
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          name: queries.name?.fullName,
          username: queries.username?.normalized
        }
      });
      
      // 3. Map to our format
      const profiles = response.data.results.map(item => ({
        platform: this.extractPlatform(item),
        username: item.username,
        profileUrl: item.url,
        displayName: item.name,
        confidence: this.calculateConfidence(item),
        isVerified: item.verified || false,
        bio: item.bio,
        profileImage: item.avatar,
        followers: item.followers,
        location: item.location
      }));
      
      // 4. Return formatted results
      return {
        profiles,
        metadata: {
          provider: this.name,
          searchedAt: new Date().toISOString(),
          totalFound: profiles.length
        }
      };
      
    } catch (error) {
      logger.error('Provider error', { error: error.message });
      return {
        profiles: [],
        metadata: { error: error.message }
      };
    }
  }

  calculateConfidence(item) {
    let score = 50; // Base score
    
    // Add scoring logic
    if (item.verified) score += 20;
    if (item.followers > 1000) score += 10;
    if (item.bio) score += 10;
    
    return Math.min(score, 100);
  }

  extractPlatform(item) {
    // Extract platform from URL or data
    if (item.url.includes('linkedin.com')) return 'LinkedIn';
    if (item.url.includes('twitter.com')) return 'Twitter';
    return 'Unknown';
  }
}

module.exports = YourProvider;
```

### Step 3: Replace Placeholder
```javascript
// services/search/SearchProcessor.js
const YourProvider = require('./providers/YourProvider');

constructor() {
  // Replace this line:
  // this.profileProvider = new PlaceholderProfileProvider();
  
  // With this:
  this.profileProvider = new YourProvider();
  
  this.imageProvider = new PlaceholderImageProvider();
  this.webProvider = new PlaceholderWebProvider();
}
```

### Step 4: Add Environment Variable
```bash
# .env
YOUR_API_KEY=your_actual_api_key_here
```

### Step 5: Test
```bash
# Start server
npm run dev

# Create search
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"Test Name"}'

# Get result
curl http://localhost:3000/api/results/search/:searchId \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

---

## 📊 Confidence Scoring Cheat Sheet

### Profile Confidence
```
90-100: Exact match + verified + high engagement
70-89:  Strong match + complete profile
50-69:  Partial match + some data
30-49:  Weak match + minimal data
0-29:   Very uncertain + high false positive risk
```

### Image Similarity
```
95-100: Exact match (same image)
85-94:  Very similar (minor edits)
70-84:  Similar (filters applied)
50-69:  Partially similar (same person)
0-49:   Low similarity (different)
```

---

## 🔧 Common Patterns

### Error Handling
```javascript
async searchProfiles(context) {
  try {
    // API call
  } catch (error) {
    logger.error('Provider error', { error: error.message });
    return {
      profiles: [],
      metadata: { error: error.message }
    };
  }
}
```

### Rate Limiting
```javascript
async searchProfiles(context) {
  try {
    const response = await axios.get(url);
    return this.mapResponse(response);
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limited - wait and retry
      await this.sleep(5000);
      return this.searchProfiles(context);
    }
    throw error;
  }
}
```

### Caching
```javascript
async searchProfiles(context) {
  const cacheKey = this.getCacheKey(context);
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    logger.info('Cache hit', { provider: this.name });
    return cached;
  }
  
  const result = await this.callAPI(context);
  await cache.set(cacheKey, result, 3600); // 1 hour TTL
  
  return result;
}
```

### Multiple API Calls
```javascript
async searchProfiles(context) {
  const results = await Promise.allSettled([
    this.searchLinkedIn(context),
    this.searchTwitter(context),
    this.searchFacebook(context)
  ]);
  
  const profiles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value.profiles);
  
  return { profiles, metadata: {...} };
}
```

---

## 🎯 Recommended APIs

### Profile Search
| API | Best For | Cost | Docs |
|---|---|---|---|
| **Pipl** | Comprehensive people search | $0.50-1.00/search | pipl.com/api |
| **Social Searcher** | Social media profiles | $49-199/month | social-searcher.com/api |
| **Hunter.io** | Professional profiles | $49+/month | hunter.io/api |

### Image Search
| API | Best For | Cost | Docs |
|---|---|---|---|
| **Google Vision** | Best overall accuracy | $1.50/1000 images | cloud.google.com/vision |
| **TinEye** | Exact match detection | $200/month | tineye.com/api |
| **AWS Rekognition** | Face matching | $1/1000 images | aws.amazon.com/rekognition |

### Web Search
| API | Best For | Cost | Docs |
|---|---|---|---|
| **SerpAPI** | Google search results | $50-250/month | serpapi.com |
| **Bright Data** | Large-scale scraping | Pay per GB | brightdata.com |

---

## 📁 File Locations

```
services/search/
├── ProviderInterfaces.js      # Interface definitions
├── PlaceholderProviders.js    # Current placeholders
├── SearchProcessor.js         # Main orchestrator
├── InputNormalizer.js         # Input parsing
├── MatchAggregator.js         # Result deduplication
├── FlagGenerator.js           # Flag creation
├── ReportBuilder.js           # Report formatting
└── providers/                 # Your providers here
    ├── PiplProfileProvider.js
    ├── GoogleVisionImageProvider.js
    └── SerpAPIWebProvider.js
```

---

## ✅ Integration Checklist

- [ ] Choose API service
- [ ] Sign up and get credentials
- [ ] Add credentials to .env
- [ ] Create provider class
- [ ] Implement interface methods
- [ ] Map API response to output contract
- [ ] Calculate confidence scores
- [ ] Add error handling
- [ ] Add logging
- [ ] Replace placeholder in SearchProcessor
- [ ] Test with real searches
- [ ] Verify results in database
- [ ] Monitor API usage
- [ ] Document provider

---

## 🚨 Common Mistakes

❌ **Don't:** Return fake/random data
✅ **Do:** Return empty results if no real data

❌ **Don't:** Crash on API errors
✅ **Do:** Return empty results and log error

❌ **Don't:** Block on rate limits
✅ **Do:** Implement retry with backoff

❌ **Don't:** Expose API keys in logs
✅ **Do:** Mask sensitive data

❌ **Don't:** Return inconsistent formats
✅ **Do:** Follow output contract exactly

---

## 📞 Need Help?

**Documentation:**
- PROVIDER_INTEGRATION_GUIDE.md - Detailed guide
- PROVIDER_ARCHITECTURE_VISUAL.md - Visual diagrams
- PROVIDER_SUMMARY.md - Executive summary

**Code Examples:**
- services/search/PlaceholderProviders.js - Template structure
- services/search/ProviderInterfaces.js - Interface definitions

**Testing:**
- npm run dev - Start server
- npm run test:api - Run integration tests

---

**Ready to integrate? Start with PublicProfileProvider + Pipl API!**
