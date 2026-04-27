# COMPLETE DATA FLOW TRACING - ENABLED

## Comprehensive Logging Added

### Every stage now logs:

1. **Serper Provider Call**
   - API key status
   - Request query
   - Raw API response
   - Response status
   - Organic results count

2. **Result Normalization**
   - Each result processed
   - Platform extraction
   - Validation checks
   - Profile creation

3. **Provider Orchestration**
   - Which providers called
   - Provider results status
   - Profiles/matches count per provider

4. **Match Aggregation**
   - Input arrays count
   - Deduplication process
   - Final aggregated count

5. **Search Processing**
   - Start/complete timestamps
   - Report data structure
   - Profile counts at each stage

6. **Result Creation**
   - Data being saved
   - MongoDB save confirmation

7. **Result Retrieval**
   - Query execution
   - Data retrieved from DB

---

## Testing Instructions

### Step 1: Start Server

```bash
npm run dev
```

### Step 2: Create Search

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"Elon Musk"}'
```

**Save the searchId from response.**

### Step 3: Monitor Console Logs

Watch for this sequence:

```
════════════════════════════════════════
SEARCH PROCESSING STARTED
searchId: ...
searchType: name
nameQuery: Elon Musk
════════════════════════════════════════

════════════════════════════════════════
ORCHESTRATING PROVIDERS
searchType: name
════════════════════════════════════════
➡️ Calling web provider for name/username search

════════════════════════════════════════
SERPER PROVIDER CALLED
enabled: true
apiKeyExists: true
apiKeyLength: 64
════════════════════════════════════════

════════════════════════════════════════
SERPER REQUEST
query: "Elon Musk" site:linkedin.com OR site:twitter.com...
endpoint: https://google.serper.dev/search
apiKey (first 10 chars): sk_abc1234...
════════════════════════════════════════

════════════════════════════════════════
SERPER RESPONSE RECEIVED
status: 200
statusText: OK
data keys: ['organic', 'searchParameters', ...]
organic results count: 10
════════════════════════════════════════
SERPER RAW RESPONSE:
{
  "organic": [
    {
      "position": 1,
      "title": "Elon Musk - LinkedIn",
      "link": "https://linkedin.com/in/elonmusk",
      "snippet": "CEO of Tesla and SpaceX..."
    },
    ...
  ]
}
════════════════════════════════════════

════════════════════════════════════════
NORMALIZING SERPER RESULTS
data.organic exists: true
data.organic length: 10
════════════════════════════════════════
Processing 10 organic results...
---
Result: {
  position: 1,
  title: "Elon Musk - LinkedIn",
  link: "https://linkedin.com/in/elonmusk",
  snippet: "CEO of Tesla..."
}
Extracted platform: LinkedIn
Is valid platform: true
✅ Profile created: {
  platform: "LinkedIn",
  username: "elonmusk",
  displayName: "Elon Musk",
  confidence: 85
}
---
...
════════════════════════════════════════
NORMALIZATION COMPLETE
Total profiles created: 5
Total sources created: 5
════════════════════════════════════════

════════════════════════════════════════
SERPER NORMALIZED RESULTS
profiles count: 5
sources count: 5
First profile: {
  "platform": "LinkedIn",
  "username": "elonmusk",
  ...
}
════════════════════════════════════════

════════════════════════════════════════
PROVIDER RESULTS
Total provider calls: 1
Provider 1: fulfilled
  - profiles: 5
  - matches: 0
  - sources: 5
════════════════════════════════════════
ORCHESTRATION COMPLETE
profiles arrays: 1
imageMatches arrays: 0
sources arrays: 1
════════════════════════════════════════

════════════════════════════════════════
AGGREGATING RESULTS
profiles arrays to aggregate: 1
imageMatches arrays to aggregate: 0
sources arrays to aggregate: 1
════════════════════════════════════════
Aggregating profiles...

════════════════════════════════════════
MATCH AGGREGATOR - PROFILES
providerResults count: 1
Provider 1:
  - has profiles: true
  - is array: true
  - profiles count: 5
  - Processing profile: linkedin_elonmusk
    ✅ Adding new profile
  - Processing profile: twitter_elonmusk
    ✅ Adding new profile
  ...
════════════════════════════════════════
AGGREGATION RESULT
Total unique profiles: 5
Top profile: {
  platform: "LinkedIn",
  username: "elonmusk",
  confidence: 85
}
════════════════════════════════════════

Aggregated profiles count: 5
...
════════════════════════════════════════
AGGREGATION COMPLETE
Final profiles: 5
Final imageMatches: 0
Final sources: 5
════════════════════════════════════════

════════════════════════════════════════
SEARCH PROCESSING COMPLETED
reportData.summary: {
  "totalProfilesFound": 5,
  "totalImageMatches": 0,
  "summaryText": "Found 5 potential profiles for \"Elon Musk\"."
}
reportData.matchedProfiles.length: 5
════════════════════════════════════════

