# DeepTrust Backend

A production-grade backend for a paid anonymous mobile app that allows public-profile discovery and report generation.

**Production URL**: `https://web-production-8e7d28.up.railway.app`

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Payment**: Razorpay (optional)
- **Image Storage**: Cloudflare R2 (S3-compatible)
- **Validation**: Joi

---

## Project Structure

```
deeptrust-backend/
├── config/          # DB + env config
├── controllers/     # Route handlers
├── middlewares/     # Auth, error, rate-limit, validate
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── scripts/         # seedPlans.js, test-local.js
├── services/        # Business logic
├── utils/           # ApiResponse, AppError, asyncHandler, logger
├── validators/      # Joi schemas
├── app.js
├── server.js
└── .env
```

---

## Installation

```bash
npm install
cp .env.example .env   # fill in your keys
npm run seed           # seed the 3 default plans
npm run dev            # start with nodemon
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| NODE_ENV | Environment | development |
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB Atlas URI | mongodb://localhost:27017/deeptrust |
| R2_BUCKET_NAME | Cloudflare R2 bucket name | — |
| R2_ACCOUNT_ID | Cloudflare account ID | — |
| R2_ENDPOINT | R2 endpoint URL | — |
| R2_ACCESS_KEY_ID | R2 API access key | — |
| R2_SECRET_ACCESS_KEY | R2 API secret key | — |
| R2_REGION | R2 region | auto |
| R2_PUBLIC_URL | R2 public domain (optional) | — |
| RAZORPAY_KEY_ID | Razorpay Key ID (optional) | — |
| RAZORPAY_KEY_SECRET | Razorpay Key Secret (optional) | — |
| RAZORPAY_WEBHOOK_SECRET | Webhook Secret (optional) | — |
| CORS_ORIGIN | Allowed origins (comma-sep) | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window ms | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error",
  "errorCode": "MACHINE_READABLE_CODE",
  "details": [ ... ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication

All protected routes require the header:
```
x-app-user-id: DTX-XXXX-XXXX
```

If missing, the server auto-creates a new anonymous user.  
If provided but not found, returns `401 USER_NOT_FOUND`.

---

## API Contract

### Health Check

#### `GET /api/health`
No headers required.

**Success 200**
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

### Users

#### `POST /api/users` — Create anonymous user
**Body** (all optional)
```json
{
  "deviceId": "unique-device-id",
  "deviceInfo": {
    "platform": "iOS",
    "version": "17.0",
    "manufacturer": "Apple",
    "model": "iPhone 15"
  }
}
```

**Success 201**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "appUserId": "DTX-X8D6-YVIR",
      "deviceId": "unique-device-id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "access": {
      "hasAccess": false,
      "isActive": false,
      "expiresAt": null,
      "remainingDays": 0,
      "remainingHours": 0,
      "plan": null
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `POST /api/users/restore` — Restore user by appUserId
**Body**
```json
{
  "appUserId": "DTX-X8D6-YVIR",
  "deviceId": "new-device-id"
}
```

**Success 200**
```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "appUserId": "DTX-X8D6-YVIR",
      "deviceId": "new-device-id",
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "access": { "hasAccess": false, "plan": null },
    "stats": { "searches": 0, "payments": 0, "reports": 0 }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 422** (invalid format)
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": [{ "field": "appUserId", "message": "Invalid appUserId format. Expected format: DTX-XXXX-XXXX" }],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/users/me` — Get current user
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

**Success 200**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "appUserId": "DTX-X8D6-YVIR",
      "deviceId": "unique-device-id",
      "deviceInfo": { "platform": "iOS", "model": "iPhone 15" },
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "access": { "hasAccess": false, "plan": null },
    "stats": { "searches": 2, "payments": 1, "reports": 1 }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 401**
