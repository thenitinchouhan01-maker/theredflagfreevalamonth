# 🚂 RAILWAY DEPLOYMENT & TESTING GUIDE

## 🔴 CURRENT STATUS: 502 Bad Gateway Error

Your backend is deployed but not responding. Follow this guide to fix and test.

---

## 📋 DEPLOYMENT URL

```
Production: https://deeptrustgfbfbackend-production.up.railway.app
```

---

## 🔧 STEP 1: FIX RAILWAY DEPLOYMENT

### **A. Check Railway Logs**

1. Go to: https://railway.app/dashboard
2. Select your project: `deeptrustgfbfbackend-production`
3. Click on "Deployments" tab
4. Click on latest deployment
5. Click "View Logs"

**Look for these errors:**
- ❌ `Missing required environment variables`
- ❌ `MongoDB connection failed`
- ❌ `EADDRINUSE` (port already in use)
- ❌ `Module not found`

---

### **B. Set Environment Variables**

Go to: Railway Dashboard → Your Project → Variables

**Add these variables:**

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRITICAL: Required Variables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://thenitinchouhan01_db_user:YZtfPaeac8rzxs2I@cluster0.pk8jlko.mongodb.net/deepshearch?appName=Cluster0

# Cloudflare R2 Storage
R2_BUCKET_NAME=deepsharch
R2_ACCOUNT_ID=a37ed06a683c771cea2564dafe3453a1
R2_ENDPOINT=https://a37ed06a683c771cea2564dafe3453a1.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=6de93966bea1fb0220784f1630bae4d6
R2_SECRET_ACCESS_KEY=9213f9707917d8e434d1c88fc75ae1cc359c8e64dfa56e3f42c320512700c7cf
R2_REGION=auto

# Razorpay Payment Gateway (LIVE)
RAZORPAY_KEY_ID=rzp_live_SguG8PGSDWC5eP
RAZORPAY_KEY_SECRET=6F4KzbjEfgi8XwG27yRnH0aO

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPTIONAL: Provider API Keys (for search functionality)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERPER_API_KEY=a271debd0f2da19114bf019eb7519b8ed4f1bba2
GOOGLE_VISION_API_KEY=AIzaSyBFQZwvagGfxv9ADCsZ9fiJWGn9C2E7K1M
OPENROUTER_API_KEY=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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPTIONAL: Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ IMPORTANT:** 
- Railway automatically provides `PORT` variable - DON'T set it manually
- After adding variables, Railway will auto-redeploy

---

### **C. Verify Deployment**

After redeploy, check logs again:

**✅ Success indicators:**
```
✅ All required environment variables are set
✅ MongoDB connection established
✅ DeepTrust API Server Started
✅ Port: 3000
```

**❌ Still failing? Check:**
- MongoDB URI is correct
- No typos in environment variables
- All credentials are valid

---

## 🧪 STEP 2: TEST RAILWAY DEPLOYMENT

### **Method 1: Using Postman**

#### **Update Postman Environment:**

```
Variable: base_url
Value: https://deeptrustgfbfbackend-production.up.railway.app
```

#### **Test Sequence:**

```
1. Health Check
   GET https://deeptrustgfbfbackend-production.up.railway.app/api/health
   
2. Create User
   POST https://deeptrustgfbfbackend-production.up.railway.app/api/users
   
3. Get Plans
   GET https://deeptrustgfbfbackend-production.up.railway.app/api/plans
   
... and so on
```

---

### **Method 2: Using cURL (Command Line)**

#### **1. Health Check**

```bash
curl -X GET https://deeptrustgfbfbackend-production.up.railway.app/api/health
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

#### **2. Create User**

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-railway-001",
    "deviceInfo": {
      "platform": "iOS",
      "version": "17.0",
      "model": "iPhone 15"
    }
  }'
```

**Save the `appUserId` from response!**

---

#### **3. Get Current User**

```bash
curl -X GET https://deeptrustgfbfbackend-production.up.railway.app/api/users/me \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

Replace `DTX-XXXX-XXXX` with your actual appUserId.

---

#### **4. Get Plans**

```bash
curl -X GET https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

---

#### **5. Upload Image**

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/uploads \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -F "image=@/path/to/your/image.jpg"
```

**Save the `imageId` from response!**

---

#### **6. Create Search (Name)**

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "name",
    "nameQuery": "John Doe"
  }'
```

---

#### **7. Create Search (Image)**

```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/searches \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{
    "searchType": "photo",
    "imageId": "YOUR_IMAGE_ID_HERE"
  }'
```

---

### **Method 3: Using Browser (Simple GET requests)**

Open these URLs in browser:

```
1. Health Check:
   https://deeptrustgfbfbackend-production.up.railway.app/api/health

2. Get Plans:
   https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

---

## 📱 STEP 3: UPDATE FLUTTER APP

### **Update API Base URL in Flutter:**

```dart
// lib/config/api_config.dart or wherever you have base URL

class ApiConfig {
  // ❌ OLD (Local)
  // static const String baseUrl = 'http://localhost:3000';
  
