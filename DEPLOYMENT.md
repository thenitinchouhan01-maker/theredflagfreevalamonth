# DeepTrust Backend - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Required Credentials

Before deploying, you must have:

- [ ] **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- [ ] **Razorpay Account** - [Sign up](https://dashboard.razorpay.com/signup)
- [ ] **Cloudinary Account** - [Sign up](https://cloudinary.com/users/register/free)
- [ ] **Render Account** (or other hosting) - [Sign up](https://render.com/)

### 2. Obtain Credentials

#### MongoDB Atlas
1. Create a cluster at https://cloud.mongodb.com/
2. Create a database user (Database Access → Add New Database User)
3. Whitelist IP addresses (Network Access → Add IP Address → Allow Access from Anywhere for now)
4. Get connection string: Clusters → Connect → Connect your application
5. Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/deeptrust?retryWrites=true&w=majority`

#### Razorpay
1. Go to https://dashboard.razorpay.com/app/keys
2. For testing: Use Test Mode keys (rzp_test_*)
3. For production: Generate Live Mode keys (rzp_live_*)
4. Copy Key ID and Key Secret
5. For webhooks: https://dashboard.razorpay.com/app/webhooks → Create webhook → Copy secret

#### Cloudinary
1. Go to https://console.cloudinary.com/console
2. Copy Cloud Name, API Key, and API Secret from dashboard
3. These are visible on the main dashboard page

### 3. Environment Variables Required

```bash
# REQUIRED - Server will not start without these
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deeptrust
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# RECOMMENDED
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production

# OPTIONAL (have defaults)
PORT=3000
CLOUDINARY_FOLDER=deeptrust/uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Deployment on Render.com

### Step 1: Prepare Repository

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore

# Commit all changes
git add .
git commit -m "Production ready backend"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: deeptrust-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

### Step 3: Add Environment Variables

In Render dashboard → Environment:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
CORS_ORIGIN=https://yourdomain.com
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically deploy
3. Wait for deployment to complete
4. Your API will be available at: `https://your-app.onrender.com`

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://your-app.onrender.com/api/health

# Should return:
{
  "success": true,
  "message": "DeepTrust API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Step 6: Seed Plans

```bash
# SSH into Render or use Render Shell
npm run seed
```

Or create a one-time job in Render dashboard.

---

## 🧪 Local Testing with Real Credentials

### 1. Create .env file

```bash
cp .env.example .env
```

### 2. Fill in real credentials

Edit `.env` with your actual credentials from MongoDB Atlas, Razorpay, and Cloudinary.

### 3. Install dependencies

```bash
npm install
```

### 4. Seed plans

```bash
npm run seed
```

### 5. Start server

```bash
npm run dev
```

### 6. Verify startup

You should see:
```
✅ All required environment variables are set
🚀 DeepTrust API Server Started
  Environment:     development
  Database:        MongoDB Atlas
  Razorpay:        Test Mode
  Cloudinary:      Configured
  Real Credentials: ✅ Yes
```

### 7. Test endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'

# Get plans
curl http://localhost:3000/api/plans

# Test payment order (with real Razorpay keys)
curl -X POST http://localhost:3000/api/payments/order \
  -H "Content-Type: application/json" \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -d '{"planId":"PLAN_ID_FROM_PLANS_ENDPOINT"}'

# Test image upload (with real Cloudinary)
curl -X POST http://localhost:3000/api/uploads \
  -H "x-app-user-id: DTX-XXXX-XXXX" \
  -F "image=@/path/to/test-image.jpg"
```

---

## 🔒 Security Checklist

- [ ] All environment variables set in Render (not in code)
- [ ] `.env` file in `.gitignore`
- [ ] Using HTTPS in production (Render provides this)
- [ ] CORS configured with specific origins (not *)
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Razorpay webhook secret configured
- [ ] Using Razorpay live keys in production
- [ ] Sensitive data not logged in production

---

## 📊 Monitoring & Maintenance

### Health Check Endpoint

```
GET https://your-app.onrender.com/api/health
```

Use this for:
- Uptime monitoring (UptimeRobot, Pingdom)
- Load balancer health checks
- CI/CD pipeline verification

### Logs

View logs in Render dashboard → Logs tab

### Database Backups

MongoDB Atlas provides automatic backups. Configure in:
- Atlas Dashboard → Clusters → Backup

### Webhook Configuration

After deployment, configure Razorpay webhook:
1. Go to https://dashboard.razorpay.com/app/webhooks
2. Add webhook URL: `https://your-app.onrender.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET` env var

---

## 🐛 Troubleshooting

### Server won't start

**Error**: "Missing required environment variables"
- **Solution**: Ensure all required env vars are set in Render dashboard

**Error**: "Invalid MONGODB_URI format"
- **Solution**: Check MongoDB Atlas connection string format

**Error**: "Cannot connect to MongoDB"
- **Solution**: Check MongoDB Atlas IP whitelist and credentials

### Payment order creation fails

**Error**: "Failed to create payment order"
- **Solution**: Verify Razorpay keys are correct and active
- Check Razorpay dashboard for API status

### Image upload fails

**Error**: "Failed to upload image to Cloudinary"
- **Solution**: Verify Cloudinary credentials
- Check Cloudinary dashboard for usage limits

### Webhook not working

**Error**: "Invalid webhook signature"
- **Solution**: Ensure `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- Verify webhook URL is correct in Razorpay dashboard

---

## 📈 Scaling Considerations

### Database
- MongoDB Atlas: Upgrade cluster tier for more resources
- Add indexes for frequently queried fields
- Enable connection pooling (already configured in Mongoose)

### Server
- Render: Upgrade to paid plan for more resources
- Enable auto-scaling if available
- Consider multiple instances behind load balancer

### Rate Limiting
- Adjust `RATE_LIMIT_MAX_REQUESTS` based on traffic
- Consider Redis-based rate limiting for distributed systems

### Caching
- Add Redis for session/cache management
- Cache frequently accessed data (plans, etc.)

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

Add `RENDER_DEPLOY_HOOK` secret in GitHub repository settings.

---

## 📞 Support

For issues:
1. Check logs in Render dashboard
2. Verify all environment variables
3. Test locally with same credentials
4. Check service status:
   - MongoDB Atlas: https://status.mongodb.com/
   - Razorpay: https://status.razorpay.com/
   - Cloudinary: https://status.cloudinary.com/
   - Render: https://status.render.com/

---

## ✅ Post-Deployment Verification

After deployment, verify:

```bash
# 1. Health check
curl https://your-app.onrender.com/api/health

# 2. Create user
curl -X POST https://your-app.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"prod-test-001"}'

# 3. Get plans
curl https://your-app.onrender.com/api/plans

# 4. Check access status
curl https://your-app.onrender.com/api/access/status \
  -H "x-app-user-id: DTX-XXXX-XXXX"
```

All endpoints should return proper JSON responses with `success: true`.

---

**Deployment Status**: Ready for production with real credentials
**Last Updated**: 2024-03-21
