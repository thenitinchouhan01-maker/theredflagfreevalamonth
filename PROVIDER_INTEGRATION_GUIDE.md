# Search Provider Architecture - Complete Guide

## 🏗️ Current Architecture Overview

The backend uses a **production-ready modular pipeline architecture** with **pluggable providers**. All infrastructure is complete, only provider implementations are placeholders.

---

## 1. Provider Interfaces (3 Types)

### Location: `services/search/ProviderInterfaces.js`

### A. **PublicProfileProvider** - Social Media & Public Profiles

**Purpose:** Search for public profiles by name or username across social platforms

**Input Contract:**
```javascript
async searchProfiles(context) {
  // context = {
  //   searchType: 'name' | 'username' | 'mixed',
  //   queries: {
  //     name: {
  //       original: "John Doe",
  //       normalized: "john doe",
  //       firstName: "John",
  //       lastName: "Doe",
  //       parts: ["John", "Doe"]
  //     },
  //     username: {
  //       original: "@johndoe",
  //       normalized: "johndoe",
  //       withoutAt: "johndoe",
  //       withAt: "@johndoe",
  //       variations: ["johndoe", "@johndoe"]
  //     }
  //   }
  // }
}
```

**Output Contract:**
```javascript
return {
  profiles: [
    {
      platform: "LinkedIn",           // Required: Platform name
      username: "johndoe",            // Required: Username/handle
      profileUrl: "https://...",      // Required: Profile URL
      displayName: "John Doe",        // Required: Display name
      bio: "Software Engineer...",    // Optional: Bio/description
      profileImage: "https://...",    // Optional: Profile image URL
      followers: 1500,                // Optional: Follower count
      following: 300,                 // Optional: Following count
      posts: 50,                      // Optional: Post count
      location: "San Francisco, CA",  // Optional: Location
      isVerified: true,               // Required: Verification status
      confidence: 85,                 // Required: 0-100 confidence score
      metadata: {                     // Optional: Additional data
        accountCreated: "2020-01-01",
        lastActive: "2024-01-01"
      }
    }
  ],
  metadata: {
    provider: "LinkedInProvider",
    searchedAt: "2024-01-01T00:00:00.000Z",
    totalFound: 1
  }
};
```

**Confidence Scoring Guidelines:**
- **90-100**: Exact name match + verified account + high engagement
- **70-89**: Strong name match + profile completeness
- **50-69**: Partial name match or username similarity
- **30-49**: Weak match, possible false positive
- **0-29**: Very uncertain match

---

### B. **ImageMatchProvider** - Reverse Image Search

**Purpose:** Find where an uploaded image appears online

**Input Contract:**
```javascript
async searchImages(context) {
  // context = {
  //   searchType: 'photo' | 'mixed',
  //   image: {
  //     imageId: "64f1a2b3...",
  //     url: "https://...r2.cloudflarestorage.com/uploads/...",
  //     format: "jpg",
  //     width: 1024,
  //     height: 768
  //   }
  // }
}
```

**Output Contract:**
```javascript
return {
  matches: [
    {
      source: "Instagram",            // Required: Where image was found
      url: "https://...",             // Required: Direct image URL
      thumbnailUrl: "https://...",    // Optional: Thumbnail URL
      similarity: 95,                 // Required: 0-100 similarity score
      pageTitle: "John's Profile",    // Optional: Page title
      pageUrl: "https://...",         // Optional: Page containing image
      foundAt: "2024-01-01T00:00:00.000Z", // Required: When found
      metadata: {                     // Optional: Additional data
        imageSize: "1920x1080",
        fileType: "jpg"
      }
    }
  ],
  metadata: {
    provider: "GoogleVisionProvider",
    searchedAt: "2024-01-01T00:00:00.000Z",
    totalFound: 1
  }
};
```

**Similarity Scoring Guidelines:**
- **95-100**: Exact match (same image)
- **85-94**: Very similar (minor edits/crops)
- **70-84**: Similar (filters/modifications)
- **50-69**: Partially similar (same person/object)
- **0-49**: Low similarity (different image)

---

