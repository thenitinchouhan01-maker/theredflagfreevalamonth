# 🐛 Payment Order Creation - Debug Guide

## 🚨 Issue: "Failed to create payment order"

### What Was Added

I've added **comprehensive debug logging** to track exactly where the order creation fails.

---

## 🔍 Debug Logs Added

### 1. **Startup Logs** (When server starts)
```
🔍 [RAZORPAY DEBUG] Checking credentials...
KEY_ID: rzp_live_SgSAV... (or ❌ MISSING)
KEY_SECRET EXISTS: ✅ YES (or ❌ NO)
KEY_SECRET LENGTH: 24
```

### 2. **Instance Creation Logs**
```
🔧 [RAZORPAY] Creating Razorpay instance...
✅ [RAZORPAY] Credentials found, creating instance...
✅ [RAZORPAY] Instance created successfully
```

### 3. **Order Creation Logs** (Step-by-step)
```
💳 [CREATE ORDER] Starting...
User ID: 64f1a2b3c4d5e6f7a8b9c0d1
Plan ID: 64f1a2b3c4d5e6f7a8b9c0d2

🔍 [CREATE ORDER] Fetching plan from database...
✅ [CREATE ORDER] Plan found: { name: '3 Searches Pack', price: 129, credits: 3 }

🔧 [CREATE ORDER] Getting Razorpay instance...
✅ [RAZORPAY] Instance created successfully

💵 [CREATE ORDER] Amount: 129 INR = 12900 paise

🚀 [CREATE ORDER] Calling Razorpay API...
📦 [CREATE ORDER] Order data: { amount: 12900, currency: 'INR', ... }

✅ [CREATE ORDER] Razorpay order created: order_ABC123XYZ
💾 [CREATE ORDER] Saving payment record...
✅ [CREATE ORDER] Payment record saved: 64f...

✅ [CREATE ORDER] Success! Returning response: { orderId: "order_...", ... }
```

### 4. **Error Logs** (If something fails)
```
🚨 [CREATE ORDER ERROR] ===================================
Error Type: Error
Error Message: Bad Request
Error Code: BAD_REQUEST_ERROR
Error Stack: ...
Razorpay Error Details: { ... }
===================================================
```

---

## 🔧 How to Debug

### Step 1: Check Server Logs on Startup

When you start the server, you should see:
```bash
npm run dev
```

Look for:
```
🔍 [RAZORPAY DEBUG] Checking credentials...
KEY_ID: rzp_live_SgSAV...
KEY_SECRET EXISTS: ✅ YES
```

**If you see `❌ MISSING`:**
- Your `.env` file is not loaded
- Credentials are not set correctly

---

### Step 2: Test Create Order API

```bash
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"planId":"YOUR_PLAN_ID"}'
```

**Watch the console logs** - they will show exactly where it fails.

---

## 🚨 Common Issues & Solutions

### Issue 1: Credentials Not Loaded

**Symptoms:**
```
❌ [RAZORPAY ERROR] Credentials missing!
KEY_ID: MISSING
KEY_SECRET: MISSING
```

**Solution:**
1. Check `.env` file exists in project root
2. Verify credentials are set:
   ```env
   RAZORPAY_KEY_ID=rzp_live_SgSAVW2XMCb0la
   RAZORPAY_KEY_SECRET=5AoXskRkVEAaHrU4nRKWjLKA
   ```
3. Restart server: `npm run dev`

---

### Issue 2: Invalid Credentials

**Symptoms:**
```
🚀 [CREATE ORDER] Calling Razorpay API...
🚨 [CREATE ORDER ERROR] ===================================
Error Message: Authentication failed
Razorpay Error Details: { code: "BAD_REQUEST_ERROR", description: "Invalid key_id" }
```

**Solution:**
1. Verify credentials are correct in Razorpay Dashboard
2. Make sure you're using LIVE keys (not TEST keys)
3. Check for extra spaces in `.env` file

---

### Issue 3: Plan Not Found

**Symptoms:**
```
🔍 [CREATE ORDER] Fetching plan from database...
❌ [CREATE ORDER] Plan not found: 64f1a2b3c4d5e6f7a8b9c0d2
```

**Solution:**
1. Seed plans: `npm run seed`
2. Get valid plan IDs: `curl http://localhost:3000/api/plans`
3. Use correct planId in request

---

### Issue 4: Network/API Error

**Symptoms:**
```
🚀 [CREATE ORDER] Calling Razorpay API...
🚨 [CREATE ORDER ERROR] ===================================
Error Message: connect ETIMEDOUT
```

**Solution:**
1. Check internet connection
2. Verify Razorpay API is accessible
3. Check firewall settings

---

### Issue 5: Database Error

**Symptoms:**
```
💾 [CREATE ORDER] Saving payment record...
🚨 [CREATE ORDER ERROR] ===================================
Error Message: E11000 duplicate key error
```

