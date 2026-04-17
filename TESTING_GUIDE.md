# 🧪 STEP-BY-STEP TESTING GUIDE

This guide walks you through testing all the fixes manually.

---

## 🚀 PREREQUISITES

1. **MongoDB Running**: Ensure MongoDB Atlas is connected or local MongoDB is running
2. **Server Started**: Run `npm run dev`
3. **Plans Seeded**: Run `npm run seed` if not already done
4. **Terminal Ready**: Have 2 terminals open (one for server, one for testing)

---

## 📋 TEST SEQUENCE

### TEST 1: Health Check ✅

**Purpose**: Verify server is running

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "timestamp": "2024-...",
  "environment": "development"
}
```

**Console Output**: None (no logging for health check)

---

### TEST 2: Create User ✅

**Purpose**: Create a new anonymous user

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-001",
    "deviceInfo": {
      "platform": "iOS",
      "model": "iPhone 15"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "...",
      "appUserId": "DTX-XXXX-XXXX",
      "deviceId": "test-device-001",
      "createdAt": "2024-..."
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
  "timestamp": "2024-..."
}
```

**Console Output**:
```
✅ [IDENTIFY USER] New user created: { id: '...', appUserId: 'DTX-XXXX-XXXX' }
```

**Action**: Save the `appUserId` (e.g., `DTX-X8D6-YVIR`) for next tests

---

### TEST 3: Get User Info ✅

**Purpose**: Verify user exists and has no access

```bash
# Replace DTX-XXXX-XXXX with your actual appUserId
curl http://localhost:3000/api/users/me \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "...",
      "appUserId": "DTX-XXXX-XXXX",
      "deviceId": "test-device-001",
      "deviceInfo": { "platform": "iOS", "model": "iPhone 15" },
      "lastActiveAt": "2024-...",
      "createdAt": "2024-..."
    },
    "access": {
      "hasAccess": false,
      "isActive": false,
      "expiresAt": null,
      "remainingDays": 0,
      "remainingHours": 0,
      "plan": null
    },
    "stats": {
      "searches": 0,
      "payments": 0,
      "reports": 0
    }
  }
}
```

**Console Output**:
```
👤 [IDENTIFY USER] Headers: { appUserId: 'DTX-XXXX-XXXX', deviceId: 'none', hasDeviceInfo: false }
👤 [IDENTIFY USER] Lookup by appUserId: { appUserId: 'DTX-XXXX-XXXX', found: true }
✅ [IDENTIFY USER] User identified: { id: '...', appUserId: 'DTX-XXXX-XXXX' }
```

---

### TEST 4: Get Plans ✅

**Purpose**: Get available plans and save a planId

```bash
curl http://localhost:3000/api/plans
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "plans": [
      {
        "id": "...",
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
      // ... more plans
    ]
  }
}
```

**Action**: Save a `planId` from the response (e.g., first plan's `id`)

---

### TEST 5: Check Access Status (No Access) ✅

**Purpose**: Confirm user has no access

```bash
curl http://localhost:3000/api/access/status \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response**:
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
  }
}
```

---

### TEST 6: Try Search WITHOUT Access (Should Fail) ❌ → ✅

**Purpose**: Verify access control is working

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "name",
    "nameQuery": "John Doe"
  }'
```

**Expected Response** (403 Error):
```json
{
  "success": false,
  "message": "You need an active access plan to perform searches",
  "errorCode": "NO_ACTIVE_ACCESS",
  "timestamp": "2024-..."
}
```

**Console Output**:
```
👤 [IDENTIFY USER] Headers: { appUserId: 'DTX-XXXX-XXXX', deviceId: 'none', hasDeviceInfo: false }
👤 [IDENTIFY USER] Lookup by appUserId: { appUserId: 'DTX-XXXX-XXXX', found: true }
✅ [IDENTIFY USER] User identified: { id: '...', appUserId: 'DTX-XXXX-XXXX' }