### C. **WebSourceProvider** - General Web Search

**Purpose:** Track which sources were searched and their status

**Input Contract:**
```javascript
async searchSources(context) {
  // context = {
  //   searchType: 'name' | 'username' | 'photo' | 'mixed',
  //   queries: { ... },
  //   image: { ... } // if photo search
  // }
}
```

**Output Contract:**
```javascript
return {
  sources: [
    {
      name: "Google Search",          // Required: Source name
      url: "https://google.com",      // Optional: Source URL
      searchedAt: "2024-01-01T00:00:00.000Z", // Required: When searched
      resultsCount: 5,                // Required: Number of results
      status: "success"               // Required: success|partial|failed|skipped
    }
  ],
  metadata: {
    provider: "WebScraperProvider",
    searchedAt: "2024-01-01T00:00:00.000Z",
    totalSearched: 1
  }
};
```

---

## 2. Current Placeholder Implementations

### Location: `services/search/PlaceholderProviders.js`

**All 3 providers are placeholders:**
- `PlaceholderProfileProvider` - Returns empty profiles array
- `PlaceholderImageProvider` - Returns empty matches array
- `PlaceholderWebProvider` - Returns empty sources array

**Current Behavior:**
- No fake data generated
- Returns proper structure with empty results
- Logs that placeholder is being used
- Pipeline completes successfully

**Example Placeholder:**
```javascript
class PlaceholderProfileProvider extends PublicProfileProvider {
  async searchProfiles(context) {
    logger.info('PlaceholderProfileProvider: No real implementation');
    
    return {
      profiles: [],  // Empty - no fake data
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: 0,
        note: 'Placeholder - integrate real API here'
      }
    };
  }
}
```

---

## 3. External APIs/Services Needed

### A. **For PublicProfileProvider** (Priority 1)

**Recommended Services:**

1. **Pipl API** (Best for people search)
   - URL: https://pipl.com/api
   - Cost: ~$0.50-1.00 per search
   - Coverage: 3+ billion profiles
   - Returns: Social profiles, contact info, demographics
   - Integration: REST API with JSON responses

2. **Social Searcher API**
   - URL: https://www.social-searcher.com/api
   - Cost: $49-199/month
   - Coverage: Twitter, Facebook, Instagram, LinkedIn, YouTube
   - Returns: Public posts, profiles, mentions

3. **Hunter.io** (For professional profiles)
   - URL: https://hunter.io/api
   - Cost: Free tier available, $49+/month
   - Coverage: LinkedIn, company websites
   - Returns: Professional profiles, email patterns

4. **Custom Scraping** (Budget option)
   - Use Puppeteer/Playwright
   - Scrape: LinkedIn, Twitter, Instagram (public profiles only)
   - Cost: Server costs only
   - Legal: Must respect robots.txt and ToS

**Implementation Priority:**
- Start with **Pipl API** for best coverage
- Add **Social Searcher** for social media depth
- Use **Hunter.io** for professional context

---

### B. **For ImageMatchProvider** (Priority 2)

**Recommended Services:**

1. **Google Cloud Vision API** (Best overall)
   - URL: https://cloud.google.com/vision
   - Cost: $1.50 per 1000 images
   - Features: Web detection, face detection, OCR
   - Returns: Similar images, pages containing image
   - Integration: REST API with client libraries

2. **TinEye API**
   - URL: https://tineye.com/api
   - Cost: $200/month for 5000 searches
   - Features: Reverse image search
   - Returns: Exact and modified matches
   - Integration: REST API

3. **Bing Visual Search API**
   - URL: https://www.microsoft.com/en-us/bing/apis/bing-visual-search-api
   - Cost: $3 per 1000 transactions
   - Features: Similar images, shopping results
   - Returns: Visually similar images

4. **AWS Rekognition** (Alternative)
   - URL: https://aws.amazon.com/rekognition/
   - Cost: $1 per 1000 images
   - Features: Face search, celebrity recognition
   - Returns: Face matches, similar faces

**Implementation Priority:**
- Start with **Google Cloud Vision** for best results
- Add **TinEye** for exact match detection
- Consider **AWS Rekognition** if already using AWS

