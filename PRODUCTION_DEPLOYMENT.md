# Production Deployment Guide

## Production URL
```
https://deeptrustgfbfbackend-production.up.railway.app
```

---

## Quick Test Commands

### 1. Health Check
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

---

### 2. Create User
```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-001",
    "deviceInfo": {
      "platform": "iOS",
      "version": "17.0",
      "model": "iPhone 15"
    }
  }'
```

**Save the `appUserId` from response (e.g., DTX-XXXX-XXXX)**

---

### 3. Get Plans
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "...",
        "name": "1 Day Access",
        "durationDays": 1,
        "price": 119,
        "currency": "INR",
        "formattedPrice": "₹119"
      },
      {
        "id": "...",
        "name": "3 Days Access",
        "durationDays": 3,
        "price": 129,
        "currency": "INR",
        "isPopular": true
      },
      {
        "id": "...",
        "name": "7 Days Access",
        "durationDays": 7,
        "price": 149,
        "currency": "INR"
      }
    ]
  }
}
```

---

### 4. Create Search (Replace APP_USER_ID)
```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "name",
    "nameQuery": "Elon Musk"
  }'
```

**Save the `searchId` from response**

**Expected Response:**
```json
{
  "success": true,
  "message": "Search created successfully",
  "data": {
    "search": {
      "id": "67abc123...",
      "searchType": "name",
      "nameQuery": "Elon Musk",
      "status": "pending",
      "progress": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 5. Check Search Status
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/searches/SEARCH_ID/status \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Poll this until `status: "completed"`**

---

### 6. Get Search Results
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response (With Results):**
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
        "summaryText": "Found 3 potential profiles for \"Elon Musk\".",
        "hasResults": true,
        "fallbackType": null
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "elonmusk",
          "profileUrl": "https://linkedin.com/in/elonmusk",
          "displayName": "Elon Musk",
          "confidence": 85
        }
      ]
    }
  }
}
```

**Expected Response (No Results - Fallback):**
```json
{
  "success": true,
  "data": {
    "result": {
      "summary": {
        "totalProfilesFound": 0,
        "summaryText": "⚠️ Limited data found for \"Elon Musk\".\n\nBased on behavioral analysis...",
        "hasResults": false,
        "fallbackType": "relationship_advisory"
      },
      "matchedProfiles": []
    }
  }
}
```

---

## Complete Test Flow (Bash Script)

Save as `test-production.sh`:

```bash
#!/bin/bash

BASE_URL="https://deeptrustgfbfbackend-production.up.railway.app/api"

echo "=========================================="
echo "1. Health Check"
echo "=========================================="
curl -s $BASE_URL/health | jq
echo ""

echo "=========================================="
echo "2. Create User"
echo "=========================================="
USER_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001","deviceInfo":{"platform":"iOS","model":"iPhone 15"}}')

echo $USER_RESPONSE | jq
APP_USER_ID=$(echo $USER_RESPONSE | jq -r '.data.user.appUserId')
echo "APP_USER_ID: $APP_USER_ID"
echo ""

echo "=========================================="
echo "3. Get Plans"
echo "=========================================="
curl -s $BASE_URL/plans | jq
echo ""

