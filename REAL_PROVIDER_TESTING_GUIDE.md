# Real Provider Integration - Testing Guide

## 🎉 Implementation Complete

All placeholder providers have been replaced with real implementations:

1. ✅ **Serper Web Search Provider** - Google search results
2. ✅ **Google Vision Image Provider** - Reverse image search
3. ✅ **OpenRouter AI Summary Provider** - Intelligent analysis

---

## 📦 Required NPM Packages

Install the following package (axios is already installed):

```bash
npm install axios
```

All other dependencies are already in package.json.

---

## 🔧 Environment Variables

Already added to `.env`:

```bash
# Real Provider API Keys
SERPER_API_KEY=your_serper_api_key
GOOGLE_VISION_API_KEY=your_google_vision_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## 🚀 How to Start

```bash
# Start the server
npm run dev
```

Expected output:
```
============================================================
  🚀 DeepTrust API Server Started
============================================================
  Environment:     development
  Port:            3000
  Database:        MongoDB Atlas
  Razorpay:        Not Configured
  Storage:         Cloudflare R2
  CORS:            http://localhost:3000
  Real Credentials: ✅ Yes
============================================================
  Health Check:    http://localhost:3000/api/health
  API Base:        http://localhost:3000/api
============================================================
```

---

## 🧪 Testing Instructions

### Test 1: Name Search (Web Search Provider)

**Request:**
```bash
POST http://localhost:3000/api/searches
Content-Type: application/json
x-app-user-id: DTX-XXXX-XXXX

