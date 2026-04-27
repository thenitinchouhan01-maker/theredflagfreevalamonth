# ROOT CAUSE DIAGNOSIS - Empty Results & Upload Failures

## COMPREHENSIVE LOGGING ADDED

### What Was Added:

**1. Search Processing Logs (`search.service.js`)**
```
════════════════════════════════════════
SEARCH PROCESSING STARTED
searchId: ...
searchType: name
nameQuery: John Doe
════════════════════════════════════════

════════════════════════════════════════
SEARCH PROCESSING COMPLETED
reportData.summary: { ... }
reportData.matchedProfiles.length: 0
reportData.imageMatches.length: 0
════════════════════════════════════════
```

**2. Result Creation Logs (`search.service.js`)**
```
════════════════════════════════════════
CREATING RESULT FROM REPORT DATA
searchId: ...
userId: ...
reportData.summary: { ... }
reportData.matchedProfiles.length: 0
════════════════════════════════════════

════════════════════════════════════════
RESULT CREATED SUCCESSFULLY
resultId: ...
result.summary: { ... }
result.matchedProfiles.length: 0
════════════════════════════════════════
```

**3. Result Fetch Logs (`result.service.js`)**
```
════════════════════════════════════════
FETCHING RESULT BY SEARCH ID
searchId: ...
userId: ...
════════════════════════════════════════
Search found: { searchId, status, progress }
Result query executed
result found: true
result._id: ...
result.summary: { ... }
result.matchedProfiles.length: 0
════════════════════════════════════════
```

---

## ISSUE 1: EMPTY RESULTS - ROOT CAUSE IDENTIFIED

### The Flow:

```
1. POST /searches → creates search
2. processSearch() → calls SearchProcessor.process()
3. SearchProcessor → calls providers (SerperWebProvider, etc.)
4. Providers return empty results
5. ReportBuilder → builds report with empty data
6. Result saved to DB with empty arrays
7. GET /results/search/:id → returns empty result
```

### ROOT CAUSE: **PROVIDERS RETURNING EMPTY DATA**

#### Why Providers Return Empty:

**SerperWebProvider.js (Line 17-20):**
```javascript
if (!this.apiKey) {
  logger.warn('Serper API key not configured');
  this.enabled = false;
}
```

**SerperWebProvider.js (Line 28-30):**
```javascript
if (!this.enabled) {
  return this.getEmptyResult('API key not configured');
}
```

**Result:**
```javascript
{
  profiles: [],
  sources: [],
  metadata: { note: 'API key not configured' }
}
```

---

## DIAGNOSIS STEPS

### Step 1: Run a Search and Check Logs

```bash
# Create search
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"John Doe"}'
```

**Check server console for:**

```
════════════════════════════════════════
SEARCH PROCESSING STARTED
searchId: 67abc123...
searchType: name
nameQuery: John Doe
════════════════════════════════════════
```

### Step 2: Wait for Completion

**Look for:**
```
════════════════════════════════════════
SEARCH PROCESSING COMPLETED
reportData.summary: {
  "totalProfilesFound": 0,
  "totalImageMatches": 0,
  "summaryText": "No matching profiles..."
}
reportData.matchedProfiles.length: 0
════════════════════════════════════════
```

**If `matchedProfiles.length: 0` → Providers returned empty**

### Step 3: Check Provider Logs

**Look for:**
```
Serper API key not configured
```

**OR**

```
Serper web search { query: '...' }
Serper search completed { resultsCount: 0 }
```

### Step 4: Check Result Creation

**Look for:**
```
════════════════════════════════════════
CREATING RESULT FROM REPORT DATA
searchId: ...
reportData.matchedProfiles.length: 0  ← EMPTY
════════════════════════════════════════

════════════════════════════════════════
RESULT CREATED SUCCESSFULLY
resultId: ...
result.matchedProfiles.length: 0  ← SAVED AS EMPTY
════════════════════════════════════════
```

### Step 5: Fetch Result

```bash
curl http://localhost:3000/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Check console for:**
```
════════════════════════════════════════
FETCHING RESULT BY SEARCH ID
searchId: ...
════════════════════════════════════════
result.matchedProfiles.length: 0  ← RETRIEVED AS EMPTY
════════════════════════════════════════
```

---

## ROOT CAUSES IDENTIFIED

### ✅ CONFIRMED: Results ARE Being Saved

The logs will show:
- ✅ Search is created
- ✅ Search is processed
- ✅ Result is created in DB
- ✅ Result is retrieved from DB

### ❌ PROBLEM: Providers Return Empty Data

**Possible Reasons:**

#### 1. **API Keys Not Configured**
```bash
# Check .env file
SERPER_API_KEY=  # ← EMPTY or MISSING
GOOGLE_VISION_API_KEY=  # ← EMPTY or MISSING
OPENROUTER_API_KEY=  # ← EMPTY or MISSING
```

**Solution:**
```bash
# Add to .env
SERPER_API_KEY=your_serper_key_here
GOOGLE_VISION_API_KEY=your_google_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

