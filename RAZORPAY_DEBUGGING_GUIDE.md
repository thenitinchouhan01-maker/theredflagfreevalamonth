# 🔍 RAZORPAY API DEBUGGING GUIDE

## 🎯 Goal

Identify the **REAL root cause** of Razorpay order creation failures by capturing:
1. ✅ Exact orderData sent to Razorpay
2. ✅ Full Razorpay API response (success or error)

---

## 📊 Enhanced Logging Added

### Before API Call
```
📦 [ORDER DATA] Exact data being sent to Razorpay API:
{
  "amount": 9900,
  "currency": "INR",
  "receipt": "rcpt_1234567890",
  "notes": {
    "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "planId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "planName": "1 Credit",
    "credits": "1"
  }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 [RAZORPAY API] Calling razorpay.orders.create()...
⏱️  [RAZORPAY API] Timestamp: 2024-01-01T00:00:00.000Z
```

### On Success
```
✅ [RAZORPAY SUCCESS] Order created successfully!
✅ Razorpay FULL Response:
{
  "id": "order_ABC123XYZ",
  "entity": "order",
  "amount": 9900,
  "amount_paid": 0,
  "amount_due": 9900,
  "currency": "INR",
  "receipt": "rcpt_1234567890",
  "status": "created",
  "attempts": 0,
  "notes": {
    "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "planId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "planName": "1 Credit",
    "credits": "1"
  },
  "created_at": 1234567890
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### On Failure
```
🔥 [RAZORPAY API ERROR] Order creation FAILED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Razorpay API ERROR FULL: {
  message: "Authentication failed",
  statusCode: 401,
  error: {
    description: "Invalid API key or secret",
    code: "BAD_REQUEST_ERROR",
    field: null,
    source: "business",
    step: null,
    reason: "invalid_api_key"
  },
  stack: "..."
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Common Razorpay Errors

### 1. Authentication Failed (401)
```json
{
  "statusCode": 401,
  "error": {
    "description": "Invalid API key or secret",
    "code": "BAD_REQUEST_ERROR",
    "reason": "invalid_api_key"
  }
}
```

**Cause:** Invalid `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET`

**Fix:**
1. Check `.env` file
2. Verify credentials from Razorpay Dashboard
3. Ensure no extra spaces/newlines
4. Check if using TEST or LIVE keys correctly

---

### 2. Invalid Amount (400)
```json
{
  "statusCode": 400,
  "error": {
    "description": "The amount must be atleast INR 1.00",
    "code": "BAD_REQUEST_ERROR",
    "field": "amount"
  }
}
```

**Cause:** Amount is less than minimum (100 paise = ₹1)

**Fix:**
- Ensure `plan.price >= 1`
- Check `amountInPaise = plan.price * 100`

---

### 3. Invalid Currency (400)
```json
{
  "statusCode": 400,
  "error": {
    "description": "Currency is not supported",
    "code": "BAD_REQUEST_ERROR",
    "field": "currency"
  }
}
```

**Cause:** Invalid currency code

**Fix:**
- Use `INR` for Indian Rupees
- Check Razorpay supported currencies

---

### 4. Network Error
```json
{
  "message": "connect ETIMEDOUT",
  "statusCode": "N/A",
  "error": "N/A"
}
```

**Cause:** Network connectivity issue

**Fix:**
- Check internet connection
- Check firewall settings
- Verify Razorpay API endpoint is accessible

---

### 5. Rate Limit Exceeded (429)
```json
{
  "statusCode": 429,
  "error": {
    "description": "Too many requests",
    "code": "RATE_LIMIT_ERROR"
  }
}
```

**Cause:** Too many API calls in short time

**Fix:**
- Implement exponential backoff
- Add delay between requests
- Contact Razorpay for rate limit increase

---

## 🧪 Testing Steps

### Step 1: Test with Valid Credentials

1. **Verify credentials in `.env`:**
```bash
cat .env | grep RAZORPAY
```

Expected output:
```
RAZORPAY_KEY_ID=rzp_test_SdqRKw1Tsxes6q
RAZORPAY_KEY_SECRET=rO4ian2G34IdPRVXofRO4AZL
```

2. **Start server:**
```bash
npm run dev
```

3. **Check startup logs:**
```
🔑 [RAZORPAY] Checking credentials...
🔑 KEY_ID: rzp_test_SdqRKw1Tsxes6q
🔑 KEY_SECRET EXISTS: ✅ YES
🔑 KEY_SECRET LENGTH: 24
🔑 KEY_SECRET PREVIEW: rO4ian2G34...
```

4. **Create order:**
```bash
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "x-app-user-id: DTX-TEST-USER" \
  -H "Content-Type: application/json" \
  -d '{"planId":"VALID_PLAN_ID"}'
```

5. **Check logs for:**
- ✅ Order data sent
- ✅ Razorpay response
- ❌ Error details (if failed)

---

### Step 2: Test with Invalid Credentials

1. **Temporarily break credentials:**
```bash
# In .env
RAZORPAY_KEY_ID=invalid_key
RAZORPAY_KEY_SECRET=invalid_secret
```

2. **Restart server and create order**

3. **Expected logs:**
```
🔥 [RAZORPAY API ERROR] Order creation FAILED!
🔥 Razorpay API ERROR FULL: {
  message: "Authentication failed",
  statusCode: 401,
  error: {
    description: "Invalid API key or secret",
    code: "BAD_REQUEST_ERROR",
    reason: "invalid_api_key"
  }
}
```

---

### Step 3: Test with Invalid Amount

1. **Create plan with price < 1:**
```javascript
// In MongoDB
db.plans.insertOne({
  name: "Invalid Plan",
  price: 0.5,  // Less than ₹1
  credits: 1,
  isActive: true
})
```

2. **Try to create order**

3. **Expected logs:**
```
🔥 Razorpay API ERROR FULL: {
  statusCode: 400,
  error: {
    description: "The amount must be atleast INR 1.00",
    field: "amount"
  }
}
```

---

## 🔧 Troubleshooting Checklist

### If Razorpay API fails:

- [ ] Check `.env` file exists
- [ ] Verify `RAZORPAY_KEY_ID` is set
- [ ] Verify `RAZORPAY_KEY_SECRET` is set
- [ ] Check for extra spaces/newlines in credentials
- [ ] Verify using TEST keys (rzp_test_...) for testing
- [ ] Check plan price is >= ₹1
- [ ] Verify internet connection
- [ ] Check Razorpay Dashboard for API status
- [ ] Review server logs for exact error
- [ ] Test credentials with Razorpay API directly

---

## 📝 Log Analysis

### What to Look For:

1. **Order Data Sent:**
   - Is `amount` correct? (should be in paise)
   - Is `currency` = "INR"?
   - Is `receipt` unique?
   - Are `notes` properly formatted?

2. **Razorpay Response:**
   - Is `id` present?
   - Is `status` = "created"?
   - Is `amount` matching?

3. **Error Details:**
   - What is `statusCode`? (401, 400, 429, etc.)
   - What is `error.description`?
   - What is `error.code`?
   - What is `error.field`? (which field caused error)
   - What is `error.reason`?

---

## 🎯 Next Steps After Debugging

Once you identify the error from logs:

### If Authentication Error (401):
1. Get correct credentials from Razorpay Dashboard
2. Update `.env` file
3. Restart server
4. Test again

### If Amount Error (400):
1. Check plan prices in database
2. Ensure all plans have price >= ₹1
3. Update invalid plans
4. Test again

### If Network Error:
1. Check internet connection
2. Test Razorpay API directly: `curl https://api.razorpay.com/v1/`
3. Check firewall/proxy settings
4. Contact Razorpay support if needed

### If Rate Limit (429):
1. Add delay between requests
2. Implement retry logic with exponential backoff
3. Contact Razorpay for rate limit increase

---

## 📊 Expected Behavior

### SUCCESS Flow:
```
1. Order data prepared ✅
2. Razorpay API called ✅
3. Response received with order ID ✅
4. Validation passed ✅
5. Saved to database ✅
6. Response sent to client ✅
```

### FAILURE Flow:
```
1. Order data prepared ✅
2. Razorpay API called ✅
3. Error received ❌
4. Full error logged ✅
5. Error thrown (no DB insert) ✅
6. Error response sent to client ✅
```

---

## 🔑 Key Points

1. ✅ **No DB insert on Razorpay failure** - Duplicate key error prevented
2. ✅ **Full error details logged** - Easy to identify root cause
3. ✅ **Clear error messages** - Client gets meaningful error
4. ✅ **No logic changes** - Only added debugging logs

---

**Status:** DEBUGGING ENHANCED
**Next:** Run test and analyze logs to identify root cause
