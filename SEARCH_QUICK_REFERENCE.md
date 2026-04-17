# Search Pipeline Quick Reference

## 🏗️ Architecture at a Glance

```
Input → Normalize → Providers → Aggregate → Flags → Report → Save
```

## 📁 File Structure

```
services/search/
├── InputNormalizer.js          ✅ Validates & normalizes inputs
├── SearchProcessor.js          ✅ Main orchestrator
├── MatchAggregator.js          ✅ Deduplicates & merges results
├── FlagGenerator.js            ✅ Generates structured flags
├── ReportBuilder.js            ✅ Formats final reports
└── providers/
    ├── BaseProvider.js         ✅ Provider interfaces
    ├── PlaceholderProfileProvider.js   🔌 Returns []
    ├── PlaceholderImageProvider.js     🔌 Returns []
    ├── PlaceholderWebProvider.js       🔌 Returns []
    └── index.js                ✅ Provider registry
```

## 🔌 Current Provider Status

| Provider Type | Implementation | Returns | Status |
|--------------|----------------|---------|--------|
| Profile Search | Placeholder | `[]` | Ready for integration |
| Image Search | Placeholder | `[]` | Ready for integration |
| Web Search | Placeholder | `[]` | Ready for integration |

## 📊 Current API Behavior

### Search Request
```bash
POST /api/searches
{
  "searchType": "name",
  "nameQuery": "John Doe"
}
```

### Result (Empty State)
```json
{
  "summary": {
    "totalProfilesFound": 0,
    "hasResults": false
  },
  "matchedProfiles": [],
  "flags": [
    {
      "type": "info",
      "category": "No Results",
      "message": "No public profiles or image matches found..."
    }
  ]
}
```

## 🚀 Adding Your First Provider

### 1. Create Provider Class
```javascript
// services/search/providers/GitHubProvider.js
const { PublicProfileProvider } = require('./BaseProvider');

class GitHubProvider extends PublicProfileProvider {
  async searchProfiles(query) {
    // Call GitHub API
    const response = await fetch(`https://api.github.com/search/users?q=${query.username.normalized}`);
    const data = await response.json();
    
    // Transform to standard format
    return data.items.map(user => ({
      platform: 'GitHub',
      username: user.login,
      profileUrl: user.html_url,
      displayName: user.name || user.login,
      bio: user.bio,
      followers: user.followers,
      confidence: 85
    }));
  }
}

module.exports = GitHubProvider;
```

### 2. Register Provider
```javascript
// services/search/providers/index.js
const GitHubProvider = require('./GitHubProvider');

const PROVIDERS = {
  profile: {
    placeholder: PlaceholderProfileProvider,
    github: GitHubProvider,  // ✅ Add this
  }
};
```

### 3. Use in SearchProcessor
```javascript
// services/search/SearchProcessor.js
const GitHubProvider = require('./providers/GitHubProvider');

constructor() {
  this.profileProvider = new GitHubProvider({ enabled: true });
}
```

### 4. Test
```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"username","usernameQuery":"torvalds"}'
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SEARCH_PIPELINE_ARCHITECTURE.md` | Complete architecture guide |
| `PROVIDER_INTEGRATION_GUIDE.md` | Step-by-step integration |
| `SAMPLE_RESULTS.md` | Result JSON examples |
| `SEARCH_IMPLEMENTATION_SUMMARY.md` | Implementation summary |
| `SEARCH_QUICK_REFERENCE.md` | This file |

## 🎯 Key Concepts

### Input Normalization
```javascript
InputNormalizer.normalizeSearchInput({
  searchType: 'name',
  nameQuery: 'John  Doe'
})
// Returns: { searchType: 'name', name: { full: 'John Doe', firstName: 'John', ... } }
```

### Provider Interface
```javascript
class MyProvider extends PublicProfileProvider {
  async searchProfiles(query) {
    // Return array of profiles or []
  }
}
```

### Match Aggregation
```javascript
MatchAggregator.aggregateProfiles([
  [profile1, profile2],  // Provider 1
  [profile2, profile3]   // Provider 2
])
// Returns: [profile1, profile2, profile3] (deduplicated)
```

### Flag Generation
```javascript
FlagGenerator.generateFlags({
  profiles: [],
  imageMatches: [],
  sources: []
})
// Returns: [{ type: 'info', category: 'No Results', ... }]
```

## ⚠️ Important Rules

### ✅ DO
- Return empty arrays `[]` on provider errors
- Log all provider activity
- Calculate confidence scores from actual data
- Generate flags based on real findings
- Handle partial provider failures gracefully

### ❌ DON'T
- Generate fake/random data
- Throw errors from providers (return `[]` instead)
- Hardcode confidence scores
- Create fabricated flags
- Access private data

## 🔍 Testing

### Test Empty State
```bash
# Create search
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"Test User"}'

# Get result (expect empty state)
curl http://localhost:3000/api/results/search/{searchId} \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

### Test With Real Provider
```bash
# After integrating GitHub provider
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"username","usernameQuery":"torvalds"}'

# Get result (expect GitHub profile)
curl http://localhost:3000/api/results/search/{searchId} \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

## 🛠️ Common Tasks

### Add New Provider Type
1. Add interface to `BaseProvider.js`
2. Create placeholder implementation
3. Add to provider registry
4. Update SearchProcessor

### Debug Provider Issues
1. Check logs: `logger.info/error` calls
2. Verify provider returns array
3. Check confidence calculation
4. Validate profile format

### Update Flag Logic
1. Edit `FlagGenerator.js`
2. Add new flag type/category
3. Test with various result states

### Modify Report Format
1. Edit `ReportBuilder.js`
2. Update format methods
3. Maintain backward compatibility

## 📞 Support

- Architecture: `SEARCH_PIPELINE_ARCHITECTURE.md`
- Integration: `PROVIDER_INTEGRATION_GUIDE.md`
- Examples: `SAMPLE_RESULTS.md`
- Interfaces: `services/search/providers/BaseProvider.js`

## ✨ Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Input Normalization | ✅ Complete | Production-ready |
| Search Orchestration | ✅ Complete | Production-ready |
| Match Aggregation | ✅ Complete | Production-ready |
| Flag Generation | ✅ Complete | Production-ready |
| Report Building | ✅ Complete | Production-ready |
| Provider Interfaces | ✅ Complete | Production-ready |
| Profile Provider | 🔌 Placeholder | Returns empty results |
| Image Provider | 🔌 Placeholder | Returns empty results |
| Web Provider | 🔌 Placeholder | Returns empty results |

**Overall:** Architecture is production-ready. Add real providers to get actual results.