```json
{
  "success": false,
  "message": "User not found. Please create a new user.",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `PATCH /api/users/me` — Update device info
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Body**
```json
{
  "deviceInfo": { "platform": "Android", "version": "14", "model": "Pixel 8" }
}
```

---

#### `GET /api/users/me/stats` — Get user stats
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

### Plans

#### `GET /api/plans` — Get all active plans
No headers required.

**Success 200**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "plans": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d2",
        "name": "1 Day Access",
        "durationDays": 1,
        "price": 119,
        "currency": "INR",
        "formattedPrice": "₹119",
        "durationText": "1 Day",
        "description": "Full access for 24 hours",
        "features": ["Unlimited searches", "Report generation", "Image search"],
        "isPopular": false
      },
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d3",
        "name": "3 Days Access",
        "durationDays": 3,
        "price": 129,
        "currency": "INR",
        "formattedPrice": "₹129",
        "durationText": "3 Days",
        "isPopular": true
      },
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d4",
        "name": "7 Days Access",
        "durationDays": 7,
        "price": 149,
        "currency": "INR",
        "formattedPrice": "₹149",
        "durationText": "7 Days",
        "isPopular": false
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/plans/:planId` — Get plan by ID

---

### Payments

#### `POST /api/payments/order` — Create Razorpay order
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Body**
```json
{ "planId": "64f1a2b3c4d5e6f7a8b9c0d2" }
```

**Success 200**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_ABC123XYZ",
      "amount": 11900,
      "currency": "INR",
      "keyId": "rzp_live_xxxx"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 402**
```json
{
  "success": false,
  "message": "Failed to create payment order",
  "errorCode": "ORDER_CREATE_FAILED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `POST /api/payments/verify` — Verify payment
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Body**
```json
{
  "razorpayOrderId": "order_ABC123XYZ",
  "razorpayPaymentId": "pay_DEF456UVW",
  "razorpaySignature": "abc123signature"
}
```

**Success 200**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d5",
      "status": "paid",
      "amount": 119,
      "currency": "INR",
      "paidAt": "2024-01-01T00:00:00.000Z"
    },
    "access": {
      "hasAccess": true,
      "isActive": true,
      "expiresAt": "2024-01-02T00:00:00.000Z",
      "remainingDays": 1,
      "remainingHours": 24,
      "canSearch": true,
      "plan": { "name": "1 Day Access", "durationDays": 1, "price": 119 }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/payments/history` — Payment history
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Query**: `?page=1&limit=10`

---

#### `GET /api/payments/:paymentId` — Get payment by ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `POST /api/payments/webhook` — Razorpay webhook
No auth. Razorpay sends `x-razorpay-signature` header.

---

### Access

#### `GET /api/access/status` — Check access status
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