---

### C. **For WebSourceProvider** (Priority 3)

**Recommended Approach:**

1. **SerpAPI** (Google Search Results)
   - URL: https://serpapi.com/
   - Cost: $50-250/month
   - Returns: Google search results as JSON
   - Integration: REST API

2. **Custom Web Scraping**
   - Use Puppeteer/Playwright
   - Scrape public sources
   - Track which sources were checked
   - Cost: Server costs only

3. **Bright Data** (Web scraping infrastructure)
   - URL: https://brightdata.com/
   - Cost: Pay per GB
   - Features: Proxy network, CAPTCHA solving
   - Use: For large-scale scraping

**Implementation Priority:**
- Start with **SerpAPI** for Google results
- Add custom scraping for specific platforms
- Use **Bright Data** if scaling issues

---

## 4. Which Provider to Implement First?

### **RECOMMENDATION: PublicProfileProvider (Priority 1)**

**Why:**
1. **Highest Product Value**
   - Most users search by name/username
   - Delivers immediate value
   - Core feature of the product

2. **Easier Integration**
   - Well-documented APIs available
   - Clear input/output contracts
   - No image processing complexity

3. **Better User Experience**
   - Faster results than image search
   - More actionable data (profiles, links)
   - Higher confidence scores

4. **Cost-Effective**
   - Pipl API: ~$0.50-1.00 per search
   - Can start with free tiers
   - Scales with usage

**Implementation Steps:**
1. Sign up for Pipl API (or Social Searcher)
2. Create `PiplProfileProvider.js` extending `PublicProfileProvider`
3. Implement `searchProfiles()` method
4. Map API response to output contract
5. Calculate confidence scores
6. Replace placeholder in `SearchProcessor`

**Example Integration:**
```javascript
// services/search/providers/PiplProfileProvider.js
const { PublicProfileProvider } = require('../ProviderInterfaces');
const axios = require('axios');

class PiplProfileProvider extends PublicProfileProvider {
  constructor() {
    super('PiplProfileProvider');
    this.apiKey = process.env.PIPL_API_KEY;
    this.baseUrl = 'https://api.pipl.com/search/';
  }

  async searchProfiles(context) {
    const { queries } = context;
    
    // Build Pipl API request
    const params = {
      key: this.apiKey,
      first_name: queries.name?.firstName,
      last_name: queries.name?.lastName,
      username: queries.username?.normalized
    };

    // Call Pipl API
    const response = await axios.get(this.baseUrl, { params });
    
    // Map to our format
    const profiles = response.data.person.urls.map(url => ({
      platform: this.extractPlatform(url),
      username: this.extractUsername(url),
      profileUrl: url,
      displayName: response.data.person.names[0].display,
      confidence: this.calculateConfidence(response.data),
      isVerified: false,
      // ... map other fields
    }));

    return {
      profiles,
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: profiles.length
      }
    };
  }

  calculateConfidence(data) {
    // Implement confidence scoring logic
    let score = 50; // Base score
    
    if (data.person.names[0].match === 'exact') score += 30;
    if (data.person.urls.length > 3) score += 10;
    if (data.person.emails.length > 0) score += 10;
    
    return Math.min(score, 100);
  }
}

module.exports = PiplProfileProvider;
```

**Replace in SearchProcessor:**
```javascript
// services/search/SearchProcessor.js
const PiplProfileProvider = require('./providers/PiplProfileProvider');

constructor() {
  // Replace placeholder with real provider
  this.profileProvider = new PiplProfileProvider();
  this.imageProvider = new PlaceholderImageProvider();
  this.webProvider = new PlaceholderWebProvider();
}
```

---

## 5. Reverse Image Search Integration

### **Implementation Plan for ImageMatchProvider**

**Step 1: Choose Service**
- Recommended: **Google Cloud Vision API**
- Backup: **TinEye API**

