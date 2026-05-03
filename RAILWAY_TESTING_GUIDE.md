# 🚀 RAILWAY DEPLOYMENT STATUS & TESTING

## 📍 CURRENT STATUS

```
Deployment URL: https://deeptrustgfbfbackend-production.up.railway.app
Last Action: Git push with railway.json update
Status: Redeploying... ⏳
```

---

## ⏰ WAIT TIME REQUIRED

Railway deployment typically takes:

```
Git Push → Railway Detects: 30 seconds
Build Process: 2-3 minutes
Deploy Process: 1-2 minutes
Proxy Initialization: 2-5 minutes
───────────────────────────────────
Total Time: 5-10 minutes
```

**Current Time Since Push:** Check your git push timestamp

**Expected Ready Time:** Push time + 10 minutes

---

## 🔍 HOW TO CHECK RAILWAY STATUS

### **Method 1: Railway Dashboard (BEST)**

```
1. Go to: https://railway.app/dashboard
2. Select: deeptrustgfbfbackend-production
3. Click: Deployments tab
4. Check latest deployment status:
   - 🟡 Building... (wait)
   - 🟡 Deploying... (wait)
   - 🟢 Active (ready to test!)
   - 🔴 Failed (check logs)
```

### **Method 2: Railway Logs**

```
Railway Dashboard → Deployments → Latest → Deploy Logs

Look for:
✅ "DeepTrust API Server Started"
✅ "MongoDB connection established"
✅ "Port: 8080"
```

### **Method 3: Command Line Test**

```bash
# Windows
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health

# Expected when ready:
{"success":true,"message":"DeepTrust API is running"}

# Expected when not ready:
{"status":"error","code":502}
```

---

## 🧪 AUTOMATED TESTING SCRIPT

### **Windows Users:**

```bash
# Run the test script
cd d:\deepsreach
test-railway-apis.bat
```

This script will:
- ✅ Test health endpoint
- ✅ Test all public endpoints
- ✅ Create test user
- ✅ Test authenticated endpoints
- ✅ Guide you through each step

---

## 📋 MANUAL TESTING (Step by Step)

### **STEP 1: Health Check** ⚡

```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

**If 502 Error:** Wait 5 more minutes, Railway still deploying.

---

### **STEP 2: Get Plans** 📦

```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "...",
        "name": "Basic Plan",
        "price": 99,
        "credits": 5
      }
    ]
  }
}
```

---

### **STEP 3: Create User** 👤

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"test-001\",\"deviceInfo\":{\"platform\":\"Windows\"}}"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "appUserId": "DTX-XXXX-XXXX"
    }
  }
}
```

**⚠️ SAVE THE appUserId!** You'll need it for next tests.

---

### **STEP 4: Get Current User** 🔐

```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/users/me \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

Replace `DTX-XXXX-XXXX` with your actual appUserId.

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "appUserId": "DTX-XXXX-XXXX",
      "credits": 0
    }
  }
}
```

---

### **STEP 5: Create Payment Order** 💳

First, get a plan ID from Step 2, then:

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/payments/order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d "{\"planId\":\"PLAN_ID_HERE\"}"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_ABC123",
      "amount": 9900,
      "currency": "INR"
    }
  }
}
```

---

### **STEP 6: Upload Image** 📸

**Note:** This requires a file. Use Postman or this curl command:

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/uploads \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -F "image=@C:\path\to\image.jpg"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "upload": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d6",
      "fileUrl": "https://...r2.cloudflarestorage.com/..."
    }
  }
}
```

---

### **STEP 7: Create Search** 🔍

**Note:** Requires credits. Will fail with 403 if no credits.

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d "{\"searchType\":\"name\",\"nameQuery\":\"Elon Musk\"}"
```

**Expected Response (201 Created) - If user has credits:**
```json
{
  "success": true,
  "data": {
    "search": {
      "id": "...",
      "searchType": "name",
      "status": "pending"
    }
  }
}
```

**Expected Response (403 Forbidden) - If no credits:**
```json
{
  "success": false,
  "message": "Insufficient credits. Please purchase a plan to continue.",
  "errorCode": "INSUFFICIENT_CREDITS"
}
```

---

## 📊 TESTING CHECKLIST

```
□ Health endpoint returns 200 OK
□ Plans endpoint returns data
□ User creation works (201 Created)
□ Get current user works (200 OK)
□ Payment order creation works (200 OK)
□ Image upload works (201 Created)
□ Search creation works (201 or 403)
□ All responses have correct format
□ No 502 errors
□ No 500 errors
```

---

## 🎯 SUCCESS CRITERIA

### **✅ Deployment Successful When:**

```
1. Health check returns 200 OK
2. Plans endpoint returns data
3. User creation works
4. MongoDB operations work
5. Razorpay integration works
6. R2 upload works
7. All endpoints respond (no 502)
```

### **❌ Deployment Failed When:**

```
1. Health check returns 502 after 15 minutes
2. Railway logs show errors
3. MongoDB connection fails
4. Server crashes
```

---

## 🔧 IF TESTS FAIL

### **502 Bad Gateway:**

```
Cause: Railway proxy not ready
Fix: Wait 5-10 more minutes
```

### **401 Unauthorized:**

```
Cause: Missing or invalid x-app-user-id header
Fix: Include correct appUserId in header
```

### **403 Insufficient Credits:**

```
Cause: User has no credits
Fix: Complete payment flow first
```

### **404 Not Found:**

```
Cause: Wrong endpoint URL
Fix: Check URL spelling and path
```

### **500 Internal Server Error:**

```
Cause: Server-side error
Fix: Check Railway logs for error details
```

---

## 📱 POSTMAN TESTING

### **Import Collection:**

```
File: DeepTrust_Railway_Production.postman_collection.json
Location: d:\deepsreach\
```

### **Run Collection:**

```
1. Import collection
2. Check environment variables
3. Run entire collection
4. Review results
```

---

## 🚀 NEXT STEPS AFTER SUCCESSFUL TESTING

### **1. Update Flutter App:**

```dart
static const String baseUrl = 
  'https://deeptrustgfbfbackend-production.up.railway.app';
```

### **2. Test Flutter Integration:**

```
- Health check from Flutter
- User creation from Flutter
- Image upload from Flutter
- Search creation from Flutter
```

### **3. Deploy Flutter App:**

```
- Build release APK/IPA
- Test on real device
- Deploy to Play Store/App Store
```

---

## 📞 NEED HELP?

### **If Railway Not Working After 15 Minutes:**

1. Check Railway status: https://status.railway.app
2. Check Railway logs for errors
3. Try manual redeploy
4. Contact Railway support: https://discord.gg/railway

### **If Specific Endpoint Failing:**

1. Check request format
2. Check headers (x-app-user-id)
3. Check Railway logs
4. Test with Postman
5. Compare with working examples

---

## ⏰ RECOMMENDED WAIT TIME

```
Current Status: Just pushed to git
Recommended: Wait 10 minutes
Then: Run test-railway-apis.bat
If 502: Wait 5 more minutes
If still 502: Check Railway dashboard
```

---

## 🎉 WHEN EVERYTHING WORKS

You'll see:

```
✅ Health: {"success":true}
✅ Plans: {"data":{"plans":[...]}}
✅ User: {"data":{"user":{"appUserId":"DTX-..."}}}
✅ All endpoints responding
✅ No 502 errors
✅ MongoDB connected
✅ Razorpay working
✅ R2 uploads working
```

**Then you're ready for production! 🚀**

---

**Current Action: Wait 10 minutes from your git push time, then run tests!**