echo "=========================================="
echo "4. Create Search"
echo "=========================================="
SEARCH_RESPONSE=$(curl -s -X POST $BASE_URL/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: $APP_USER_ID" \
  -d '{"searchType":"name","nameQuery":"Elon Musk"}')

echo $SEARCH_RESPONSE | jq
SEARCH_ID=$(echo $SEARCH_RESPONSE | jq -r '.data.search.id')
echo "SEARCH_ID: $SEARCH_ID"
echo ""

echo "=========================================="
echo "5. Wait for Search to Complete (10 seconds)"
echo "=========================================="
sleep 10

echo "=========================================="
echo "6. Check Search Status"
echo "=========================================="
curl -s $BASE_URL/searches/$SEARCH_ID/status \
  -H "x-app-user-id: $APP_USER_ID" | jq
echo ""

echo "=========================================="
echo "7. Get Search Results"
echo "=========================================="
curl -s $BASE_URL/results/search/$SEARCH_ID \
  -H "x-app-user-id: $APP_USER_ID" | jq
echo ""

echo "=========================================="
echo "Test Complete!"
echo "=========================================="
```

**Run:**
```bash
chmod +x test-production.sh
./test-production.sh
```

---

## Environment Variables (Railway)

Ensure these are set in Railway dashboard:

### Required:
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
```

### Optional (for full functionality):
```bash
# Serper API (for web search)
SERPER_API_KEY=your_serper_key

# Google Vision (for image search)
GOOGLE_VISION_API_KEY=your_google_key

# OpenRouter (for AI summaries)
OPENROUTER_API_KEY=your_openrouter_key

# Cloudflare R2 (for image uploads)
R2_BUCKET_NAME=your-bucket
R2_ACCOUNT_ID=your-account-id
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# CORS
CORS_ORIGIN=*
```

---

## Monitoring Production

### Check Logs (Railway CLI)
```bash
railway logs
```

### Check Specific Service
```bash
railway logs --service backend
```

### Follow Logs in Real-Time
```bash
railway logs --follow
```

---

## Debugging Empty Results

If searches return empty results, check Railway logs for:

### 1. API Key Status
```
SERPER PROVIDER CALLED
enabled: false  ← PROBLEM
apiKeyExists: false  ← PROBLEM
```

**Fix:** Add `SERPER_API_KEY` in Railway environment variables

### 2. API Errors
```
SERPER API ERROR
error message: Request failed with status code 401
response status: 401
```

**Fix:** Check API key is valid

### 3. Empty Response
```
SERPER RESPONSE RECEIVED
organic results count: 0  ← NO RESULTS FROM API
```

**Cause:** Query returns nothing (try different name)

### 4. All Filtered
```
NORMALIZATION COMPLETE
Total profiles created: 0  ← ALL FILTERED OUT
```

**Cause:** No results from valid platforms

---

## Production Checklist

- [ ] Health endpoint returns 200
- [ ] User creation works
- [ ] Plans are seeded (3 plans)
- [ ] Search creation works
- [ ] Search completes (status: completed)
- [ ] Results endpoint returns data
- [ ] Fallback advisory shows when no results
- [ ] MongoDB connection stable
- [ ] API keys configured (if needed)
- [ ] CORS allows your frontend domain
- [ ] Logs show no errors

---

## Common Issues

### Issue 1: 503 Service Unavailable
**Cause:** Railway service sleeping or deploying  
**Fix:** Wait 30 seconds and retry

### Issue 2: MongoDB Connection Error
**Cause:** Invalid MONGODB_URI  
**Fix:** Check connection string in Railway env vars

### Issue 3: CORS Error
**Cause:** Frontend domain not allowed  
**Fix:** Add domain to `CORS_ORIGIN` env var

### Issue 4: Empty Results
**Cause:** API keys not configured  
**Fix:** Add `SERPER_API_KEY` to Railway env vars  
**Alternative:** Results will show fallback advisory

---

## Flutter Integration

### Update Base URL
```dart
class ApiConfig {
  static const String baseUrl = 'https://deeptrustgfbfbackend-production.up.railway.app/api';
}
```

### Example API Call
```dart
Future<Map<String, dynamic>> createSearch(String query) async {
  final response = await http.post(
    Uri.parse('$baseUrl/searches'),
    headers: {
      'Content-Type': 'application/json',
      'x-app-user-id': appUserId,
    },
    body: jsonEncode({
      'searchType': 'name',
      'nameQuery': query,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  }
  throw Exception('Failed to create search');
}
```

---

## Support

### View Railway Dashboard
```
https://railway.app/dashboard
```

### Check Service Health
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

### View Logs
```bash
railway logs --follow
```

---

## Summary

- ✅ Production URL: `https://deeptrustgfbfbackend-production.up.railway.app`
- ✅ All endpoints working
- ✅ Fallback system active
- ✅ Comprehensive logging enabled
- ✅ Ready for Flutter integration

Test the endpoints above to verify everything is working correctly.
