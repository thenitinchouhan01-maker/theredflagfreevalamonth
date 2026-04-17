# DeepTrust Backend - Credentials Checklist

## 🔑 Required Credentials

### 1. MongoDB Atlas

**What you need:**
- MongoDB Atlas connection string

**How to get it:**
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a free cluster (M0 Sandbox)
3. Create database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `deeptrust_user` (or your choice)
   - Password: Generate strong password
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"
4. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs for better security
   - Click "Confirm"
5. Get connection string:
   - Go to "Clusters"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `deeptrust`

**Format:**
```
mongodb+srv://deeptrust_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/deeptrust?retryWrites=true&w=majority
```

**Environment Variable:**
```
MONGODB_URI=mongodb+srv://deeptrust_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/deeptrust?retryWrites=true&w=majority
```

---

### 2. Razorpay

**What you need:**
- Key ID
- Key Secret
- Webhook Secret (optional but recommended)

**How to get it:**
1. Sign up at https://dashboard.razorpay.com/signup
2. Complete KYC (for live mode) or use test mode
3. Get API Keys:
   - Go to https://dashboard.razorpay.com/app/keys
   - For testing: Switch to "Test Mode" (top left)
   - For production: Switch to "Live Mode" (requires KYC)
   - Copy "Key ID" (starts with `rzp_test_` or `rzp_live_`)
   - Click "Regenerate" or "Show" to get "Key Secret"
4. Get Webhook Secret (recommended):
   - Go to https://dashboard.razorpay.com/app/webhooks
   - Click "Create Webhook"
   - URL: `https://your-app.onrender.com/api/payments/webhook`
   - Active Events: Select `payment.captured` and `payment.failed`
   - Click "Create Webhook"
   - Copy the "Secret" shown

**Test Mode Keys (for development):**
```
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
```

**Live Mode Keys (for production):**
```
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=ZZZZZZZZZZZZZZZZ
```

**Important Notes:**
- Test mode keys work for testing but won't process real payments
- Live mode requires KYC verification
- Keep Key Secret secure - never expose in client code
- Webhook secret is optional but highly recommended for security

---

### 3. Cloudinary

**What you need:**
- Cloud Name
- API Key
- API Secret

**How to get it:**
1. Sign up at https://cloudinary.com/users/register/free
2. Verify your email
3. Go to https://console.cloudinary.com/console
4. On the dashboard, you'll see:
   - **Cloud Name**: Your unique cloud name (e.g., `dxyz1234`)
   - **API Key**: Numeric key (e.g., `123456789012345`)
   - **API Secret**: Click "Reveal" to see it
5. Copy all three values

**Format:**
```
CLOUDINARY_CLOUD_NAME=dxyz1234
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**Optional:**
```
CLOUDINARY_FOLDER=deeptrust/uploads
```

**Free Tier Limits:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Sufficient for development and small production apps

---

## 📝 Quick Setup Checklist

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created (M0 free tier)
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0 for now)
- [ ] Connection string copied and password replaced
- [ ] Razorpay account created
- [ ] Razorpay test mode keys copied
- [ ] Razorpay webhook created (optional for now)
- [ ] Cloudinary account created
- [ ] Cloudinary credentials copied from dashboard
- [ ] All credentials added to `.env` file
- [ ] `.env` file NOT committed to git
- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK

---

## 🧪 Testing Your Credentials

### Test MongoDB Connection

```bash
# Start the server
npm run dev

# Look for this in logs:
# "MongoDB Connected: cluster0.xxxxx.mongodb.net"
```

If connection fails:
- Check username/password in connection string
- Verify IP whitelist includes your IP
- Ensure database name is correct

### Test Razorpay Keys

```bash
# Create a user first
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'

# Save the appUserId from response

# Get plans
curl http://localhost:3000/api/plans

# Save a planId from response

# Try to create payment order
curl -X POST http://localhost:3000/api/payments/order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"planId":"PLAN_ID_HERE"}'

# Should return order details with orderId
```

If it fails:
- Verify Key ID starts with `rzp_test_` or `rzp_live_`
- Check Key Secret is correct
- Ensure keys are from same mode (test/live)

### Test Cloudinary Upload

```bash
# Upload an image
curl -X POST http://localhost:3000/api/uploads \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -F "image=@/path/to/test-image.jpg"

# Should return upload details with secureUrl
```

If it fails:
- Verify Cloud Name is correct
- Check API Key and Secret
- Ensure image file exists and is valid format

---

## 🔒 Security Best Practices

1. **Never commit credentials to git**
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment variables**
   - Never hardcode credentials in code
   - Use `.env` for local development
   - Use hosting platform's env vars for production

3. **Rotate credentials regularly**
   - Change passwords every 90 days
   - Regenerate API keys if compromised

4. **Use test mode for development**
   - Use Razorpay test keys during development
   - Switch to live keys only in production

5. **Restrict IP access**
   - MongoDB: Whitelist specific IPs in production
   - Cloudinary: Enable signed URLs for sensitive content

6. **Enable webhook secrets**
   - Always use webhook secrets in production
   - Verify signatures on all webhook requests

---

## 📋 Environment Variables Template

Copy this to your `.env` file and fill in the values:

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deeptrust?retryWrites=true&w=majority

# Razorpay (REQUIRED)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=ZZZZZZZZZZZZZZZZ

# Cloudinary (REQUIRED)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=deeptrust/uploads

# CORS (OPTIONAL)
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

# Rate Limiting (OPTIONAL)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## ❓ Troubleshooting

### "Missing required environment variables"
- Check all required vars are in `.env`
- Ensure `.env` is in project root
- Restart server after changing `.env`

### "Invalid MONGODB_URI format"
- Must start with `mongodb://` or `mongodb+srv://`
- Check for typos in connection string
- Ensure password doesn't contain special characters (URL encode if needed)

### "Razorpay authentication failed"
- Verify Key ID and Secret are from same mode (test/live)
- Check for extra spaces in credentials
- Ensure keys are active in Razorpay dashboard

### "Cloudinary upload failed"
- Verify all three credentials (cloud name, API key, secret)
- Check Cloudinary account is active
- Ensure you haven't exceeded free tier limits

---

**Status**: Ready for credential setup
**Next Step**: Obtain credentials and add to `.env` file
