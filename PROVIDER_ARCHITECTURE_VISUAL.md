# Search Provider Architecture - Visual Guide

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│  POST /api/searches                                              │
│  { searchType: "name", nameQuery: "John Doe" }                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH CONTROLLER                             │
│  - Validates request                                             │
│  - Checks user access                                            │
│  - Creates search record                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH SERVICE                                │
│  - Creates Search document in MongoDB                            │
│  - Triggers async processing                                     │
│  - Returns search ID immediately                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SEARCH PROCESSOR (Main Orchestrator)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 1: INPUT NORMALIZATION                              │  │
│  │  - Parse name → firstName, lastName                       │  │
│  │  - Normalize username → remove @, lowercase               │  │
│  │  - Validate image reference                               │  │
│  │  - Build search context                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 2: PROVIDER ORCHESTRATION                           │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ Profile Provider │  │ Image Provider   │              │  │
│  │  │ (Placeholder)    │  │ (Placeholder)    │              │  │
│  │  │                  │  │                  │              │  │
│  │  │ Returns: []      │  │ Returns: []      │              │  │
│  │  └──────────────────┘  └──────────────────┘              │  │
│  │           │                      │                        │  │
│  │           └──────────┬───────────┘                        │  │
│  │                      │                                    │  │
│  │           ┌──────────▼───────────┐                        │  │
│  │           │  Web Provider        │                        │  │
│  │           │  (Placeholder)       │                        │  │
│  │           │                      │                        │  │
│  │           │  Returns: []         │                        │  │
│  │           └──────────────────────┘                        │  │
│  │                      │                                    │  │
│  │         All providers run in PARALLEL                     │  │
│  │         Failures don't break pipeline                     │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 3: MATCH AGGREGATION                                │  │
│  │  - Deduplicate profiles by platform+username              │  │
│  │  - Merge duplicate image matches                          │  │
│  │  - Sort by confidence/similarity                          │  │
│  │  - Calculate overall confidence                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 4: FLAG GENERATION                                  │  │
│  │  - Analyze results                                         │  │
│  │  - Generate structured flags                              │  │
│  │  - Assign severity levels                                 │  │
│  │  - Add explanations                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Phase 5: REPORT BUILDING                                  │  │
│  │  - Build summary                                           │  │
│  │  - Format profiles                                         │  │
│  │  - Format image matches                                    │  │
│  │  - Add metadata                                            │  │
│  │  - Create deterministic report                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESULT STORAGE                                │
│  - Create Result document in MongoDB                             │
│  - Link to Search document                                       │
│  - Mark search as completed                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER RETRIEVES RESULT                         │
│  GET /api/results/search/:searchId                               │
│  Returns complete report with profiles, images, flags            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Provider Replacement Flow

### Current State (Placeholders)
```
SearchProcessor
├── profileProvider: PlaceholderProfileProvider
│   └── searchProfiles() → returns { profiles: [] }
│
├── imageProvider: PlaceholderImageProvider
│   └── searchImages() → returns { matches: [] }
│
└── webProvider: PlaceholderWebProvider
    └── searchSources() → returns { sources: [] }
```

### After Integration (Real Providers)
```
SearchProcessor
├── profileProvider: PiplProfileProvider
│   └── searchProfiles() → calls Pipl API → returns real profiles
│
├── imageProvider: GoogleVisionImageProvider
│   └── searchImages() → calls Google Vision → returns real matches
│
└── webProvider: SerpAPIWebProvider
    └── searchSources() → calls SerpAPI → returns real sources
```

### Multiple Providers (Advanced)
```
SearchProcessor
├── profileProviders: [
│   ├── PiplProfileProvider → Pipl API
│   ├── SocialSearcherProvider → Social Searcher API
│   └── HunterProvider → Hunter.io API
│   ]
│   └── Results aggregated and deduplicated
│
├── imageProviders: [
│   ├── GoogleVisionImageProvider → Google Cloud Vision
│   └── TinEyeImageProvider → TinEye API
│   ]
│   └── Results merged by similarity
│
└── webProviders: [
    ├── SerpAPIWebProvider → Google Search
    └── CustomScraperProvider → Direct scraping
    ]
    └── Sources tracked and deduplicated
```

---

## 🎯 Search Type Routing

