# 🚀 Razorpay LIVE - Quick Reference

## 🔑 Setup (5 Minutes)

### 1. Get Credentials
```
Dashboard: https://dashboard.razorpay.com/
Switch to: LIVE MODE
Go to: Settings → API Keys → Generate Live Keys
```

### 2. Update .env
```env
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_HERE      # ← PASTE HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE         # ← PASTE HERE
```

### 3. Restart Server
```bash
npm run dev
```

---

## 📱 Frontend Code (Copy-Paste Ready)

### Load Razorpay Script
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Complete Payment Flow
```javascript
// Step 1: Create Order
async function purchasePlan(planId) {
  const response = await fetch('YOUR_API/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-user-id': 'DTX-XXXX-XXXX'
    },
    body: JSON.stringify({ planId })
  });
  
  const { data } = await response.json();
  openRazorpay(data.order);
}

// Step 2: Open Razorpay Checkout
function openRazorpay(order) {
  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'DeepSearch',
    description: `${order.planName} - ${order.credits} Credits`,
    
    handler: async function (response) {
      await verifyPayment(response);
    },
    
    prefill: {
      name: 'User Name',
      email: 'user@example.com',
      contact: '9999999999'
    },
    
    theme: { color: '#3399cc' }
  };
  
  const razorpay = new Razorpay(options);
  razorpay.open();
}

// Step 3: Verify Payment
async function verifyPayment(razorpayResponse) {
  const response = await fetch('YOUR_API/api/payments/verify', {
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
    alert(`Success! ${result.data.creditsAdded} credits added`);
    // Refresh user data, navigate to search page, etc.
  }
}
```

---

## 🧪 Testing Commands

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
  -d '{"planId":"PLAN_ID_HERE"}'

# 4. Check credits after payment
curl http://localhost:3000/api/users/me \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

---

## 🔒 Security Features (Already Implemented)

| Feature | Status |
|---------|--------|
| Signature Verification | ✅ HMAC SHA256 |
| Double-Spending Prevention | ✅ Status check |
| Atomic Operations | ✅ MongoDB $inc |
| Backend Validation | ✅ Zero trust |
| User Ownership Check | ✅ Verified |
| Error Handling | ✅ Complete |
| Audit Logging | ✅ All events |

---

## 📊 API Endpoints

### Create Order
```
POST /api/payments/create-order
Headers: x-app-user-id: DTX-XXXX-XXXX
Body: { "planId": "64f..." }

Response:
{
  "success": true,
  "data": {
    "order": {
      "orderId": "order_ABC123",
      "amount": 12900,
      "currency": "INR",
      "keyId": "rzp_live_...",
      "credits": 3
    }
  }
}
```

### Verify Payment
```
POST /api/payments/verify
Headers: x-app-user-id: DTX-XXXX-XXXX
Body: {
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_DEF456",
  "razorpay_signature": "abc123..."
}

Response:
{
  "success": true,
  "data": {
    "creditsAdded": 3,
    "totalCredits": 3
  }
}
```

---

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_SIGNATURE` | Wrong secret or signature | Check `.env` credentials |
| `PLAN_NOT_FOUND` | Invalid planId | Get valid planId from `/api/plans` |
| `PAYMENT_NOT_FOUND` | Order not created | Create order first |
| `UNAUTHORIZED_PAYMENT` | Wrong user | Use correct `x-app-user-id` |

---

## 📝 Test Cards (Test Mode Only)

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Failure |
| CVV: Any 3 digits | - |
| Expiry: Any future date | - |
| OTP: 123456 | - |

---

## 🔍 Monitoring

### Check Logs
```bash
# Payment events
grep "Razorpay" logs/app.log | tail -20

# Errors
grep "ERROR" logs/app.log | grep -i payment

# Today's payments
grep "Payment verified" logs/app.log | grep "$(date +%Y-%m-%d)"
```

### MongoDB Queries
```javascript
// Total revenue
db.payments.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])

// Credits distributed
db.payments.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: null, total: { $sum: "$creditsAdded" } } }
])
```

---

## ✅ Pre-Launch Checklist

- [ ] LIVE credentials in `.env`
- [ ] Test with real payment (₹1)
- [ ] Verify credits added
- [ ] Test duplicate payment
- [ ] Check error handling
- [ ] Monitor logs
- [ ] Set up alerts

---

## 🎯 What's Different from Test Mode?

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| Key ID | `rzp_test_...` | `rzp_live_...` |
| Payments | Fake cards | Real money |
| Dashboard | Test section | Live section |
| Webhooks | Test URL | Production URL |

---

## 📞 Quick Links

- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **API Docs**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Support**: support@razorpay.com

---

## 🎉 You're Ready!

1. ✅ Add LIVE credentials to `.env`
2. ✅ Restart server
3. ✅ Test with real payment
4. ✅ Go live!

**Full docs**: See `RAZORPAY_LIVE_INTEGRATION.md`
