# 🔴 Railway Deployment Issue - Troubleshooting

## Current Status
**URL:** https://deeptrustgfbfbackend-production.up.railway.app/api/health

**Error:**
```json
{
  "status": "error",
  "code": 502,
  "message": "Application failed to respond"
}
```

---

## 🔍 Possible Causes

### 1. **Service Not Started**
Railway service might be sleeping or failed to start.

### 2. **Build Failed**
Deployment might have failed during build.

### 3. **Port Configuration**
App might not be listening on correct port.

### 4. **Environment Variables Missing**
Critical env vars might be missing.

### 5. **MongoDB Connection Failed**
Database connection might be failing.

---

## ✅ Immediate Fixes

### Fix 1: Check Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Select your project: `deeptrustgfbfbackend-production`
3. Check **Deployments** tab
4. Look for:
   - ✅ Build succeeded
   - ✅ Deploy succeeded
   - ❌ Any error messages

### Fix 2: Check Logs

**In Railway Dashboard:**
1. Click on your service
2. Go to **Logs** tab
3. Look for errors:
   ```
   Error: Cannot find module...
   Error: connect ECONNREFUSED (MongoDB)
   Error: listen EADDRINUSE (Port conflict)
   ```

**Or use Railway CLI:**
```bash
railway logs
```

### Fix 3: Verify Environment Variables

**Required Variables:**
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
```

**Check in Railway:**
1. Go to service settings
2. Click **Variables** tab
3. Verify all required vars are set

### Fix 4: Check Start Command

**In Railway Dashboard:**
1. Go to **Settings** tab
2. Check **Start Command**
3. Should be: `npm start` or `node server.js`

### Fix 5: Verify package.json Scripts

**Check your package.json:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## 🛠️ Step-by-Step Debugging

### Step 1: Check Build Logs

**In Railway Dashboard → Deployments:**

Look for:
```
✅ Installing dependencies...
✅ npm install completed
✅ Build completed
❌ Error: Module not found
```

### Step 2: Check Runtime Logs

**In Railway Dashboard → Logs:**

Look for:
```
✅ Server running on port 3000
✅ MongoDB connected successfully
❌ Error: Cannot connect to MongoDB
❌ Error: Port 3000 is already in use
```

### Step 3: Test MongoDB Connection

**Check MONGODB_URI format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Common issues:**
- ❌ Password contains special characters (needs URL encoding)
- ❌ IP whitelist doesn't include Railway IPs (use 0.0.0.0/0)
- ❌ Database user doesn't have permissions

### Step 4: Check Port Configuration

**In your code (server.js or app.js):**
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Railway automatically sets PORT env var.**

### Step 5: Verify Dependencies

**Check package.json has all dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.3",
    // ... all other dependencies
  }
}
```

---

## 🚀 Quick Fixes

### Fix A: Redeploy

**In Railway Dashboard:**
1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for build to complete
4. Check logs

### Fix B: Add Missing Env Vars

**Required minimum:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
PORT=3000
```

**Add in Railway:**
1. Settings → Variables
2. Click **+ New Variable**
3. Add each variable
4. Service will auto-redeploy

### Fix C: Fix MongoDB Connection

**If MongoDB error in logs:**

1. Go to MongoDB Atlas
2. Network Access → Add IP: `0.0.0.0/0`
3. Database Access → Verify user has read/write permissions
4. Get new connection string
5. Update `MONGODB_URI` in Railway

### Fix D: Check server.js

**Ensure server.js exists and has:**
```javascript
require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
```

---

## 📋 Checklist

Run through this checklist:

- [ ] Railway deployment shows "Deploy succeeded"
- [ ] Build logs show no errors
- [ ] Runtime logs show "Server running on port..."
- [ ] Runtime logs show "MongoDB connected"
- [ ] `NODE_ENV=production` is set
- [ ] `MONGODB_URI` is set and valid
- [ ] `PORT` is set (or defaults to 3000)
- [ ] MongoDB Atlas allows Railway IPs (0.0.0.0/0)
- [ ] package.json has "start" script
- [ ] server.js listens on 0.0.0.0

---

## 🧪 Manual Testing (After Fix)

### Test 1: Health Check
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

**Expected:**
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "environment": "production"
}
```

### Test 2: Create User
```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'
```

**Expected:**
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

### Test 3: Get Plans
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "plans": [...]
  }
}
```

---

## 🔧 Common Error Solutions

### Error: "Application failed to respond"
**Cause:** Server not starting or crashed  
**Fix:** Check logs for startup errors

### Error: "Cannot connect to MongoDB"
**Cause:** Invalid MONGODB_URI or IP not whitelisted  
**Fix:** Update MongoDB Atlas network access to 0.0.0.0/0

### Error: "Port already in use"
**Cause:** Multiple instances running  
**Fix:** Railway handles this automatically, redeploy

### Error: "Module not found"
**Cause:** Missing dependency in package.json  
**Fix:** Add dependency and redeploy

### Error: "Cannot find module './app'"
**Cause:** File path issue  
**Fix:** Check require paths are correct

---

## 📞 Get Help

### Railway Support
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### Check Logs
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

---

## 🎯 Next Steps

1. **Check Railway Dashboard** → Deployments tab
2. **Read Logs** → Look for error messages
3. **Verify Env Vars** → Especially MONGODB_URI
4. **Fix Issues** → Based on error messages
5. **Redeploy** → After fixing
6. **Test Again** → Use curl commands above

---

## 💡 Pro Tips

1. **Always check logs first** - They tell you exactly what's wrong
2. **MongoDB IP whitelist** - Use 0.0.0.0/0 for Railway
3. **Environment variables** - Double-check they're set correctly
4. **Start command** - Should be `npm start` or `node server.js`
5. **Listen on 0.0.0.0** - Not localhost or 127.0.0.1

---

## 📝 Summary

**Current Issue:** 502 Bad Gateway - Application not responding

**Most Likely Causes:**
1. MongoDB connection failed
2. Server crashed on startup
3. Missing environment variables
4. Build failed

**Action Required:**
1. Check Railway logs
2. Verify MONGODB_URI
3. Check deployment status
4. Redeploy if needed

**Once fixed, test with:**
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

---

Bhai, Railway dashboard check karo aur logs dekho. Wahan exact error dikhega! 🔍