```
┌─────────────────────────────────────────────────────────────────┐
│                      SEARCH TYPE: "name"                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │ Profile Provider  │     │  Web Provider     │
    │                   │     │                   │
    │ Search by name    │     │ Track sources     │
    └───────────────────┘     └───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH TYPE: "username"                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │ Profile Provider  │     │  Web Provider     │
    │                   │     │                   │
    │ Search by username│     │ Track sources     │
    └───────────────────┘     └───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SEARCH TYPE: "photo"                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │ Image Provider    │     │  Web Provider     │
    │                   │     │                   │
    │ Reverse image     │     │ Track sources     │
    └───────────────────┘     └───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SEARCH TYPE: "mixed"                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Profile Provider │ │Image Provider│ │ Web Provider │
│                  │ │              │ │              │
│ Search by name   │ │Reverse image │ │Track sources │
│ and username     │ │              │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
```

---

## 📦 Data Structures

### Input Context
```javascript
{
  searchType: "name",
  queries: {
    name: {
      original: "John Doe",
      normalized: "john doe",
      firstName: "John",
      lastName: "Doe",
      parts: ["John", "Doe"],
      fullName: "John Doe"
    }
  },
  metadata: {
    originalInput: { nameQuery: "John Doe" },
    normalizedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### Provider Output (Profile)
```javascript
{
  profiles: [
    {
      platform: "LinkedIn",
      username: "johndoe",
      profileUrl: "https://linkedin.com/in/johndoe",
      displayName: "John Doe",
      bio: "Software Engineer at Tech Corp",
      profileImage: "https://...",
      followers: 1500,
      following: 300,
      posts: 50,
      location: "San Francisco, CA",
      isVerified: true,
      confidence: 85,
      metadata: {}
    }
  ],
  metadata: {
    provider: "PiplProfileProvider",
    searchedAt: "2024-01-01T00:00:00.000Z",
    totalFound: 1
  }
}
```

### Aggregated Data
```javascript
{
  profiles: [
    // Deduplicated, sorted by confidence
  ],
  imageMatches: [
    // Deduplicated, sorted by similarity
  ],
  sources: [
    // Deduplicated, merged counts
  ]
}
```

### Generated Flags
```javascript
[
  {
    type: "warning",
    category: "Low Confidence Matches",
    message: "2 profile(s) have low confidence scores",
    severity: "medium",
    source: "confidence",
    generatedAt: "2024-01-01T00:00:00.000Z"
  }
]
```

### Final Report
```javascript
{
  summary: {
    totalProfilesFound: 3,
    totalImageMatches: 0,
    platformsSearched: ["public_profiles", "social_media", "web_sources"],
    platformsWithResults: ["LinkedIn", "Twitter", "Facebook"],
    overallConfidence: 78,
    summaryText: "Found 3 potential profiles for \"John Doe\".",
    searchType: "name",
    hasResults: true
  },
  matchedProfiles: [...],
  imageMatches: [],
  flags: [...],
  sources: [...],
  metadata: {
    searchType: "name",
    searchQuery: { name: "John Doe" },
    processedAt: "2024-01-01T00:00:00.000Z",
    providersUsed: ["profile_provider", "source_provider"],
    architecture: "production-pipeline-v1"
  }
}
```

---

## 🔄 Provider Integration Steps

### Step 1: Create Provider Class
```
services/search/providers/
└── PiplProfileProvider.js
    ├── extends PublicProfileProvider
    ├── constructor() - Initialize API client
    ├── searchProfiles(context) - Main search method
    ├── mapResponse(apiData) - Map API to our format
    └── calculateConfidence(data) - Score results
```

### Step 2: Implement Interface
```javascript
class PiplProfileProvider extends PublicProfileProvider {
  async searchProfiles(context) {
    // 1. Extract search parameters from context
    // 2. Call external API
    // 3. Map response to output contract
    // 4. Calculate confidence scores
    // 5. Return formatted results
  }
}
```

### Step 3: Replace in SearchProcessor
```javascript
// Before
this.profileProvider = new PlaceholderProfileProvider();

// After
this.profileProvider = new PiplProfileProvider();
```

### Step 4: Test
```bash
# Create search
POST /api/searches
{ "searchType": "name", "nameQuery": "John Doe" }

# Check result
GET /api/results/search/:searchId

# Verify profiles returned
```

---

## 🎨 Confidence Score Visualization

```
Confidence Score Ranges:

