# 🔍 Instagram Search Suggestions API - Complete Guide

## 📋 Overview

New endpoint added to Red Flag backend for Instagram profile search suggestions using Google Custom Search API.

**Endpoint**: `POST /api/search/instagram-suggestions`  
**Rate Limit**: 100 requests per hour per IP  
**Authentication**: None required

---

## 🚀 Quick Start

### 1. Environment Setup

Add to `.env` file:
```env
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyDOKaKfCtgNNsIOtIjl5WOLuf0zorxecN3
GOOGLE_SEARCH_ENGINE_ID=73b19edbe6911411c
```

### 2. Test the Endpoint

```bash
# Local testing
curl -X POST http://localhost:3000/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "elonmusk"}'

# Production testing
curl -X POST https://web-production-7a3f6.up.railway.app/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "elonmusk"}'
```

---

## 📡 API Reference

### Request

**Method**: `POST`  
**URL**: `/api/search/instagram-suggestions`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "query": "username or name"
}
```

**Validation Rules**:
- `query` is required
- Must be a string
- Minimum length: 2 characters
- Maximum length: 100 characters
- Trimmed automatically

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Instagram suggestions retrieved successfully",
  "data": {
    "query": "elonmusk",
    "suggestions": [
      {
        "username": "elonmusk",
        "displayName": "Elon Musk",
        "profileUrl": "https://www.instagram.com/elonmusk",
        "profilePic": "https://...",
        "snippet": "CEO, CTO of SpaceX...",
        "source": "google_custom_search"
      }
    ],
    "count": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### No Results Response (200 OK)

```json
{
  "success": true,
  "message": "No suggestions found",
  "data": {
    "query": "nonexistentuser12345",
    "suggestions": [],
    "count": 0
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Query is required",
  "errorCode": "INVALID_QUERY",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "success": false,
  "message": "Too many search requests. Please try again later.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": "1 hour"
}
```

---

## 🧪 Testing

### Test 1: Basic Search

```bash
curl -X POST http://localhost:3000/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "cristiano"}'
```

**Expected**: Returns Instagram profiles matching "cristiano"

### Test 2: No Results

```bash
curl -X POST http://localhost:3000/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "nonexistentuser9999999"}'
```

**Expected**: Returns empty suggestions array

### Test 3: Validation Error

```bash
curl -X POST http://localhost:3000/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "a"}'
```

**Expected**: 400 error - "Query must be at least 2 characters"

### Test 4: Missing Query

```bash
curl -X POST http://localhost:3000/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 error - "Query is required"

### Test 5: Health Check

```bash
curl http://localhost:3000/api/search/health
```

**Expected**:
```json
{
  "success": true,
  "service": "Instagram Search",
  "status": "configured",
  "rateLimit": {
    "windowMs": 3600000,
    "maxRequests": 100
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📊 Response Fields

### Suggestion Object

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Instagram username (handle) |
| `displayName` | string | Display name or full name |
| `profileUrl` | string | Full Instagram profile URL |
| `profilePic` | string | Profile picture URL (or placeholder) |
| `snippet` | string | Brief description from search result |
| `source` | string | Always "google_custom_search" |

---

## 🔒 Rate Limiting

**Limit**: 100 requests per hour per IP address  
**Window**: 1 hour (3600000 ms)  
**Headers**: 
- `RateLimit-Limit`: Total requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

**When Exceeded**:
- HTTP Status: `429 Too Many Requests`
- Retry After: 1 hour
- Error Code: `RATE_LIMIT_EXCEEDED`

---

## 🚨 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_QUERY` | 400 | Query parameter missing or invalid |
| `QUERY_TOO_SHORT` | 400 | Query less than 2 characters |
| `QUERY_TOO_LONG` | 400 | Query more than 100 characters |
| `SERVICE_NOT_CONFIGURED` | 500 | Google API credentials not set |
| `SEARCH_FAILED` | 500 | Unexpected error during search |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |

---

## 🏗️ Architecture

### Files Created

1. **Controller**: `controllers/instagramSearch.controller.js`
   - Handles Instagram search logic
   - Calls Google Custom Search API
   - Parses and formats results

2. **Routes**: `routes/instagramSearch.routes.js`
   - Defines API endpoint
   - Applies rate limiting
   - Validates request body

3. **Route Registration**: `routes/index.js` (modified)
   - Added `instagramSearchRoutes` import
   - Registered route: `/api/search/*`

4. **Environment**: `.env.example` (modified)
   - Added `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - Added `GOOGLE_SEARCH_ENGINE_ID`

### Flow Diagram

```
Client Request
    ↓
Rate Limiter (100/hour per IP)
    ↓
Validation (Joi schema)
    ↓
Controller: getSuggestions()
    ↓
Google Custom Search API
    ↓
Parse Results
    ↓
Format Response
    ↓
Return to Client
```

---

## 🔐 Security Features

1. **Rate Limiting**: 100 requests/hour per IP
2. **Input Validation**: Joi schema validation
3. **Query Sanitization**: Trim and length checks
4. **Safe Search**: Enabled on Google API
5. **Error Masking**: Internal errors don't expose sensitive info
6. **Timeout**: 5-second timeout on Google API calls

---

## 🌍 Deployment

### Railway Auto-Deploy

1. **Push to GitHub**:
```bash
git add .
git commit -m "feat: add Instagram search suggestions endpoint"
git push origin main
```

2. **Railway automatically deploys** (3-5 minutes)

3. **Set Environment Variables** in Railway Dashboard:
   - `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`

4. **Test Production Endpoint**:
```bash
curl -X POST https://web-production-7a3f6.up.railway.app/api/search/instagram-suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

---

## 🐛 Troubleshooting

### Issue 1: "Service not configured" error

**Cause**: Environment variables not set  
**Solution**: Add to `.env`:
```env
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyDOKaKfCtgNNsIOtIjl5WOLuf0zorxecN3
GOOGLE_SEARCH_ENGINE_ID=73b19edbe6911411c
```

### Issue 2: Empty suggestions array

**Possible Causes**:
1. No Instagram profiles match query
2. Google API quota exceeded
3. Network timeout

**Solution**: Check logs for Google API response

### Issue 3: Rate limit exceeded

**Cause**: Too many requests from same IP  
**Solution**: Wait 1 hour or use different IP

### Issue 4: 500 error

**Cause**: Google API error or network issue  
**Solution**: Check Railway logs for details

---

## 📝 Logs

### Success Log
```
INFO: Instagram search request { query: 'elonmusk', searchQuery: 'site:instagram.com elonmusk', ip: '127.0.0.1' }
INFO: Instagram search completed { query: 'elonmusk', resultsFound: 1 }
```

### Error Log
```
ERROR: Google Custom Search API error { status: 403, message: 'Quota exceeded', query: 'test' }
```

---

## 🔗 External Dependencies

### Google Custom Search API

**Setup Guide**:
1. Go to: https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable "Custom Search API"
4. Create API credentials (API Key)
5. Go to: https://programmablesearchengine.google.com/
6. Create new search engine
7. Add "instagram.com" as site to search
8. Get Search Engine ID (cx)

**Pricing**:
- First 100 queries/day: FREE
- Additional queries: $5 per 1000 queries

**Documentation**: https://developers.google.com/custom-search/v1/overview

---

## ✅ Testing Checklist

- [ ] Health check returns configured status
- [ ] Valid query returns suggestions
- [ ] Empty query returns 400 error
- [ ] Short query (1 char) returns 400 error
- [ ] Long query (101+ chars) returns 400 error
- [ ] Non-existent user returns empty array
- [ ] Rate limit enforced after 100 requests
- [ ] Environment variables loaded correctly
- [ ] Works on localhost
- [ ] Works on Railway production

---

## 🎯 Next Steps

1. **Deploy to Railway**: Push code to GitHub
2. **Set Environment Variables**: Add Google API credentials
3. **Test Production**: Use production URL
4. **Integrate in App**: Update Flutter/React app
5. **Monitor Usage**: Check Google API quota

---

## 📞 Support

**Google API Issues**: https://support.google.com/  
**Railway Issues**: https://railway.app/help  
**Backend Issues**: Check Railway logs

---

**Created**: 2024-01-XX  
**Version**: 1.0.0  
**Status**: ✅ Ready for Production
