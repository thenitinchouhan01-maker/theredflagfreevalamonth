# 🔒 Razorpay LIVE Payment Integration - Complete Guide

## ✅ Implementation Status

**PRODUCTION-READY** - All security measures implemented

---

## 🎯 What Was Implemented

### Security Features
- ✅ Signature verification using HMAC SHA256
- ✅ Double-spending prevention
- ✅ Atomic credit operations
- ✅ User ownership validation
- ✅ Backend-only verification (zero trust in frontend)
- ✅ Comprehensive error handling
- ✅ Audit logging for all transactions
- ✅ Mobile-friendly CORS configuration

### Payment Flow
```
User → Select Plan → Create Order → Razorpay Checkout
  ↓
Payment Success → Frontend sends verification data
  ↓
Backend verifies signature → Adds credits (atomic)
  ↓
User can now search
```

---

## 🔧 Setup Instructions

### Step 1: Get Razorpay LIVE Credentials

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/
   - Switch to **LIVE MODE** (toggle in top-right)

2. **Get API Keys**
   - Navigate to: Settings → API Keys
   - Click "Generate Live Keys"
   - Copy both:
     - `Key ID` (starts with `rzp_live_`)
     - `Key Secret` (keep this SECRET!)

3. **Update `.env` file**
   ```env
   # Replace these with YOUR credentials
   RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_HERE
   RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
   ```

   ⚠️ **CRITICAL**: 
   - NEVER commit `.env` to Git
   - NEVER expose `KEY_SECRET` in API responses
   - NEVER send `KEY_SECRET` to frontend

---

## 📱 Frontend Integration

### Step 1: Load Razorpay Checkout Script

Add to your HTML/Flutter app:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 2: Create Order (Backend Call)

```javascript
// Frontend: Create order
const response = await fetch('https://your-api.com/api/payments/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-app-user-id': 'DTX-XXXX-XXXX'
  },
  body: JSON.stringify({
    planId: 'PLAN_ID_FROM_PLANS_API'
  })
});

const { data } = await response.json();
const { order } = data;

// order contains:
// - orderId: "order_ABC123"
// - amount: 12900 (in paise)
// - currency: "INR"
// - keyId: "rzp_live_..."
```

### Step 3: Open Razorpay Checkout

