# 🚀 RAILWAY DEPLOYMENT - QUICK REFERENCE

## 📍 YOUR DEPLOYMENT

```
Production URL: https://deeptrustgfbfbackend-production.up.railway.app
Status: 🔴 502 Bad Gateway (Needs Fix)
```

---

## ⚡ QUICK FIX STEPS

### 1. Go to Railway Dashboard
```
https://railway.app/dashboard
→ Select: deeptrustgfbfbackend-production
→ Click: Variables tab
```

### 2. Add These Variables (Copy-Paste)

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://thenitinchouhan01_db_user:YZtfPaeac8rzxs2I@cluster0.pk8jlko.mongodb.net/deepshearch?appName=Cluster0
R2_BUCKET_NAME=deepsharch
R2_ACCOUNT_ID=a37ed06a683c771cea2564dafe3453a1
R2_ENDPOINT=https://a37ed06a683c771cea2564dafe3453a1.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=6de93966bea1fb0220784f1630bae4d6
R2_SECRET_ACCESS_KEY=9213f9707917d8e434d1c88fc75ae1cc359c8e64dfa56e3f42c320512700c7cf
R2_REGION=auto
RAZORPAY_KEY_ID=rzp_live_SguG8PGSDWC5eP
RAZORPAY_KEY_SECRET=6F4KzbjEfgi8XwG27yRnH0aO
SERPER_API_KEY=a271debd0f2da19114bf019eb7519b8ed4f1bba2
GOOGLE_VISION_API_KEY=AIzaSyBFQZwvagGfxv9ADCsZ9fiJWGn9C2E7K1M
OPENROUTER_API_KEY=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
CORS_ORIGIN=*
```

### 3. Wait for Auto-Redeploy
```
Railway will automatically redeploy after adding variables
Wait 2-3 minutes
```

### 4. Check Logs
```
Railway Dashboard → Deployments → Latest → View Logs

Look for:
✅ "DeepTrust API Server Started"
✅ "MongoDB connection established"
```

---

## 🧪 QUICK TEST (After Fix)

### Test 1: Health Check
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

**Expected:**
```json
{"success":true,"message":"DeepTrust API is running"}
```

### Test 2: Get Plans
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

**Expected:**
```json
{"success":true,"data":{"plans":[...]}}
```

---

## 📱 UPDATE FLUTTER APP

```dart
// Change this:
static const String baseUrl = 'http://localhost:3000';

// To this:
static const String baseUrl = 'https://deeptrustgfbfbackend-production.up.railway.app';
```

---

## 📦 POSTMAN TESTING

### Import Collection:
```
File: DeepTrust_Railway_Production.postman_collection.json
Location: d:\deepsreach\
```

### Test Sequence:
```
1. Health Check ✅
2. Create User → Save appUserId
3. Get Plans → Save planId
4. Upload Image → Save imageId
5. Create Search (Name)
6. Create Search (Image)
7. Get Results
```

---

## 🐛 COMMON ISSUES

### Issue: 502 Bad Gateway
**Fix:** Add all environment variables in Railway

### Issue: MongoDB Connection Failed
**Fix:** Check MONGODB_URI is correct

### Issue: CORS Error
**Fix:** Set CORS_ORIGIN=* in Railway

### Issue: Image Upload Fails
**Fix:** Verify all R2_* variables are set

---

## 📊 MONITORING

### Check Logs:
```
Railway Dashboard → Deployments → View Logs
```

### Watch For:
- ✅ Server started successfully
- ✅ MongoDB connected
- ❌ Any error messages
- ⚠️ Warning messages

---

## 📞 NEED HELP?

### Share These:
1. Railway logs (last 50 lines)
2. Environment variables list (without secrets)
3. Specific error message
4. Request/response examples

---

## ✅ SUCCESS CHECKLIST

```
□ All environment variables added in Railway
□ Deployment successful (no errors in logs)
□ Health endpoint returns 200 OK
□ Plans endpoint returns data
□ User creation works
□ Image upload works
□ Search creation works
□ Flutter app connected to Railway URL
```

---

## 🎯 NEXT STEPS

1. **Fix Railway Deployment**
   - Add environment variables
   - Wait for redeploy
   - Check logs

2. **Test All Endpoints**
   - Use Postman collection
   - Test each endpoint
   - Verify responses

3. **Update Flutter App**
   - Change base URL
   - Test all features
   - Deploy to production

---

## 📚 DETAILED GUIDES

- **Full Guide:** `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Postman Collection:** `DeepTrust_Railway_Production.postman_collection.json`
- **Local Testing:** `DeepTrust_API_Tests.postman_collection.json`

---

**Good luck! 🚀**