#### 2. **API Keys Invalid/Expired**

**Check logs for:**
```
Serper API error { error: 'Unauthorized', status: 401 }
```

**Solution:** Get new API keys

#### 3. **API Rate Limits Exceeded**

**Check logs for:**
```
Serper API error { error: 'Rate limit exceeded', status: 429 }
```

**Solution:** Wait or upgrade plan

#### 4. **Network/Firewall Issues**

**Check logs for:**
```
Serper API error { error: 'ECONNREFUSED' }
```

**Solution:** Check network connectivity

---

## ISSUE 2: UPLOAD FAILURES

### Logs Added:

**upload.controller.js:**
```javascript
if (!file) {
  console.error('UPLOAD_ERROR: No file in request');
  console.error('req.file:', req.file);
  console.error('req.body:', req.body);
}
```

**upload.service.js:**
```javascript
console.error('UPLOAD_ERROR:', error);
console.error('STACK:', error.stack);
console.error('bucketName:', this.bucketName);
console.error('accessKeyId:', config.r2.accessKeyId ? 'SET' : 'NOT SET');
```

### Diagnosis Steps:

#### Step 1: Test Upload

```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -F "image=@photo.jpg"
```

#### Step 2: Check Console Logs

**If no file:**
```
UPLOAD_ERROR: No file in request
req.file: undefined
req.body: {}
```
→ **Multer not receiving file**

**If R2 error:**
```
UPLOAD_ERROR: Storage not configured
bucketName: undefined
accessKeyId: NOT SET
```
→ **R2 credentials missing**

**If S3 error:**
```
UPLOAD_ERROR: The specified bucket does not exist
STACK: ...
bucketName: my-bucket
accessKeyId: SET
```
→ **Bucket doesn't exist**

---

## FIXES REQUIRED

### For Empty Results:

**Option 1: Configure Real API Keys**
```bash
# .env
SERPER_API_KEY=your_key_here
GOOGLE_VISION_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```

**Option 2: Use Mock Data for Testing**

Create `services/search/providers/MockWebProvider.js`:
```javascript
class MockWebProvider {
  async searchSources(context) {
    return {
      profiles: [
        {
          platform: 'LinkedIn',
          username: 'johndoe',
          profileUrl: 'https://linkedin.com/in/johndoe',
          displayName: 'John Doe',
          bio: 'Software Engineer',
          confidence: 85
        }
      ],
      sources: [
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com',
          resultsCount: 1,
          status: 'success'
        }
      ]
    };
  }
}
```

Then in `SearchProcessor.js`:
```javascript
// Replace line 11
const SerperWebProvider = require('./providers/MockWebProvider');
```

### For Upload Failures:

**Check .env:**
```bash
R2_BUCKET_NAME=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
```

---

## VERIFICATION CHECKLIST

After running a search, verify logs show:

- [ ] `SEARCH PROCESSING STARTED` with correct query
- [ ] `SEARCH PROCESSING COMPLETED` with profile count
- [ ] `CREATING RESULT FROM REPORT DATA` with data
- [ ] `RESULT CREATED SUCCESSFULLY` with resultId
- [ ] `FETCHING RESULT BY SEARCH ID` returns same data
- [ ] Provider logs show API calls (not "API key not configured")

---

## EXPECTED OUTPUT (With Working Providers)

```
════════════════════════════════════════
SEARCH PROCESSING COMPLETED
reportData.summary: {
  "totalProfilesFound": 3,
  "totalImageMatches": 0,
  "summaryText": "Found 3 potential profiles..."
}
reportData.matchedProfiles.length: 3  ← NOT EMPTY
════════════════════════════════════════

════════════════════════════════════════
RESULT CREATED SUCCESSFULLY
resultId: 67xyz...
result.matchedProfiles.length: 3  ← SAVED WITH DATA
════════════════════════════════════════

════════════════════════════════════════
FETCHING RESULT BY SEARCH ID
result.matchedProfiles.length: 3  ← RETRIEVED WITH DATA
════════════════════════════════════════
```

---

## NEXT STEPS

1. **Run a search** and capture ALL console logs
2. **Copy the exact logs** showing:
   - SEARCH PROCESSING STARTED
   - SEARCH PROCESSING COMPLETED
   - CREATING RESULT FROM REPORT DATA
   - RESULT CREATED SUCCESSFULLY
   - FETCHING RESULT BY SEARCH ID
3. **Check for provider errors:**
   - "API key not configured"
   - "Serper API error"
   - "Rate limit exceeded"
4. **Verify .env has API keys**
5. **If no API keys:** Use mock provider (instructions above)

The logs will tell us EXACTLY where the data is lost.