```javascript
const options = {
  key: order.keyId,  // From backend response
  amount: order.amount,
  currency: order.currency,
  order_id: order.orderId,
  name: 'DeepSearch',
  description: `${order.planName} - ${order.credits} Credits`,
  image: 'https://your-logo-url.com/logo.png',
  
  handler: async function (response) {
    // Payment successful - verify on backend
    await verifyPayment(response);
  },
  
  prefill: {
    name: 'User Name',
    email: 'user@example.com',
    contact: '9999999999'
  },
  
  theme: {
    color: '#3399cc'
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Step 4: Verify Payment (Backend Call)

```javascript
async function verifyPayment(razorpayResponse) {
  const response = await fetch('https://your-api.com/api/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-user-id': 'DTX-XXXX-XXXX'
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Credits added:', result.data.creditsAdded);
    console.log('Total credits:', result.data.totalCredits);
    // Update UI, show success message
  }
}
```

---

## 🧪 Testing Guide

### Test Mode (Before Going Live)

1. **Use Test Credentials**
   ```env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=test_secret...
   ```

2. **Test Cards** (Razorpay provides these)
   - Success: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - OTP: `123456`

3. **Test Flow**
   ```bash
   # 1. Create user
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"test-001"}'
   
   # 2. Get plans
   curl http://localhost:3000/api/plans
   
   # 3. Create order
   curl -X POST http://localhost:3000/api/payments/create-order \
     -H "Content-Type: application/json" \
     -H "x-app-user-id: DTX-XXXX-XXXX" \
     -d '{"planId":"PLAN_ID"}'
   
   # 4. Complete payment in Razorpay checkout
   # 5. Verify payment (frontend will call this)
   
   # 6. Check credits
   curl http://localhost:3000/api/users/me \
     -H "x-app-user-id: DTX-XXXX-XXXX"
   ```

### Live Mode Testing

1. **Switch to LIVE credentials** in `.env`
2. **Use real payment methods**
3. **Test with small amount first** (₹1 if possible)
4. **Verify credits are added**
5. **Test duplicate payment prevention**
6. **Monitor logs** for any errors

---

## 🔒 Security Checklist

### ✅ Implemented
- [x] Signature verification using HMAC SHA256
- [x] Backend-only credit addition
- [x] Atomic MongoDB operations
- [x] Double-spending prevention
- [x] User ownership validation
- [x] Comprehensive error handling
- [x] Audit logging
- [x] NoSQL injection protection
- [x] XSS protection
- [x] Rate limiting

### ⚠️ Additional Recommendations
- [ ] Enable Razorpay webhooks for reliability
- [ ] Set up payment failure alerts
- [ ] Monitor for unusual payment patterns
- [ ] Implement refund handling
- [ ] Add payment analytics dashboard

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid Signature" Error
**Cause**: Wrong `KEY_SECRET` or signature mismatch  
**Solution**: 
- Verify `RAZORPAY_KEY_SECRET` in `.env`
- Ensure frontend sends correct `razorpay_signature`
- Check logs for signature comparison

### Issue 2: Credits Not Added
**Cause**: Payment verification failed  
**Solution**:
- Check if signature verification passed
- Look for errors in logs
- Verify payment status in Razorpay dashboard

### Issue 3: Duplicate Credits
**Cause**: Multiple verification calls  
**Solution**: Already handled! System checks `payment.status === 'paid'`

### Issue 4: CORS Error from Mobile App
**Cause**: Origin header missing  
**Solution**: Already handled! CORS allows requests with no origin

---

## 📊 API Responses

### Create Order - Success
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
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Verify Payment - Success
```json
{
  "success": true,
  "message": "Payment verified and credits added successfully",
  "data": {
    "success": true,
    "creditsAdded": 3,
    "totalCredits": 3
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Verify Payment - Already Processed
```json
{
  "success": true,
  "message": "Payment already verified",
  "data": {
    "success": true,
    "alreadyProcessed": true,
    "creditsAdded": 0,
    "totalCredits": 3
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error - Invalid Signature
```json
{
  "success": false,
  "message": "Payment verification failed. Invalid signature.",
  "errorCode": "INVALID_SIGNATURE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔍 Monitoring & Logs

### Key Log Messages

**Order Created**
```
INFO: Razorpay order created
{
  userId: "64f...",
  planId: "64f...",
  orderId: "order_ABC123",
  amount: 129,
  credits: 3
}
```

**Payment Verified**
```
INFO: Payment verified and credits added
{
  userId: "64f...",
  orderId: "order_ABC123",
  paymentId: "pay_DEF456",
  creditsAdded: 3,
  newBalance: 3,
  planName: "3 Searches Pack"
}
```

**Duplicate Attempt**
```
WARN: Duplicate payment verification attempt
{
  userId: "64f...",
  orderId: "order_ABC123",
  paymentId: "pay_DEF456"
}
```

**Invalid Signature**
```
ERROR: Invalid Razorpay signature
{
  userId: "64f...",
  orderId: "order_ABC123",
  paymentId: "pay_DEF456"
}
```

### MongoDB Queries for Monitoring

```javascript
// Total revenue today
db.payments.aggregate([
  {
    $match: {
      status: "paid",
      createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    }
  },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])

// Failed payments
db.payments.find({ status: "failed" }).count()

// Credits distributed today
db.payments.aggregate([
  {
    $match: {
      status: "paid",
      createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    }
  },
  { $group: { _id: null, total: { $sum: "$creditsAdded" } } }
])
```

---

## 🎓 Best Practices

### DO ✅
- Always verify signature on backend
- Use atomic operations for credits
- Log all payment events
- Handle errors gracefully
- Test thoroughly before going live
- Monitor payment patterns
- Keep credentials secure

### DON'T ❌
- Never trust frontend payment success
- Never expose `KEY_SECRET`
- Never skip signature verification
- Never add credits without verification
- Never ignore duplicate payment checks
- Never commit `.env` to Git

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Update `.env` with LIVE credentials
- [ ] Test complete payment flow
- [ ] Verify signature validation works
- [ ] Test duplicate payment prevention
- [ ] Check error handling
- [ ] Review logs for any issues

### Deployment
- [ ] Deploy code to production
- [ ] Verify environment variables are set
- [ ] Test with real payment (small amount)
- [ ] Monitor logs for errors
- [ ] Set up alerts for payment failures

### Post-Deployment
- [ ] Monitor first few transactions
- [ ] Verify credits are added correctly
- [ ] Check Razorpay dashboard for payments
- [ ] Set up daily payment reports
- [ ] Document any issues

---

## 📞 Support

### Razorpay Support
- Dashboard: https://dashboard.razorpay.com/
- Docs: https://razorpay.com/docs/
- Support: support@razorpay.com

### Internal Logs
```bash
# View payment logs
grep "Razorpay" logs/app.log | tail -50

# View errors
grep "ERROR" logs/app.log | grep -i payment

# View today's payments
grep "Payment verified" logs/app.log | grep "$(date +%Y-%m-%d)"
```

---

## ✅ Summary

**What's Ready:**
- ✅ Complete Razorpay LIVE integration
- ✅ Secure signature verification
- ✅ Atomic credit operations
- ✅ Double-spending prevention
- ✅ Mobile-friendly CORS
- ✅ Comprehensive error handling
- ✅ Production-ready code

**Next Steps:**
1. Add LIVE credentials to `.env`
2. Test with real payment
3. Monitor logs
4. Deploy to production

**You're ready to accept LIVE payments! 🎉**