**Step 2: Create Provider**
```javascript
// services/search/providers/GoogleVisionImageProvider.js
const { ImageMatchProvider } = require('../ProviderInterfaces');
const vision = require('@google-cloud/vision');

class GoogleVisionImageProvider extends ImageMatchProvider {
  constructor() {
    super('GoogleVisionImageProvider');
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_KEY_PATH
    });
  }

  async searchImages(context) {
    const { image } = context;
    
    // Perform web detection
    const [result] = await this.client.webDetection(image.url);
    const webDetection = result.webDetection;

    // Map to our format
    const matches = [];
    
    // Full matching images
    if (webDetection.fullMatchingImages) {
      for (const match of webDetection.fullMatchingImages) {
        matches.push({
          source: 'Web',
          url: match.url,
          similarity: 100, // Full match
          foundAt: new Date().toISOString()
        });
      }
    }

    // Partial matching images
    if (webDetection.partialMatchingImages) {
      for (const match of webDetection.partialMatchingImages) {
        matches.push({
          source: 'Web',
          url: match.url,
          similarity: 85, // Partial match
          foundAt: new Date().toISOString()
        });
      }
    }

    // Pages with matching images
    if (webDetection.pagesWithMatchingImages) {
      for (const page of webDetection.pagesWithMatchingImages) {
        matches.push({
          source: this.extractSource(page.url),
          url: page.fullMatchingImages?.[0]?.url || page.url,
          pageUrl: page.url,
          pageTitle: page.pageTitle,
          similarity: 90,
          foundAt: new Date().toISOString()
        });
      }
    }

    return {
      matches,
      metadata: {
        provider: this.name,
        searchedAt: new Date().toISOString(),
        totalFound: matches.length
      }
    };
  }

  extractSource(url) {
    // Extract platform name from URL
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('twitter.com')) return 'Twitter';
    return 'Web';
  }
}

module.exports = GoogleVisionImageProvider;
```

**Step 3: Install Dependencies**
```bash
npm install @google-cloud/vision
```

**Step 4: Configure Credentials**
```bash
# .env
GOOGLE_VISION_KEY_PATH=/path/to/service-account-key.json
```

**Step 5: Replace Placeholder**
```javascript
// services/search/SearchProcessor.js
const GoogleVisionImageProvider = require('./providers/GoogleVisionImageProvider');

constructor() {
  this.profileProvider = new PiplProfileProvider();
  this.imageProvider = new GoogleVisionImageProvider(); // Real provider
  this.webProvider = new PlaceholderWebProvider();
}
```

---

## 6. Confidence Scoring & Flags

### **Confidence Scoring System**

**Location:** Calculated in each provider's implementation

**Profile Confidence Factors:**
```javascript
calculateProfileConfidence(profile, searchQuery) {
  let score = 0;
  
  // Name matching (0-40 points)
  if (exactNameMatch) score += 40;
  else if (partialNameMatch) score += 25;
  else if (usernameMatch) score += 15;
  
  // Profile completeness (0-20 points)
  if (hasBio) score += 5;
  if (hasProfileImage) score += 5;
  if (hasLocation) score += 5;
  if (hasFollowerData) score += 5;
  
  // Verification & engagement (0-20 points)
  if (isVerified) score += 20;
  else if (followers > 1000) score += 10;
  else if (followers > 100) score += 5;
  
  // Platform credibility (0-10 points)
  if (platform === 'LinkedIn') score += 10;
  else if (platform === 'Twitter') score += 8;
  else if (platform === 'Facebook') score += 6;
  
  // Activity (0-10 points)
  if (recentActivity) score += 10;
  else if (hasActivity) score += 5;
  
  return Math.min(score, 100);
}
```

**Image Similarity Factors:**
```javascript
calculateImageSimilarity(match, originalImage) {
  let score = 0;
  
  // Match type (0-60 points)
  if (exactMatch) score += 60;
  else if (partialMatch) score += 40;
  else if (visuallySimilar) score += 20;
  
  // Source credibility (0-20 points)
  if (socialMediaPlatform) score += 20;
  else if (newsWebsite) score += 15;
  else if (publicWebsite) score += 10;
  
  // Image quality (0-10 points)
  if (highResolution) score += 10;
  else if (mediumResolution) score += 5;
  
  // Metadata match (0-10 points)
  if (sameAspectRatio) score += 5;
  if (sameOrientation) score += 5;
  
  return Math.min(score, 100);
}
```