**Success 200 (no access)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access": {
      "hasAccess": false,
      "isActive": false,
      "expiresAt": null,
      "remainingDays": 0,
      "remainingHours": 0,
      "plan": null
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Success 200 (active access)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access": {
      "hasAccess": true,
      "isActive": true,
      "expiresAt": "2024-01-04T00:00:00.000Z",
      "remainingDays": 3,
      "remainingHours": 72,
      "searchesUsed": 2,
      "searchesLimit": -1,
      "canSearch": true,
      "plan": { "id": "...", "name": "3 Days Access", "durationDays": 3, "price": 129 }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/access` — Get active access details
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

### Uploads

#### `POST /api/uploads` — Upload image
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Body**: `multipart/form-data` with field `image` (JPEG/PNG/GIF/WebP, max 10MB)

**Success 201**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "upload": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d6",
      "originalName": "photo.jpg",
      "fileUrl": "https://...r2.cloudflarestorage.com/uploads/...",
      "format": "jpg",
      "width": 1024,
      "height": 768,
      "size": "245.3 KB",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 400 (no file)**
```json
{
  "success": false,
  "message": "No image file provided",
  "errorCode": "NO_FILE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 400 (wrong type)**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
  "errorCode": "INVALID_FILE_TYPE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/uploads` — Get user's uploads
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Query**: `?page=1&limit=20`

---

#### `GET /api/uploads/:uploadId` — Get upload by ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `DELETE /api/uploads/:uploadId` — Delete upload
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

### Searches

#### `POST /api/searches` — Create search
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Requires active paid access.**

**Body**
```json
{
  "searchType": "name",
  "nameQuery": "John Doe"
}
```
Valid `searchType` values: `name`, `username`, `photo`, `mixed`  
- `name` → requires `nameQuery`  
- `username` → requires `usernameQuery`  
- `photo` → requires `imageId`  
- `mixed` → requires `nameQuery` + `usernameQuery`

**Success 201**
```json
{
  "success": true,
  "message": "Search created successfully",
  "data": {
    "search": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d7",
      "searchType": "name",
      "nameQuery": "John Doe",
      "usernameQuery": null,
      "imageId": null,
      "status": "pending",
      "progress": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error 403 (no access)**
```json
{
  "success": false,
  "message": "Active access plan required to perform searches",
  "errorCode": "NO_ACTIVE_ACCESS",
  "details": { "requiresPayment": true },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/searches` — Get user's searches
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Query**: `?page=1&limit=20&status=completed`

---

#### `GET /api/searches/:searchId` — Get search by ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `GET /api/searches/:searchId/status` — Get search status
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

### Results

#### `GET /api/results/search/:searchId` — Get result by search ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

**Success 200 (still processing)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "processing",
    "progress": 50,
    "message": "Search is still in progress"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Success 200 (complete)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "result": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d8",
      "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
      "summary": {
        "totalProfilesFound": 2,
        "totalImageMatches": 0,
        "platformsSearched": ["google", "bing", "social_media", "public_records"],
        "platformsWithResults": ["LinkedIn", "Twitter"],
        "overallConfidence": 75,
        "summaryText": "Found 2 potential profile(s) matching your search."
      },
      "matchedProfiles": [
        {
          "platform": "LinkedIn",
          "username": "johndoe",
          "profileUrl": "https://linkedin.com/johndoe",
          "displayName": "John Doe",
          "followers": 500,
          "isVerified": false,
          "confidence": 82
        }
      ],
      "imageMatches": [],
      "flags": [],
      "hasResults": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/results` — Get user's results
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `GET /api/results/:resultId` — Get result by ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

### Reports

#### `POST /api/reports` — Create report from result
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Body**
```json
{ "resultId": "64f1a2b3c4d5e6f7a8b9c0d8" }
```

**Success 201**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "report": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d9",
      "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
      "resultId": "64f1a2b3c4d5e6f7a8b9c0d8",
      "version": "1.0.0",
      "format": "json",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/reports` — Get user's reports
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`  
**Query**: `?page=1&limit=20&includeArchived=false`

**Success 200**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "reports": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d9",
        "searchId": "64f1a2b3c4d5e6f7a8b9c0d7",
        "search": {
          "id": "64f1a2b3c4d5e6f7a8b9c0d7",
          "searchType": "name",
          "nameQuery": "John Doe",
          "status": "completed",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "version": "1.0.0",
        "format": "json",
        "isDownloaded": false,
        "downloadCount": 0,
        "isArchived": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/reports/search/:searchId` — Get report by search ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `GET /api/reports/:reportId` — Get report by ID
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `GET /api/reports/:reportId/data` — Get full report JSON
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `POST /api/reports/:reportId/download` — Mark as downloaded
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

#### `POST /api/reports/:reportId/archive` — Archive report
**Headers**: `x-app-user-id: DTX-XXXX-XXXX`

---

## Error Codes Reference

| Code | HTTP | Meaning |
|---|---|---|
| USER_NOT_FOUND | 401 | x-app-user-id not found in DB |
| VALIDATION_ERROR | 422 | Request body/params failed validation |
| NO_ACTIVE_ACCESS | 403 | User has no paid active plan |
| ACCESS_EXPIRED | 403 | Plan expired or search limit reached |
| PLAN_NOT_FOUND | 404 | planId does not exist |
| PLAN_INACTIVE | 400 | Plan exists but is deactivated |
| ORDER_CREATE_FAILED | 402 | Razorpay order creation failed |
| INVALID_SIGNATURE | 401 | Razorpay payment signature mismatch |
| PAYMENT_NOT_FOUND | 404 | Payment record not found |
| SEARCH_NOT_FOUND | 404 | Search not found or not owned by user |
| RESULT_NOT_FOUND | 404 | Result not ready or not found |
| REPORT_NOT_FOUND | 404 | Report not found |
| UPLOAD_NOT_FOUND | 404 | Upload not found |
| NO_FILE | 400 | No image file in upload request |
| INVALID_FILE_TYPE | 400 | File type not allowed |
| ROUTE_NOT_FOUND | 404 | Endpoint does not exist |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Local Testing

### Run automated tests (no MongoDB install needed)
```bash
node scripts/test-local.js
```

This spins up an in-memory MongoDB, seeds plans, starts the server on port 3099, and runs 12 endpoint tests.

### Manual curl test order

```bash
BASE=http://localhost:3000/api

# 1. Health check
curl $BASE/health

# 2. Create user
curl -X POST $BASE/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"my-device-001","deviceInfo":{"platform":"iOS","model":"iPhone 15"}}'
# → save appUserId from response

APP_USER_ID="DTX-XXXX-XXXX"

# 3. Get current user
curl $BASE/users/me -H "x-app-user-id: $APP_USER_ID"

# 4. Get plans
curl $BASE/plans
# → save a planId

PLAN_ID="64f1a2b3c4d5e6f7a8b9c0d2"

# 5. Check access status
curl $BASE/access/status -H "x-app-user-id: $APP_USER_ID"

# 6. Create payment order
curl -X POST $BASE/payments/order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: $APP_USER_ID" \
  -d "{\"planId\":\"$PLAN_ID\"}"

# 7. Try search without access (expect 403)
curl -X POST $BASE/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: $APP_USER_ID" \
  -d '{"searchType":"name","nameQuery":"John Doe"}'

# 8. Upload image (requires Cloudinary configured)
curl -X POST $BASE/uploads \
  -H "x-app-user-id: $APP_USER_ID" \
  -F "image=@/path/to/photo.jpg"

# 9. Get report history
curl $BASE/reports -H "x-app-user-id: $APP_USER_ID"

# 10. Restore user on new device
curl -X POST $BASE/users/restore \
  -H "Content-Type: application/json" \
  -d "{\"appUserId\":\"$APP_USER_ID\",\"deviceId\":\"new-device-002\"}"
```

---

## Security Features

- Helmet HTTP headers
- CORS with configurable origins
- Rate limiting (global + per-route)
- Joi request validation
- HPP (HTTP Parameter Pollution) protection
- Response compression

---

## Search Pipeline Architecture

**Status: ✅ PRODUCTION-READY ARCHITECTURE (Placeholder Providers)**

The search processing system uses a real, modular pipeline architecture:

- **Input Normalization** - Validates and normalizes search queries
- **Provider Abstraction** - Pluggable interfaces for external APIs
- **Match Aggregation** - Deduplicates and scores results
- **Flag Generation** - Creates structured, explainable flags
- **Report Building** - Formats deterministic reports

**Current State:**
- ✅ Full pipeline architecture implemented
- 🔌 Placeholder providers (return empty results, no fake data)
- 📋 Ready for real API integrations

**See [SEARCH_PIPELINE_ARCHITECTURE.md](./SEARCH_PIPELINE_ARCHITECTURE.md) for:**
- Complete architecture documentation
- Provider integration guide
- API response examples
- How to add real providers

---

## Limitations / Implementation Status

- **Search processing** uses real pipeline architecture with placeholder providers (returns empty results, no fake data). Ready for real API integration - see SEARCH_PIPELINE_ARCHITECTURE.md.
- **Cloudflare R2 upload** fully integrated and working with real credentials.
- **MongoDB Atlas** connected and storing data.
- **Razorpay** optional - returns safe error `PAYMENT_NOT_AVAILABLE` if credentials not configured.
- **Payment webhook** signature verification is skipped if `RAZORPAY_WEBHOOK_SECRET` is empty.
- No admin panel or admin-only routes exposed.

---

## Testing

### Start Server
```bash
npm run dev
```

### Run Integration Tests (in separate terminal)
```bash
npm run test:api
```

Tests verify:
- Health check
- User creation and management
- Plans retrieval
- Access control
- R2 image upload/delete
- Payment error handling (when not configured)
- Search access blocking

**See [R2_INTEGRATION_COMPLETE.md](./R2_INTEGRATION_COMPLETE.md) for full testing details.**

---

## License

PRIVATE — All rights reserved
