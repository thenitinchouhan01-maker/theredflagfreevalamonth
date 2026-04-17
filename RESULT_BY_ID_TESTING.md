# 🧪 GET /api/results/:id - Testing Guide

## ✅ FIXES APPLIED

### 1. Service Layer Enhanced
- ✅ Added MongoDB ObjectId validation
- ✅ Added comprehensive logging (debug, info, warn, error)
- ✅ Better error messages with error codes
- ✅ Stack trace logging for debugging

### 2. Controller Enhanced
- ✅ Added request logging with user agent
- ✅ Added response preparation logging
- ✅ Consistent with existing architecture

### 3. Architecture Verified
- ✅ Controller → Service → Model (clean separation)
- ✅ No direct DB calls in controller
- ✅ Proper error handling with AppError
- ✅ Population of searchId working

---

## 🔍 COMMON ISSUES & SOLUTIONS

### Issue 1: "Result not found" for valid ID

**Possible Causes:**
1. Using Search ID instead of Result ID
2. Result belongs to different user
3. Result doesn't exist in database

**Solution:**
```bash
# Get the RESULT ID (not search ID)
# From search response, use the result._id field

# Example flow:
POST /api/searches → returns searchId
GET /api/results/search/:searchId → returns result with result._id
GET /api/results/:resultId → use result._id from previous step
```

### Issue 2: Invalid ObjectId format

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid result ID format",
  "errorCode": "INVALID_RESULT_ID",
  "statusCode": 400
}
```

**Solution:**
- Ensure ID is 24-character hex string
- Example valid ID: `69dde3c5e227a94e847ce097`
- Example invalid ID: `123`, `invalid-id`, `69dde3c5`

### Issue 3: Ownership check failing

**Error Response:**
```json
{
  "success": false,
  "message": "Result not found",
  "errorCode": "RESULT_NOT_FOUND",
  "statusCode": 404
}
```

**Solution:**
- Ensure `x-app-user-id` header matches the user who created the search
- Results are user-specific for privacy

---

## 🧪 TESTING STEPS

### Step 1: Get Valid Result ID

```http
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "deviceId": "test-device-001"
}
```

**Save:** `appUserId` (e.g., `DTX-XXXX-XXXX`)

---

### Step 2: Create Search

```http
POST http://localhost:3000/api/searches
Content-Type: application/json
x-app-user-id: DTX-XXXX-XXXX