🔍 [ACCESS CHECK] Starting access verification
🔍 [ACCESS CHECK] User ID: ...
🔍 [ACCESS CHECK] User Object: { id: '...', appUserId: 'DTX-XXXX-XXXX' }
🔍 [ACCESS CHECK] Access query result: false
❌ [ACCESS CHECK] No access record found in database
```

**Result**: ✅ This is CORRECT behavior - user should be blocked

---

### TEST 7: Manually Grant Access in MongoDB 🔧

**Purpose**: Give the user access so we can test successful search creation

**Option A: Using MongoDB Compass**

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `access` collection
4. Click "Insert Document"
5. Paste this JSON (replace `USER_ID` and `PLAN_ID` with actual ObjectIds):

```json
{
  "userId": {"$oid": "USER_ID_HERE"},
  "planId": {"$oid": "PLAN_ID_HERE"},
  "paymentId": {"$oid": "000000000000000000000000"},
  "startsAt": {"$date": "2024-01-01T00:00:00.000Z"},
  "expiresAt": {"$date": "2024-12-31T23:59:59.999Z"},
  "isActive": true,
  "searchesUsed": 0,
  "searchesLimit": -1,
  "createdAt": {"$date": "2024-01-01T00:00:00.000Z"},
  "updatedAt": {"$date": "2024-01-01T00:00:00.000Z"}
}
```

**Option B: Using MongoDB Shell**

```javascript
// Connect to MongoDB
mongosh "YOUR_MONGODB_URI"

// Switch to your database
use deeptrust

// Get user ID
const user = db.users.findOne({ appUserId: "DTX-XXXX-XXXX" })
console.log("User ID:", user._id)

// Get plan ID
const plan = db.plans.findOne({ name: "1 Day Access" })
console.log("Plan ID:", plan._id)

// Create access
db.access.insertOne({
  userId: user._id,
  planId: plan._id,
  paymentId: ObjectId("000000000000000000000000"),
  startsAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  isActive: true,
  searchesUsed: 0,
  searchesLimit: -1,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option C: Using Node.js Script**

```javascript
// Create file: scripts/grant-access.js
const mongoose = require('mongoose');
require('dotenv').config();

async function grantAccess() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const appUserId = 'DTX-XXXX-XXXX'; // Replace with your appUserId
  
  const User = mongoose.model('User', new mongoose.Schema({ appUserId: String }));
  const Plan = mongoose.model('Plan', new mongoose.Schema({ name: String }));
  const Access = mongoose.model('Access', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    planId: mongoose.Schema.Types.ObjectId,
    paymentId: mongoose.Schema.Types.ObjectId,
    startsAt: Date,
    expiresAt: Date,
    isActive: Boolean,
    searchesUsed: Number,
    searchesLimit: Number
  }));
  
  const user = await User.findOne({ appUserId });
  const plan = await Plan.findOne({ name: '1 Day Access' });
  
  await Access.create({
    userId: user._id,
    planId: plan._id,
    paymentId: new mongoose.Types.ObjectId(),
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    searchesUsed: 0,
    searchesLimit: -1
  });
  
  console.log('✅ Access granted!');
  await mongoose.connection.close();
}

grantAccess();
```

Run: `node scripts/grant-access.js`

---

### TEST 8: Check Access Status (With Access) ✅

**Purpose**: Verify access was granted

```bash
curl http://localhost:3000/api/access/status \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access": {
      "hasAccess": true,
      "isActive": true,
      "expiresAt": "2024-...",
      "remainingDays": 7,
      "remainingHours": 168,
      "searchesUsed": 0,
      "searchesLimit": -1,
      "canSearch": true,
      "plan": {
        "id": "...",
        "name": "1 Day Access",
        "durationDays": 1,
        "price": 119
      }
    }
  }
}
```

**Result**: ✅ User now has active access

---

### TEST 9: Try Search WITH Access (Should Succeed) ✅

**Purpose**: Verify the fix works - users with access can create searches

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "name",
    "nameQuery": "John Doe"
  }'
```

**Expected Response** (201 Success):
```json
{
  "success": true,
  "message": "Search created successfully",
  "data": {
    "search": {
      "id": "...",
      "searchType": "name",
      "nameQuery": "John Doe",
      "usernameQuery": null,
      "imageId": null,
      "status": "pending",
      "progress": 0,
      "createdAt": "2024-..."
    }
  },
  "timestamp": "2024-..."
}
```

**Console Output**:
```
👤 [IDENTIFY USER] Headers: { appUserId: 'DTX-XXXX-XXXX', deviceId: 'none', hasDeviceInfo: false }
👤 [IDENTIFY USER] Lookup by appUserId: { appUserId: 'DTX-XXXX-XXXX', found: true }
✅ [IDENTIFY USER] User identified: { id: '...', appUserId: 'DTX-XXXX-XXXX' }

🔍 [ACCESS CHECK] Starting access verification
🔍 [ACCESS CHECK] User ID: ...
🔍 [ACCESS CHECK] User Object: { id: '...', appUserId: 'DTX-XXXX-XXXX' }
🔍 [ACCESS CHECK] Access query result: true
🔍 [ACCESS CHECK] Access details: {
  id: '...',
  isActive: true,
  expiresAt: 2024-...,
  isExpired: false,
  canSearch: true,
  searchesUsed: 0,
  searchesLimit: -1,
  planId: '...'
}
✅ [ACCESS CHECK] Access granted - user can search

📝 [CREATE SEARCH] Request: {
  userId: '...',
  appUserId: 'DTX-XXXX-XXXX',
  searchType: 'name',
  nameQuery: 'John Doe',
  usernameQuery: undefined,
  imageId: undefined,
  hasAccess: true
}
✅ [CREATE SEARCH] Search created: ...
```

**Result**: 🎉 **SUCCESS!** This is the fix working correctly!

---

### TEST 10: Verify Search Count Incremented ✅

**Purpose**: Verify middleware incremented search count

```bash
curl http://localhost:3000/api/access/status \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access": {
      "hasAccess": true,
      "isActive": true,
      "expiresAt": "2024-...",
      "remainingDays": 7,
      "remainingHours": 168,
      "searchesUsed": 1,  // ✅ Incremented from 0 to 1
      "searchesLimit": -1,
      "canSearch": true,
      "plan": { ... }
    }
  }
}
```

**Result**: ✅ Search count correctly incremented

---

### TEST 11: Test Empty String Validation ❌ → ✅

**Purpose**: Verify empty string validation works

```bash
curl -X POST http://localhost:3000/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "name",
    "nameQuery": "   "
  }'