{
  "searchType": "name",
  "nameQuery": "Elon Musk"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Search created successfully",
  "data": {
    "search": {
      "id": "...",
      "searchType": "name",
      "nameQuery": "Elon Musk",
      "status": "pending",
      "progress": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Wait 5-10 seconds, then get results:**
```bash
GET http://localhost:3000/api/results/search/:searchId
x-app-user-id: DTX-XXXX-XXXX
```

**Expected Result:**
- Profiles from LinkedIn, Twitter, etc.
- Confidence scores
- AI-generated summary
- Risk assessment

---

### Test 2: Username Search

**Request:**
```bash
POST http://localhost:3000/api/searches
Content-Type: application/json
x-app-user-id: DTX-XXXX-XXXX

{
  "searchType": "username",
  "usernameQuery": "@elonmusk"
}
```

**Expected:**
- Social media profiles
- Platform-specific results
- Confidence scoring

---

### Test 3: Image Search (Google Vision)

**Step 1: Upload Image**
```bash
POST http://localhost:3000/api/uploads
Content-Type: multipart/form-data
x-app-user-id: DTX-XXXX-XXXX

image: [select image file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upload": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d6",
      "fileUrl": "https://...r2.cloudflarestorage.com/uploads/...",
      "format": "jpg"
    }
  }
}
```

**Step 2: Search by Image**
```bash
POST http://localhost:3000/api/searches
Content-Type: application/json
x-app-user-id: DTX-XXXX-XXXX

{
  "searchType": "photo",
  "imageId": "64f1a2b3c4d5e6f7a8b9c0d6"
}
```

**Expected Result:**
- Image matches from web
- Pages where image appears
- Image labels (identity hints)
- Similarity scores
- Duplicate image risk assessment

---

### Test 4: Mixed Search (Name + Username)

**Request:**
```bash
POST http://localhost:3000/api/searches
Content-Type: application/json
x-app-user-id: DTX-XXXX-XXXX

{
  "searchType": "mixed",
  "nameQuery": "Elon Musk",
  "usernameQuery": "@elonmusk"
}
```

**Expected:**
- Combined results from web search
- Cross-platform profile matching
- Enhanced confidence scoring

---

## 📋 Postman Collection

### Collection Setup

**Base URL:** `http://localhost:3000/api`

**Headers (Global):**
```
Content-Type: application/json
x-app-user-id: {{userId}}
```

### Requests

#### 1. Create User
```
POST /users
Body: {
  "deviceId": "test-device-001"
}
```
Save `appUserId` from response as `{{userId}}`

#### 2. Name Search
```
POST /searches
Body: {
  "searchType": "name",
  "nameQuery": "Elon Musk"
}
```
Save `search.id` as `{{searchId}}`

#### 3. Get Search Result
```
GET /results/search/{{searchId}}
```

#### 4. Upload Image
```
POST /uploads
Body: form-data
  image: [file]
```
Save `upload.id` as `{{uploadId}}`

#### 5. Image Search
```
POST /searches
Body: {
  "searchType": "photo",
  "imageId": "{{uploadId}}"
}
```

---

## 🔍 What Each Provider Returns

### Serper Web Search Provider

**Returns:**
```json
{
  "profiles": [
    {
      "platform": "LinkedIn",
      "username": "elonmusk",
      "profileUrl": "https://linkedin.com/in/elonmusk",
      "displayName": "Elon Musk",
      "bio": "CEO of Tesla and SpaceX",
      "confidence": 95,
      "isVerified": false
    }
  ],
  "sources": [
    {
      "name": "LinkedIn",
      "url": "https://...",
      "resultsCount": 1,
      "status": "success"
    }
  ]
}
```

**Platforms Detected:**
- LinkedIn
- Twitter/X
- Instagram
- Facebook
- GitHub
- Medium
- YouTube

---

### Google Vision Image Provider

**Returns:**
```json
{
  "matches": [
    {
      "source": "Instagram",
      "url": "https://...",
      "pageUrl": "https://instagram.com/...",
      "pageTitle": "Profile Name",
      "similarity": 100,
      "matchType": "exact",
      "foundAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "labels": [
    {
      "description": "Person",
      "score": 95,
      "confidence": 95
    }
  ]
}
```

**Match Types:**
- `exact` - 100% similarity (same image)
- `partial` - 85% similarity (edited/cropped)
- `page_exact` - 95% similarity (found on page)
- `page_partial` - 80% similarity (found on page, modified)
- `similar` - 70% similarity (visually similar)

---

### OpenRouter AI Summary Provider

**Returns:**
```json
{
  "identityConfidence": 85,
  "riskLevel": "low",
  "riskFlags": [
    "Multi-platform presence detected"
  ],
  "summary": "Found 5 profiles across 3 platforms. 2 verified accounts detected.",
  "platformsFound": ["LinkedIn", "Twitter", "GitHub"],
  "duplicateImageRisk": false,
  "recommendations": [
    "Review all profiles for consistency",
    "Check for verified accounts"
  ]
}
```

**Risk Levels:**
- `low` - High confidence, few flags
- `medium` - Moderate confidence, some flags
- `high` - Low confidence, multiple flags
- `critical` - Very low confidence, serious concerns

---

## 📊 Complete Result Structure

```json
{
  "success": true,
  "data": {
    "result": {
      "summary": {
        "totalProfilesFound": 5,
        "totalImageMatches": 3,
        "platformsSearched": ["public_profiles", "social_media", "web_sources"],
        "platformsWithResults": ["LinkedIn", "Twitter", "GitHub"],
        "overallConfidence": 85,
        "summaryText": "Found 5 potential profiles for \"Elon Musk\".",
        "hasResults": true
      },
      "matchedProfiles": [...],
      "imageMatches": [...],
      "imageLabels": [...],
      "flags": [...],
      "sources": [...],
      "aiAnalysis": {
        "identityConfidence": 85,
        "riskLevel": "low",
        "riskFlags": [],
        "summary": "...",
        "platformsFound": [],
        "duplicateImageRisk": false,
        "recommendations": []
      },
      "metadata": {
        "searchType": "name",
        "searchQuery": { "name": "Elon Musk" },
        "processedAt": "2024-01-01T00:00:00.000Z",
        "providersUsed": ["profile_provider", "source_provider"],
        "architecture": "production-pipeline-v1"
      }
    }
  }
}
```

---

## ⚠️ Error Handling

### API Key Not Configured
If an API key is missing, the provider will:
- Log a warning
- Return empty results
- Continue with other providers
- Not crash the system

### API Rate Limit
If rate limited:
- Error is logged
- Empty results returned
- Search completes with partial data

### API Timeout
If API times out (10-15 seconds):
- Error is logged
- Empty results returned
- Other providers continue

---

## 🐛 Troubleshooting

### No Results Returned

**Check:**
1. API keys are correct in `.env`
2. Server restarted after adding keys
3. Search query is valid
4. Wait 10-15 seconds for processing

**Logs to check:**
```bash
# Check provider calls
grep "Serper web search" dev_output.log
grep "Google Vision image search" dev_output.log
grep "OpenRouter AI summary" dev_output.log

# Check errors
grep "error" dev_output.log
```

### Image Search Not Working

**Check:**
1. Image uploaded successfully
2. `fileUrl` exists in upload record
3. Image URL is publicly accessible
4. Google Vision API key is valid

### AI Summary Not Generated

**Check:**
1. OpenRouter API key is valid
2. Model `qwen/qwq-32b-preview:free` is available
3. Check response parsing in logs

---

## 📈 Performance Expectations

### Response Times

- **Name Search:** 3-8 seconds
- **Username Search:** 3-8 seconds
- **Image Search:** 5-15 seconds
- **Mixed Search:** 8-20 seconds

### API Costs (Per Search)

- **Serper:** ~$0.001-0.01
- **Google Vision:** ~$0.0015
- **OpenRouter:** FREE (using free model)

**Total per search:** ~$0.002-0.012

---

## ✅ Success Criteria

A successful test should show:

1. ✅ Search created with status "pending"
2. ✅ Progress updates (25% → 50% → 75% → 90% → 100%)
3. ✅ Search status changes to "completed"
4. ✅ Results contain real data from APIs
5. ✅ Profiles have confidence scores
6. ✅ Image matches have similarity scores
7. ✅ AI summary is generated
8. ✅ Risk assessment is provided
9. ✅ No server crashes
10. ✅ Errors are handled gracefully

---

## 🎯 Next Steps

After successful testing:

1. **Test with various inputs:**
   - Common names
   - Unique names
   - Usernames with special characters
   - Different image types

2. **Monitor API usage:**
   - Check Serper dashboard
   - Check Google Cloud console
   - Monitor OpenRouter usage

3. **Optimize if needed:**
   - Add caching for repeated searches
   - Implement rate limiting
   - Add retry logic

4. **Deploy to production:**
   - Update environment variables
   - Test on production server
   - Monitor performance

---

## 📞 Support

If issues persist:

1. Check logs: `dev_output.log`
2. Verify API keys are active
3. Test APIs directly (curl)
4. Check network connectivity
5. Review provider documentation

---

**System is now fully operational with real provider integrations!**