{
  "searchType": "name",
  "nameQuery": "Elon Musk"
}
```

**Save:** `searchId`

---

### Step 3: Wait for Processing (10-15 seconds)

---

### Step 4: Get Result by Search ID

```http
GET http://localhost:3000/api/results/search/{{searchId}}
x-app-user-id: DTX-XXXX-XXXX
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "69dde3c5e227a94e847ce097",  // ← THIS IS THE RESULT ID
      "searchId": "...",
      "summary": { ... },
      "matchedProfiles": [ ... ]
    }
  }
}
```

**Save:** `result.id` (this is the RESULT ID, not search ID)

---

### Step 5: Test GET by Result ID ✅

```http
GET http://localhost:3000/api/results/69dde3c5e227a94e847ce097
x-app-user-id: DTX-XXXX-XXXX
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "result": {
      "id": "69dde3c5e227a94e847ce097",
      "searchId": "...",
      "search": {
        "id": "...",
        "searchType": "name",
        "nameQuery": "Elon Musk",
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "summary": {
        "totalProfilesFound": 5,
        "overallConfidence": 85,
        "summaryText": "Found 5 profiles across 3 platforms..."
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "elonmusk",
          "displayName": "Elon Musk",
          "profileUrl": "https://...",
          "bio": "...",
          "followers": 5000000,
          "isVerified": true,
          "confidence": 95
        }
      ],
      "imageMatches": [],
      "flags": [],
      "sources": [],
      "hasResults": true,
      "platformsCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📊 LOG OUTPUT (What to Expect)

### Successful Request Logs:

```
INFO: API HIT: GET /api/results/:resultId { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1',
  userAgent: 'PostmanRuntime/7.32.3'
}

DEBUG: Fetching result by ID { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}

INFO: Result fetched successfully { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1',
  profilesCount: 5
}

DEBUG: Result retrieved, preparing response {
  resultId: '69dde3c5e227a94e847ce097',
  hasProfiles: true,
  profilesCount: 5
}
```

### Invalid ID Logs:

```
INFO: API HIT: GET /api/results/:resultId { 
  resultId: 'invalid-id',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}

DEBUG: Fetching result by ID { 
  resultId: 'invalid-id',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}

WARN: Invalid result ID format { resultId: 'invalid-id' }
```

### Not Found Logs:

```
INFO: API HIT: GET /api/results/:resultId { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}

DEBUG: Fetching result by ID { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}

WARN: Result not found { 
  resultId: '69dde3c5e227a94e847ce097',
  userId: '64f1a2b3c4d5e6f7a8b9c0d1'
}
```

---

## 🔧 DEBUGGING CHECKLIST

If endpoint still returns "Result not found":

### 1. Verify Result Exists in Database

```javascript
// MongoDB Shell or Compass
db.results.findOne({ _id: ObjectId("69dde3c5e227a94e847ce097") })
```

**Check:**
- ✅ Document exists
- ✅ `userId` field matches your user
- ✅ `searchId` is populated

### 2. Verify User ID

```javascript
// Check user exists
db.users.findOne({ appUserId: "DTX-XXXX-XXXX" })
```

**Get:** `_id` field and compare with result's `userId`

### 3. Check Server Logs

```bash
# Start server with logs visible
npm run dev

# Look for:
# - "API HIT: GET /api/results/:resultId"
# - "Fetching result by ID"
# - "Result fetched successfully" OR "Result not found"
```

### 4. Test with MongoDB Compass

**Query:**
```json
{
  "_id": ObjectId("69dde3c5e227a94e847ce097"),
  "userId": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1")
}
```

If this returns a document, the API should work.

### 5. Verify Route Registration

```bash
# Check routes are loaded
curl http://localhost:3000/api/results/test-id

# Should return 400 (Invalid ID) not 404 (Route not found)
```

---

## 📋 ERROR CODES REFERENCE

| Error Code | Status | Meaning | Solution |
|------------|--------|---------|----------|
| INVALID_RESULT_ID | 400 | ID format invalid | Use 24-char hex string |
| RESULT_NOT_FOUND | 404 | Result doesn't exist or wrong user | Check ID and user ownership |
| RESULT_GET_FAILED | 500 | Database error | Check logs, DB connection |
| USER_NOT_FOUND | 401 | Invalid x-app-user-id | Create user first |

---

## ✅ VALIDATION CHECKLIST

Before reporting issues, verify:

- [ ] Using RESULT ID (not search ID)
- [ ] Result ID is 24-character hex string
- [ ] `x-app-user-id` header is set
- [ ] User who created search is making request
- [ ] Result exists in database
- [ ] Server is running without errors
- [ ] MongoDB connection is active
- [ ] Checked server logs for errors

---

## 🎯 EXPECTED BEHAVIOR

### Valid Request:
- ✅ Returns 200 OK
- ✅ Includes full result data
- ✅ Includes populated search data
- ✅ Includes matched profiles
- ✅ Logs show success

### Invalid ID:
- ✅ Returns 400 Bad Request
- ✅ Error code: INVALID_RESULT_ID
- ✅ Logs show validation failure

### Not Found:
- ✅ Returns 404 Not Found
- ✅ Error code: RESULT_NOT_FOUND
- ✅ Logs show query returned null

### Server Error:
- ✅ Returns 500 Internal Server Error
- ✅ Error code: RESULT_GET_FAILED
- ✅ Logs show stack trace

---

## 🚀 PRODUCTION READY

This endpoint is now:
- ✅ Properly validated
- ✅ Comprehensively logged
- ✅ Error-handled
- ✅ User-scoped (privacy)
- ✅ Performant (indexed queries)
- ✅ Documented
- ✅ Testable

---

## 📞 SUPPORT

If issues persist after following this guide:

1. Check server logs for detailed error messages
2. Verify database connection
3. Test with MongoDB Compass directly
4. Ensure all environment variables are set
5. Restart server after code changes

**Common Fix:** Restart server after any code changes!

```bash
# Stop server (Ctrl+C)
npm run dev
```