```

**Expected Response** (422 Validation Error):
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": [
    {
      "field": "nameQuery",
      "message": "Name query cannot be empty or contain only whitespace"
    }
  ],
  "timestamp": "2024-..."
}
```

**Result**: ✅ Empty string validation working

---

### TEST 12: Get User's Searches ✅

**Purpose**: Verify search was saved

```bash
curl http://localhost:3000/api/searches \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "searches": [
      {
        "id": "...",
        "searchType": "name",
        "nameQuery": "John Doe",
        "status": "pending",
        "progress": 0,
        "createdAt": "2024-...",
        "isComplete": false
      }
    ]
  }
}
```

---

## ✅ SUCCESS CRITERIA

All tests should pass with these results:

- [x] Health check returns 200
- [x] User creation returns 201
- [x] User info shows no access initially
- [x] Plans are retrieved successfully
- [x] Search WITHOUT access returns 403
- [x] Access can be granted manually
- [x] Access status shows active access
- [x] Search WITH access returns 201 ✨
- [x] Search count increments correctly
- [x] Empty string validation returns 422
- [x] User's searches can be retrieved
- [x] Console logs show debug output

---

## 🎉 FINAL VERIFICATION

If all tests pass, you should see:

1. **403 Error** when searching without access ✅
2. **201 Success** when searching with access ✅
3. **Debug logs** in console showing the flow ✅
4. **Search count** incrementing correctly ✅
5. **Validation** rejecting empty strings ✅

**Status**: 🚀 Backend is production-ready!

---

## 🐛 TROUBLESHOOTING

### Issue: Still getting 403 with access

**Check**:
1. Access record exists in DB: `db.access.find({ userId: ObjectId("...") })`
2. Access is active: `isActive: true`
3. Access not expired: `expiresAt` is in the future
4. User ID matches: Compare `userId` in access with user's `_id`

### Issue: No console logs appearing

**Check**:
1. Server is running in development mode
2. Console.log statements are present in code
3. Restart server after code changes

### Issue: Validation not working

**Check**:
1. Joi validator updated with pattern
2. Server restarted after changes
3. Request body is correct JSON

---

## 📞 NEED HELP?

If tests fail:
1. Check `COMPLETE_BACKEND_AUDIT.md` for detailed bug analysis
2. Verify all code changes from `FIXES_APPLIED_SUMMARY.md`
3. Check server logs for error messages
4. Verify MongoDB connection and data

---

**Happy Testing! 🧪**