---

### **Flag Generation System**

**Location:** `services/search/FlagGenerator.js`

**Current Flags (Automatic):**
1. **No Results** - When no profiles/images found
2. **Limited Profile Presence** - Only 1 profile found
3. **Low Confidence Matches** - Profiles with confidence < 50
4. **Verified Accounts** - Verified profiles found
5. **Multi-Platform Presence** - Profiles on 3+ platforms
6. **No Image Matches** - No reverse image results
7. **Multiple Image Matches** - Image found in 5+ places
8. **Varied Identifiers** - Inconsistent usernames/names

**How Flags Work:**
```javascript
// FlagGenerator.generateFlags() is called automatically
// Analyzes aggregated results and generates flags

// Example: Low confidence flag
if (lowConfidenceProfiles.length > 0) {
  flags.push({
    type: 'warning',
    category: 'Low Confidence Matches',
    message: `${lowConfidenceProfiles.length} profile(s) have low confidence scores`,
    severity: 'medium',
    source: 'confidence',
    generatedAt: new Date().toISOString()
  });
}
```

**Adding Custom Flags:**
```javascript
// In your provider implementation
// Return metadata that FlagGenerator can use

return {
  profiles: [...],
  metadata: {
    provider: this.name,
    customFlags: [
      {
        type: 'alert',
        category: 'Suspicious Activity',
        message: 'Multiple accounts with same email pattern detected',
        severity: 'high',
        source: 'email_analysis'
      }
    ]
  }
};
```

---

## 7. What Can Be Built Now

### **Without Breaking Architecture:**

#### A. **Add Real Profile Provider**
```bash
# 1. Create provider file
touch services/search/providers/PiplProfileProvider.js

# 2. Implement searchProfiles()
# 3. Add to SearchProcessor
# 4. Test with real searches
```

#### B. **Add Real Image Provider**
```bash
# 1. Install Google Vision
npm install @google-cloud/vision

# 2. Create provider file
touch services/search/providers/GoogleVisionImageProvider.js

# 3. Implement searchImages()
# 4. Add to SearchProcessor
# 5. Test with uploaded images
```

#### C. **Add Multiple Providers**
```javascript
// SearchProcessor can use multiple providers simultaneously
constructor() {
  this.profileProviders = [
    new PiplProfileProvider(),
    new SocialSearcherProvider(),
    new HunterProvider()
  ];
  
  this.imageProviders = [
    new GoogleVisionImageProvider(),
    new TinEyeImageProvider()
  ];
}

// Aggregate results from all providers
async callAllProfileProviders(context, search) {
  const results = await Promise.allSettled(
    this.profileProviders.map(p => p.searchProfiles(context))
  );
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}
```

#### D. **Add Provider Configuration**
```javascript
// config/providers.js
module.exports = {
  profile: {
    enabled: true,
    providers: [
      {
        name: 'pipl',
        enabled: process.env.PIPL_API_KEY ? true : false,
        priority: 1
      },
      {
        name: 'social-searcher',
        enabled: process.env.SOCIAL_SEARCHER_KEY ? true : false,
        priority: 2
      }
    ]
  },
  image: {
    enabled: true,
    providers: [
      {
        name: 'google-vision',
        enabled: process.env.GOOGLE_VISION_KEY_PATH ? true : false,
        priority: 1
      }
    ]
  }
};
```

#### E. **Add Provider Monitoring**
```javascript
// Track provider performance
class ProviderMonitor {
  trackProviderCall(providerName, duration, success, resultsCount) {
    logger.info('Provider call completed', {
      provider: providerName,
      duration,
      success,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### F. **Add Provider Caching**
```javascript
// Cache provider results to reduce API costs
class ProviderCache {
  async getCached(cacheKey) {
    // Check Redis/memory cache
    return cachedResult;
  }
  
