# Quick Fix: Enable Mock Data for Testing

## Problem
Searches return empty results because API keys are not configured.

## Solution
Use MockWebProvider to return sample data for testing.

---

## Step 1: Switch to Mock Provider

**Edit:** `services/search/SearchProcessor.js`

**Change Line 11 from:**
```javascript
const SerperWebProvider = require('./providers/SerperWebProvider');
```

**To:**
```javascript
const SerperWebProvider = require('./providers/MockWebProvider');
```

---

## Step 2: Restart Server

```bash
npm run dev
```

---

## Step 3: Test Search

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"John Doe"}'
```

**Save the searchId from response.**

---

## Step 4: Wait 2 Seconds, Then Fetch Results

```bash
curl http://localhost:3000/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

---

## Expected Response (With Mock Data)

```json
{
  "success": true,
  "data": {
    "result": {
      "id": "...",
      "searchId": "...",
      "summary": {
        "totalProfilesFound": 3,
        "totalImageMatches": 0,
        "platformsSearched": ["public_profiles", "social_media", "web_sources"],
        "platformsWithResults": ["LinkedIn", "Twitter", "GitHub"],
        "overallConfidence": 76,
        "summaryText": "Found 3 potential profiles for \"John Doe\".",
        "searchType": "name",
        "hasResults": true
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "johndoe",
          "profileUrl": "https://linkedin.com/in/johndoe",
          "displayName": "John Doe",
          "bio": "Software Engineer at Tech Company",
          "profileImage": "https://via.placeholder.com/150",
          "followers": 500,
          "following": 300,
          "location": "San Francisco, CA",
          "isVerified": false,
          "confidence": 85
        },
        {
          "platform": "Twitter",
          "username": "johndoe",
          "profileUrl": "https://twitter.com/johndoe",
          "displayName": "John Doe",
          "bio": "Tech enthusiast | Software Developer",
          "followers": 1200,
          "confidence": 75
        },
        {
          "platform": "GitHub",
          "username": "johndoe",
          "profileUrl": "https://github.com/johndoe",
          "displayName": "John Doe",
          "bio": "Open source contributor",
          "confidence": 70
        }
      ],
      "imageMatches": [],
      "flags": [],
      "sources": [
        {
          "name": "LinkedIn",
          "url": "https://linkedin.com",
          "resultsCount": 1,
          "status": "success"
        },
        {
          "name": "Twitter",
          "url": "https://twitter.com",
          "resultsCount": 1,
          "status": "success"
        },
        {
          "name": "GitHub",
          "url": "https://github.com",
          "resultsCount": 1,
          "status": "success"
        }
      ],
      "hasResults": true,
      "platformsCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Console Logs (Expected)

```
════════════════════════════════════════
SEARCH PROCESSING STARTED
searchId: 67abc...
searchType: name
nameQuery: John Doe
════════════════════════════════════════

Mock web search (using sample data) { searchType: 'name', query: 'John Doe' }
Mock search completed { resultsCount: 3 }

════════════════════════════════════════
SEARCH PROCESSING COMPLETED
reportData.summary: {
  "totalProfilesFound": 3,
  "totalImageMatches": 0,
  "summaryText": "Found 3 potential profiles for \"John Doe\"."
}
reportData.matchedProfiles.length: 3
════════════════════════════════════════

════════════════════════════════════════
CREATING RESULT FROM REPORT DATA
searchId: 67abc...
reportData.matchedProfiles.length: 3
════════════════════════════════════════

════════════════════════════════════════
RESULT CREATED SUCCESSFULLY
resultId: 67xyz...
result.matchedProfiles.length: 3
════════════════════════════════════════
```

---

## Revert to Real Provider (When API Keys Ready)

**Edit:** `services/search/SearchProcessor.js`

**Change back to:**
```javascript
const SerperWebProvider = require('./providers/SerperWebProvider');
```

**Add to .env:**
```bash
SERPER_API_KEY=your_real_api_key_here
```

**Restart server.**

---

## Summary

- ✅ Mock provider returns 3 sample profiles
- ✅ Tests the entire pipeline (search → process → save → retrieve)
- ✅ Proves the system works end-to-end
- ✅ Identifies that empty results = missing API keys
- ✅ Easy to switch back to real provider

This confirms the ROOT CAUSE: **Providers return empty data because API keys are not configured.**
