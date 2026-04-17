# Sample Search Result JSON

## Empty State (Current with Placeholder Providers)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "result": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d8",
      "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
      "summary": {
        "totalProfilesFound": 0,
        "totalImageMatches": 0,
        "platformsSearched": [
          "Public Profile Search",
          "Web Search",
          "Image Search"
        ],
        "platformsWithResults": [],
        "overallConfidence": 0,
        "summaryText": "No public profiles or image matches found for this search.",
        "hasResults": false
      },
      "matchedProfiles": [],
      "imageMatches": [],
      "flags": [
        {
          "type": "info",
          "category": "No Results",
          "message": "No public profiles or image matches found for this search",
          "severity": "low",
          "source": "system",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      ],
      "sources": [
        {
          "name": "Public Profile Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 0,
          "status": "success"
        },
        {
          "name": "Web Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 0,
          "status": "success"
        },
        {
          "name": "Image Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 0,
          "status": "skipped"
        }
      ],
      "hasResults": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Populated State (With Real Provider Integration)

This is what results will look like once real providers are integrated:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "result": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d8",
      "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
      "summary": {
        "totalProfilesFound": 3,
        "totalImageMatches": 2,
        "platformsSearched": [
          "Public Profile Search",
          "Web Search",
          "Image Search"
        ],
        "platformsWithResults": [
          "LinkedIn",
          "Twitter",
          "GitHub"
        ],
        "overallConfidence": 82,
        "summaryText": "Found 3 potential profile(s) and 2 image match(es) matching your search.",
        "hasResults": true
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "johndoe",
          "profileUrl": "https://linkedin.com/in/johndoe",
          "displayName": "John Doe",
          "bio": "Software Engineer at Tech Company",
          "profileImage": "https://media.licdn.com/...",
          "followers": 1250,
          "following": 340,
          "posts": null,
          "location": "San Francisco, CA",
          "joinedDate": "2018-03-15T00:00:00.000Z",
          "isVerified": false,
          "confidence": 88,
          "metadata": {
            "company": "Tech Company",
            "title": "Software Engineer"
          }
        },
        {
          "platform": "Twitter",
          "username": "johndoe",
          "profileUrl": "https://twitter.com/johndoe",
          "displayName": "John Doe",
          "bio": "Tech enthusiast | Software Engineer",
          "profileImage": "https://pbs.twimg.com/...",
          "followers": 523,
          "following": 189,
          "posts": 1247,
          "location": "San Francisco",
          "joinedDate": "2019-01-10T00:00:00.000Z",
          "isVerified": false,
          "confidence": 85,
          "metadata": {}
        },
        {
          "platform": "GitHub",
          "username": "johndoe",
          "profileUrl": "https://github.com/johndoe",
          "displayName": "John Doe",
          "bio": "Building cool stuff",
          "profileImage": "https://avatars.githubusercontent.com/...",
          "followers": 89,
          "following": 45,
          "posts": null,
          "location": "San Francisco, CA",
          "joinedDate": "2017-06-20T00:00:00.000Z",
          "isVerified": false,
          "confidence": 73,
          "metadata": {
            "publicRepos": 42,
            "publicGists": 8
          }
        }
      ],
      "imageMatches": [
        {
          "source": "Google Images",
          "url": "https://example.com/images/profile.jpg",
          "thumbnailUrl": "https://example.com/images/profile_thumb.jpg",
          "similarity": 94,
          "pageTitle": "John Doe - Tech Company Team Page",
          "pageUrl": "https://techcompany.com/team",
          "foundAt": "2024-01-01T00:00:00.000Z"
        },
        {
          "source": "TinEye",
          "url": "https://example.com/images/conference.jpg",
          "thumbnailUrl": "https://example.com/images/conference_thumb.jpg",
          "similarity": 87,
          "pageTitle": "Tech Conference 2023 Speakers",
          "pageUrl": "https://conference.com/speakers",
          "foundAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "flags": [
        {
          "type": "info",
          "category": "Multiple Platforms",
          "message": "Profiles found across 3 different platforms",
          "severity": "low",
          "source": "platform_diversity",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
          "type": "info",
          "category": "High Similarity Match",
          "message": "Found 1 image(s) with 90%+ similarity",
          "severity": "low",
          "source": "image_similarity",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
          "type": "warning",
          "category": "Inconsistent Identifiers",
          "message": "Different usernames found across platforms",
          "severity": "medium",
          "source": "identifier_consistency",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
          "type": "info",
          "category": "Multi-Source Match",
          "message": "Results include both profile and image matches",
          "severity": "low",
          "source": "match_diversity",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      ],
      "sources": [
        {
          "name": "Public Profile Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 3,
          "status": "success"
        },
        {
          "name": "Web Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 5,
          "status": "success"
        },
        {
          "name": "Image Search",
          "url": null,
          "searchedAt": "2024-01-01T00:00:00.000Z",
          "resultsCount": 2,
          "status": "success"
        }
      ],
      "hasResults": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Report Data Structure

When a report is generated from a result, it includes additional metadata:

```json
{
  "reportId": "64f1a2b3c4d5e6f7a8b9c0d9",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "data": {
    "searchInfo": {
      "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
      "searchType": "name",
      "nameQuery": "John Doe",
      "usernameQuery": null,
      "hasImage": false,
      "searchedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:00:05.000Z",
      "duration": 5,
      "status": "completed"
    },
    "summary": { /* same as result summary */ },
    "matchedProfiles": [ /* same as result profiles */ ],
    "imageMatches": [ /* same as result image matches */ ],
    "flags": [ /* same as result flags */ ],
    "sources": [ /* same as result sources */ ],
    "metadata": {
      "version": "1.0.0",
      "format": "json",
      "processingTime": 5,
      "providersUsed": [
        "PlaceholderProfileProvider",
        "PlaceholderImageProvider",
        "PlaceholderWebProvider"
      ],
      "dataQuality": "high",
      "confidenceNotes": [
        "3 profile(s) have high confidence scores (80+)",
        "Search completed successfully with available data sources"
      ]
    },
    "generatedAt": "2024-01-01T00:00:05.000Z"
  }
}
```

---

## Flag Types Reference

### Info Flags (severity: low)
- **No Results** - No matches found
- **Verified Account** - Verified accounts detected
- **Multiple Platforms** - Profiles across multiple platforms
- **Weak Profile Presence** - Low activity profiles
- **High Similarity Match** - High confidence image matches
- **Multi-Source Match** - Both profile and image results
- **Partial Results** - Some sources returned partial data

### Warning Flags (severity: medium)
- **Low Confidence Match** - Profiles with low confidence scores
- **Duplicate Image Usage** - Image found in multiple locations
- **Low Image Similarity** - All image matches have low similarity
- **Inconsistent Identifiers** - Different usernames across platforms
- **Source Failures** - Some sources failed to respond

### Alert Flags (severity: high)
- Reserved for critical findings (future use)

### Critical Flags (severity: critical)
- Reserved for severe issues (future use)