  async setCached(cacheKey, result, ttl = 3600) {
    // Store in cache with TTL
  }
}
```

---

## 8. Integration Checklist

### **Before Implementing Real Provider:**

- [ ] Choose API service (Pipl, Google Vision, etc.)
- [ ] Sign up and get API credentials
- [ ] Review API documentation and rate limits
- [ ] Understand pricing and quota
- [ ] Test API with sample requests
- [ ] Plan error handling strategy

### **During Implementation:**

- [ ] Create provider class extending interface
- [ ] Implement required methods
- [ ] Map API response to output contract
- [ ] Calculate confidence scores
- [ ] Add error handling
- [ ] Add logging
- [ ] Test with various inputs
- [ ] Handle rate limits
- [ ] Handle API failures gracefully

### **After Implementation:**

- [ ] Replace placeholder in SearchProcessor
- [ ] Test end-to-end search flow
- [ ] Verify results in database
- [ ] Check confidence scores are reasonable
- [ ] Monitor API usage and costs
- [ ] Add provider to documentation
- [ ] Set up monitoring/alerts

---

## 9. Architecture Benefits

### **Why This Design Works:**

1. **Pluggable** - Swap providers without changing pipeline
2. **Testable** - Mock providers for testing
3. **Scalable** - Add multiple providers easily
4. **Maintainable** - Clear separation of concerns
5. **Flexible** - Different providers for different search types
6. **Resilient** - Partial failures don't break entire search
7. **Observable** - Track provider performance
8. **Cost-Effective** - Use free tiers, scale as needed

### **No Breaking Changes:**

- Frontend API unchanged
- Database schema unchanged
- Search flow unchanged
- Report format unchanged
- Only provider implementation changes

---

## 10. Quick Start Guide

### **Implement First Provider (30 minutes):**

```bash
# 1. Sign up for Pipl API
# Get API key from https://pipl.com/api

# 2. Add to .env
echo "PIPL_API_KEY=your_key_here" >> .env

# 3. Create provider
mkdir -p services/search/providers
cat > services/search/providers/PiplProfileProvider.js << 'EOF'
const { PublicProfileProvider } = require('../ProviderInterfaces');
const axios = require('axios');
const logger = require('../../../utils/logger');

class PiplProfileProvider extends PublicProfileProvider {
  constructor() {
    super('PiplProfileProvider');
    this.apiKey = process.env.PIPL_API_KEY;
    this.baseUrl = 'https://api.pipl.com/search/';
  }

  async searchProfiles(context) {
    try {
      const { queries } = context;
      
      const params = {
        key: this.apiKey,
        first_name: queries.name?.firstName,
        last_name: queries.name?.lastName,
        username: queries.username?.normalized
      };

      const response = await axios.get(this.baseUrl, { params });
      
      // Map response to our format
      const profiles = this.mapPiplResponse(response.data);
      
      return {
        profiles,
        metadata: {
          provider: this.name,
          searchedAt: new Date().toISOString(),
          totalFound: profiles.length
        }
      };
    } catch (error) {
      logger.error('Pipl API error', { error: error.message });
      return { profiles: [], metadata: { error: error.message } };
    }
  }

  mapPiplResponse(data) {
    // Implement mapping logic
    return [];
  }
}

module.exports = PiplProfileProvider;
EOF

# 4. Replace placeholder
# Edit services/search/SearchProcessor.js
# Change: new PlaceholderProfileProvider()
# To: new PiplProfileProvider()

# 5. Test
npm run dev
# Create search via API
# Check results
```

---

## Summary

**Current State:**
- ✅ Complete pipeline architecture
- ✅ All interfaces defined
- ✅ Input normalization working
- ✅ Match aggregation working
- ✅ Flag generation working
- ✅ Report building working
- ⏳ Providers are placeholders

**Next Steps:**
1. Implement **PublicProfileProvider** first (highest value)
2. Use **Pipl API** or **Social Searcher API**
3. Then implement **ImageMatchProvider** with **Google Vision**
4. Finally add **WebSourceProvider** for source tracking

**No Breaking Changes:**
- Just replace placeholder providers
- Everything else stays the same
- Frontend unchanged
- Database unchanged
- API contract unchanged

**Ready to integrate real providers immediately!**
