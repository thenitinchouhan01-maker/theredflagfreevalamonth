# Quick Reference - Production API

## Base URL
```
https://deeptrustgfbfbackend-production.up.railway.app/api
```

---

## Quick Test (Copy-Paste)

```bash
# 1. Health Check
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health

# 2. Create User (save appUserId)
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'

# 3. Create Search (replace DTX-XXXX-XXXX with your appUserId)
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"searchType":"name","nameQuery":"Elon Musk"}'

# 4. Get Results (replace SEARCH_ID and DTX-XXXX-XXXX)
curl https://deeptrustgfbfbackend-production.up.railway.app/api/results/search/SEARCH_ID \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

---

## All Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/users` | No | Create user |
| POST | `/users/restore` | No | Restore user |
| GET | `/users/me` | Yes | Get current user |
| GET | `/plans` | No | Get all plans |
| POST | `/searches` | Yes | Create search |
| GET | `/searches/:id/status` | Yes | Get search status |
| GET | `/results/search/:searchId` | Yes | Get search results |
| POST | `/uploads` | Yes | Upload image |

**Auth:** Requires `x-app-user-id: DTX-XXXX-XXXX` header

---

## Response Formats

### Success (With Results)
```json
{
  "success": true,
  "data": {
    "result": {
      "summary": {
        "totalProfilesFound": 3,
        "summaryText": "Found 3 potential profiles...",
        "hasResults": true,
        "fallbackType": null
      },
      "matchedProfiles": [...]
    }
  }
}
```

### Success (No Results - Fallback)
```json
{
  "success": true,
  "data": {
    "result": {
      "summary": {
        "totalProfilesFound": 0,
        "summaryText": "⚠️ Limited data found...\n\n❤️ Relationship Advice...",
        "hasResults": false,
        "fallbackType": "relationship_advisory"
      },
      "matchedProfiles": []
    }
  }
}
```

### Error
```json
{
  "success": false,
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Flutter Integration

```dart
// Config
const baseUrl = 'https://deeptrustgfbfbackend-production.up.railway.app/api';

// Create Search
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

// Get Results
final response = await http.get(
  Uri.parse('$baseUrl/results/search/$searchId'),
  headers: {'x-app-user-id': appUserId},
);

// Check for Fallback
final result = jsonDecode(response.body)['data']['result'];
if (result['summary']['fallbackType'] == 'relationship_advisory') {
  // Show advisory UI
  showAdvisory(result['summary']['summaryText']);
} else {
  // Show normal results
  showProfiles(result['matchedProfiles']);
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 503 Error | Wait 30s (Railway waking up) |
| Empty Results | Check Railway logs for API key status |
| CORS Error | Add domain to `CORS_ORIGIN` env var |
| 401 Error | Check `x-app-user-id` header |

---

## View Logs

```bash
railway logs --follow
```

Look for:
- `SERPER PROVIDER CALLED` - API key status
- `SERPER RESPONSE RECEIVED` - API response
- `NORMALIZATION COMPLETE` - Profiles created
- `RESULT CREATED SUCCESSFULLY` - Data saved

---

## Key Features

✅ Comprehensive logging at every stage  
✅ Safe fallback advisory when no results  
✅ No fake data - only real results  
✅ Relationship advice for empty searches  
✅ Production-ready error handling  

---

## Documentation Files

- `PRODUCTION_DEPLOYMENT.md` - Full deployment guide
- `SAFE_FALLBACK_SYSTEM.md` - Fallback system details
- `DATA_FLOW_TRACING.md` - Debugging guide
- `ROOT_CAUSE_ANALYSIS.md` - Issue analysis
- `README.md` - Complete API documentation

---

## Status

🟢 **Production Ready**

- Backend deployed on Railway
- All endpoints functional
- Fallback system active
- Comprehensive logging enabled
- Ready for Flutter integration