  // ✅ NEW (Railway Production)
  static const String baseUrl = 'https://deeptrustgfbfbackend-production.up.railway.app';
}
```

### **Test Flutter App:**

```dart
// Test health endpoint
final response = await dio.get('$baseUrl/api/health');
print(response.data);

// Should print:
// {success: true, message: DeepTrust API is running, ...}
```

---

## 🔍 STEP 4: VERIFY ALL ENDPOINTS

### **Checklist:**

```
□ Health Check (/api/health)
□ Create User (/api/users)
□ Get Current User (/api/users/me)
□ Get Plans (/api/plans)
□ Create Payment Order (/api/payments/order)
□ Upload Image (/api/uploads)
□ Create Search - Name (/api/searches)
□ Create Search - Image (/api/searches)
□ Get Search Status (/api/searches/:id/status)
□ Get Search Results (/api/results/search/:id)
□ Get User Stats (/api/users/me/stats)
```

---

## 🐛 TROUBLESHOOTING

### **Issue 1: 502 Bad Gateway**

**Causes:**
- Server not started
- Environment variables missing
- MongoDB connection failed

**Fix:**
1. Check Railway logs
2. Verify all environment variables
3. Redeploy if needed

---

### **Issue 2: CORS Error (from Flutter)**

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix:**
Set in Railway variables:
```
CORS_ORIGIN=*
```

Or specific origins:
```
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
```

---

### **Issue 3: MongoDB Connection Failed**

**Error in logs:**
```
MongoServerError: Authentication failed
```

**Fix:**
1. Check MongoDB Atlas dashboard
2. Verify username/password in MONGODB_URI
3. Check IP whitelist (allow 0.0.0.0/0 for Railway)

---

### **Issue 4: Razorpay Payment Fails**

**Error:**
```
ORDER_CREATE_FAILED
```

**Fix:**
1. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
2. Check Razorpay dashboard for API status
3. Ensure using LIVE keys (rzp_live_...)

---

### **Issue 5: Image Upload Fails**

**Error:**
```
STORAGE_NOT_CONFIGURED
```

**Fix:**
1. Verify all R2 environment variables
2. Check Cloudflare R2 bucket exists
3. Verify R2 API keys are valid

---

## 📊 MONITORING

### **Railway Dashboard:**

Monitor these metrics:
- CPU usage
- Memory usage
- Request count
- Error rate
- Response time

### **Logs:**

Watch for:
- ✅ Successful requests
- ❌ Error messages
- ⚠️ Warnings
- 🔍 Search processing logs

---

## 🎯 QUICK TEST SCRIPT

Save this as `test-railway.sh`:

```bash
#!/bin/bash

BASE_URL="https://deeptrustgfbfbackend-production.up.railway.app"

echo "🧪 Testing Railway Deployment..."
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
curl -s "$BASE_URL/api/health" | jq
echo ""

# Test 2: Get Plans
echo "2️⃣ Get Plans..."
curl -s "$BASE_URL/api/plans" | jq
echo ""

# Test 3: Create User
echo "3️⃣ Create User..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}')
echo $RESPONSE | jq
APP_USER_ID=$(echo $RESPONSE | jq -r '.data.user.appUserId')
echo "Saved appUserId: $APP_USER_ID"
echo ""

# Test 4: Get Current User
echo "4️⃣ Get Current User..."
curl -s "$BASE_URL/api/users/me" \
  -H "x-app-user-id: $APP_USER_ID" | jq
echo ""

echo "✅ Basic tests complete!"
```

Run with:
```bash
chmod +x test-railway.sh
./test-railway.sh
```

---

## 📝 POSTMAN COLLECTION (Railway)

Import the Postman collection and update environment:

```json
{
  "base_url": "https://deeptrustgfbfbackend-production.up.railway.app",
  "app_user_id": "",
  "image_id": "",
  "search_id": "",
  "plan_id": ""
}
```

---

## ✅ SUCCESS CHECKLIST

```
□ Railway deployment successful (no 502 error)
□ All environment variables set
□ Health endpoint responding
□ MongoDB connected
□ User creation working
□ Plans endpoint working
□ Image upload working
□ Search creation working
□ Payment order creation working
□ Flutter app connected to Railway URL
□ All API endpoints tested
```

---

## 🚀 NEXT STEPS

1. **Fix 502 Error:**
   - Add all environment variables in Railway
   - Wait for auto-redeploy
   - Check logs for success

2. **Test Endpoints:**
   - Use Postman collection
   - Test each endpoint manually
   - Verify responses

3. **Update Flutter:**
   - Change base URL to Railway
   - Test all features
   - Deploy to production

4. **Monitor:**
   - Watch Railway logs
   - Check error rates
   - Monitor performance

---

## 📞 SUPPORT

If still facing issues:

1. Share Railway logs (last 100 lines)
2. Share environment variables (without secrets)
3. Share specific error messages
4. Share request/response examples

---

**Good luck! 🎉**