════════════════════════════════════════
CREATING RESULT FROM REPORT DATA
searchId: ...
reportData.matchedProfiles.length: 5
════════════════════════════════════════

════════════════════════════════════════
RESULT CREATED SUCCESSFULLY
resultId: ...
result.matchedProfiles.length: 5
════════════════════════════════════════
```

---

## Diagnostic Scenarios

### Scenario 1: API Key Missing

```
════════════════════════════════════════
SERPER PROVIDER CALLED
enabled: false
apiKeyExists: false
apiKeyLength: 0
════════════════════════════════════════
❌ SERPER DISABLED - returning empty
```

**Fix:** Add `SERPER_API_KEY` to `.env`

---

### Scenario 2: API Returns Empty

```
════════════════════════════════════════
SERPER RESPONSE RECEIVED
status: 200
organic results count: 0
════════════════════════════════════════
SERPER RAW RESPONSE:
{
  "organic": []
}
════════════════════════════════════════
```

**Cause:** Query returns no results (try different name)

---

### Scenario 3: API Error (401 Unauthorized)

```
════════════════════════════════════════
SERPER API ERROR
error message: Request failed with status code 401
error code: ERR_BAD_REQUEST
response status: 401
response data: { "error": "Invalid API key" }
════════════════════════════════════════
```

**Fix:** Check API key is correct

---

### Scenario 4: API Error (429 Rate Limit)

```
════════════════════════════════════════
SERPER API ERROR
error message: Request failed with status code 429
response status: 429
response data: { "error": "Rate limit exceeded" }
════════════════════════════════════════
```

**Fix:** Wait or upgrade plan

---

### Scenario 5: All Results Filtered Out

```
════════════════════════════════════════
NORMALIZING SERPER RESULTS
data.organic length: 10
════════════════════════════════════════
Processing 10 organic results...
---
Result: { ... }
Extracted platform: Web
Is valid platform: false
❌ Skipped: invalid platform
---
...
════════════════════════════════════════
NORMALIZATION COMPLETE
Total profiles created: 0  ← ALL FILTERED
════════════════════════════════════════
```

**Cause:** No results from valid platforms (LinkedIn, Twitter, etc.)

---

### Scenario 6: Aggregation Removes All

```
════════════════════════════════════════
MATCH AGGREGATOR - PROFILES
providerResults count: 1
Provider 1:
  - has profiles: false  ← PROBLEM
  - is array: false
  ❌ Skipping: invalid profiles array
════════════════════════════════════════
```

**Cause:** Provider returned wrong structure

---

## What to Look For

### ✅ Success Indicators:

1. `enabled: true` and `apiKeyExists: true`
2. `status: 200` from Serper
3. `organic results count: > 0`
4. `Total profiles created: > 0`
5. `Aggregated profiles count: > 0`
6. `reportData.matchedProfiles.length: > 0`
7. `result.matchedProfiles.length: > 0`

### ❌ Failure Points:

1. **Provider disabled** → API key missing
2. **Status 401/403** → Invalid API key
3. **Status 429** → Rate limit
4. **organic results count: 0** → Query returns nothing
5. **Total profiles created: 0** → All filtered (wrong platforms)
6. **Aggregated profiles count: 0** → Aggregation bug
7. **reportData.matchedProfiles.length: 0** → Report builder bug

---

## Step 4: Fetch Results

```bash
curl http://localhost:3000/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Check console:**

```
════════════════════════════════════════
FETCHING RESULT BY SEARCH ID
searchId: ...
════════════════════════════════════════
Search found: { searchId, status: 'completed', progress: 100 }
Result query executed
result found: true
result._id: ...
result.matchedProfiles.length: 5  ← SHOULD MATCH SAVED COUNT
════════════════════════════════════════
```

---

## Expected Final Response

```json
{
  "success": true,
  "data": {
    "result": {
      "id": "...",
      "searchId": "...",
      "summary": {
        "totalProfilesFound": 5,
        "summaryText": "Found 5 potential profiles for \"Elon Musk\"."
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "elonmusk",
          "profileUrl": "https://linkedin.com/in/elonmusk",
          "displayName": "Elon Musk",
          "confidence": 85
        },
        ...
      ]
    }
  }
}
```

---

## Copy These Logs

When reporting the issue, copy:

1. **SERPER PROVIDER CALLED** section
2. **SERPER REQUEST** section
3. **SERPER RESPONSE RECEIVED** section
4. **SERPER RAW RESPONSE** (full JSON)
5. **NORMALIZATION COMPLETE** section
6. **AGGREGATION COMPLETE** section
7. **SEARCH PROCESSING COMPLETED** section
8. **RESULT CREATED SUCCESSFULLY** section

This will show EXACTLY where data is lost.

---

## Summary

The logs now trace:
- ✅ API key status
- ✅ API request details
- ✅ Raw API response
- ✅ Parsing/normalization
- ✅ Filtering logic
- ✅ Aggregation process
- ✅ Final data saved
- ✅ Data retrieved

**Run the test and share the console output to identify the exact failure point.**