**Solution:**
1. Check MongoDB connection
2. Verify database indexes
3. Check for duplicate order IDs

---

## 📊 What Each Log Means

| Log | Meaning | Action if Missing |
|-----|---------|-------------------|
| `🔍 [RAZORPAY DEBUG]` | Credentials check on startup | Check `.env` file |
| `🔧 [RAZORPAY]` | Instance creation | Verify credentials |
| `💳 [CREATE ORDER]` | Order creation started | Check request data |
| `🔍 Fetching plan` | Database query | Seed plans if needed |
| `✅ Plan found` | Plan exists | Continue |
| `🚀 Calling Razorpay API` | API call starting | Check credentials |
| `✅ Razorpay order created` | Success! | All good |
| `🚨 [CREATE ORDER ERROR]` | Something failed | Read error details |

---

## 🧪 Testing Checklist

Run these tests in order:

### 1. Check Credentials
```bash
# Start server and look for:
npm run dev

# Should see:
# ✅ KEY_ID: rzp_live_...
# ✅ KEY_SECRET EXISTS: ✅ YES
```

### 2. Check Plans Exist
```bash
curl http://localhost:3000/api/plans

# Should return list of plans
# Save a planId for next step
```

### 3. Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'

# Save appUserId from response
```

### 4. Create Order
```bash
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"planId":"PLAN_ID_HERE"}'

# Watch console logs for detailed flow
```

---

## 🔍 Reading the Logs

### Success Flow
```
💳 [CREATE ORDER] Starting...
🔍 [CREATE ORDER] Fetching plan...
✅ [CREATE ORDER] Plan found
🔧 [CREATE ORDER] Getting Razorpay instance...
✅ [RAZORPAY] Instance created
🚀 [CREATE ORDER] Calling Razorpay API...
✅ [CREATE ORDER] Razorpay order created
💾 [CREATE ORDER] Saving payment record...
✅ [CREATE ORDER] Payment record saved
✅ [CREATE ORDER] Success!
```

### Failure Flow (Example)
```
💳 [CREATE ORDER] Starting...
🔍 [CREATE ORDER] Fetching plan...
✅ [CREATE ORDER] Plan found
🔧 [CREATE ORDER] Getting Razorpay instance...
❌ [RAZORPAY ERROR] Credentials missing!
🚨 [CREATE ORDER ERROR] ===================================
Error: Razorpay configuration error
```

**This tells you**: Credentials are missing, check `.env`

---

## 🛠️ Quick Fixes

### Fix 1: Reload Environment Variables
```bash
# Stop server (Ctrl+C)
# Restart server
npm run dev
```

### Fix 2: Verify .env File
```bash
# Check if .env exists
ls -la .env

# View contents (be careful not to expose secrets)
cat .env | grep RAZORPAY
```

### Fix 3: Test Razorpay Credentials
```bash
# Use Razorpay's test endpoint
curl -u rzp_live_YOUR_KEY:YOUR_SECRET \
  https://api.razorpay.com/v1/orders
```

---

## 📞 Next Steps

1. **Start server** and check startup logs
2. **Try creating order** and watch console
3. **Read error logs** carefully
4. **Match error** to solutions above
5. **Fix and retry**

---

## 🎯 Expected Behavior

### When Everything Works:

**Console Output:**
```
🔍 [RAZORPAY DEBUG] Checking credentials...
KEY_ID: rzp_live_SgSAV...
KEY_SECRET EXISTS: ✅ YES

💳 [CREATE ORDER] Starting...
✅ [CREATE ORDER] Plan found: 3 Searches Pack
✅ [RAZORPAY] Instance created successfully
✅ [CREATE ORDER] Razorpay order created: order_ABC123
✅ [CREATE ORDER] Success!
```

**API Response:**
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "order": {
      "orderId": "order_ABC123XYZ",
      "amount": 12900,
      "currency": "INR",
      "keyId": "rzp_live_...",
      "planName": "3 Searches Pack",
      "credits": 3
    }
  }
}
```

---

## 🚨 If Still Failing

**Collect this information:**

1. **Startup logs** (first 20 lines after `npm run dev`)
2. **Error logs** (the `🚨 [CREATE ORDER ERROR]` section)
3. **Request data** (planId, userId)
4. **Environment** (Node version, OS)

**Then:**
- Check `.env` file format
- Verify Razorpay dashboard shows correct keys
- Test with Razorpay's test mode first
- Check MongoDB connection

---

## ✅ Summary

**What was added:**
- ✅ Startup credential check
- ✅ Step-by-step order creation logs
- ✅ Detailed error logging
- ✅ Razorpay API call tracking
- ✅ Database operation logs

**How to use:**
1. Start server
2. Watch console logs
3. Identify where it fails
4. Apply fix from this guide

**The logs will tell you EXACTLY where and why it's failing!**