90-100 ████████████████████ Excellent Match
       - Exact name match
       - Verified account
       - High engagement
       - Complete profile

70-89  ███████████████░░░░░ Strong Match
       - Strong name similarity
       - Active account
       - Good profile data
       - Multiple data points

50-69  ██████████░░░░░░░░░░ Moderate Match
       - Partial name match
       - Some profile data
       - Username similarity
       - Limited verification

30-49  █████░░░░░░░░░░░░░░░ Weak Match
       - Weak name similarity
       - Incomplete profile
       - Low engagement
       - Possible false positive

0-29   ██░░░░░░░░░░░░░░░░░░ Very Uncertain
       - Very weak match
       - Minimal data
       - High false positive risk
       - Consider excluding
```

---

## 🚦 Provider Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROVIDER CALL LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

1. INITIALIZED
   └─> Provider instance created
       └─> Check if API credentials configured
           ├─> Yes: enabled = true
           └─> No: enabled = false, skip provider

2. CALLED
   └─> searchProfiles() / searchImages() / searchSources()
       └─> Update search progress (25%, 50%, 75%)
           └─> Call external API
               ├─> Success: Continue
               ├─> Rate Limited: Retry with backoff
               ├─> API Error: Log and return empty
               └─> Timeout: Log and return empty

3. PROCESSING
   └─> Map API response to output contract
       └─> Calculate confidence/similarity scores
           └─> Validate output format
               ├─> Valid: Continue
               └─> Invalid: Log error, return empty

4. COMPLETED
   └─> Return results to SearchProcessor
       └─> Results added to aggregation pool
           └─> Continue to next provider

5. AGGREGATED
   └─> All provider results merged
       └─> Deduplication applied
           └─> Sorting by confidence
               └─> Final results ready

6. FAILED (Graceful)
   └─> Provider error logged
       └─> Empty results returned
           └─> Pipeline continues with other providers
               └─> Partial results still useful
```

---

## 📈 Scaling Strategy

### Phase 1: Single Provider (Current → Next)
```
PlaceholderProfileProvider
    ↓
PiplProfileProvider (Pipl API)
    ↓
Results: Basic profile search working
Cost: ~$0.50-1.00 per search
```

### Phase 2: Multiple Providers
```
ProfileProviders:
├── PiplProfileProvider (Primary)
├── SocialSearcherProvider (Social media depth)
└── HunterProvider (Professional profiles)

Results: Comprehensive profile coverage
Cost: ~$1.50-2.50 per search
```

### Phase 3: Caching Layer
```
Request → Cache Check → Hit? Return cached
                      ↓ Miss? Call providers
                      ↓ Store in cache (TTL: 1 hour)
                      ↓ Return results

Results: Reduced API costs
Cost: ~$0.30-0.50 per search (with 70% cache hit rate)
```

### Phase 4: Provider Selection
```
Request → Analyze query → Select best provider
                        ↓ Simple name? Use Pipl only
                        ↓ Complex? Use all providers
                        ↓ Image? Use Google Vision
                        ↓ Return results

Results: Optimized costs
Cost: ~$0.20-1.00 per search (dynamic)
```

---

## 🎯 Priority Implementation Order

```
Priority 1: PublicProfileProvider
├── Highest product value
├── Most user searches
├── Easier integration
└── Immediate ROI

Priority 2: ImageMatchProvider
├── Unique feature
├── Differentiator
├── Higher complexity
└── Moderate ROI

Priority 3: WebSourceProvider
├── Supporting feature
├── Source tracking
├── Lower complexity
└── Lower ROI

Priority 4: Multiple Providers
├── Enhanced coverage
├── Better results
├── Higher costs
└── Incremental value
```

---

## 📊 Success Metrics

### Provider Performance
```
- API Response Time: < 2 seconds
- Success Rate: > 95%
- Results Quality: Confidence > 70
- Cost per Search: < $1.00
- Cache Hit Rate: > 60%
```

### Search Quality
```
- Profiles Found: > 2 per search (average)
- High Confidence: > 50% with confidence > 70
- User Satisfaction: > 80% useful results
- False Positives: < 10%
```

### System Health
```
- Pipeline Success: > 99%
- Processing Time: < 10 seconds
- Database Writes: 100% success
- Error Recovery: Graceful degradation
```

---

**Architecture is production-ready. Just add real provider implementations!**
