# Railway Deployment - Quick Fix Guide (Hindi + English)

## 🔴 Current Problem / Abhi Ka Issue

**URL:** https://deeptrustgfbfbackend-production.up.railway.app/api/health

**Error:**
```
502 Bad Gateway - Application failed to respond
```

**Matlab:** Tumhara backend start nahi ho raha ya crash ho gaya hai.

---

## ✅ Step-by-Step Fix (Ek-Ek Karke)

### Step 1: Railway Dashboard Kholo

1. Yahan jao: **https://railway.app/dashboard**
2. Apna project select karo: **deeptrustgfbfbackend-production**
3. Service pe click karo

### Step 2: Logs Check Karo

**Railway Dashboard mein:**
1. **Logs** tab pe jao
2. Neeche scroll karke latest logs dekho
3. Koi error dikha? Yahan likho:

**Common Errors:**

#### Error A: MongoDB Connection Failed
```
Error: connect ECONNREFUSED
MongooseServerSelectionError: Could not connect to any servers
```

**Fix:**
1. MongoDB Atlas kholo: https://cloud.mongodb.com
2. **Network Access** pe jao
3. **Add IP Address** → `0.0.0.0/0` (Allow from anywhere)
4. **Database Access** → User ko read/write permission do
5. Railway mein `MONGODB_URI` check karo

#### Error B: Missing Environment Variables
```
Error: MONGODB_URI is not defined
Error: Cannot read property 'MONGODB_URI' of undefined
```

**Fix:**
1. Railway Dashboard → **Variables** tab
2. Add karo:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   PORT=3000
   ```

#### Error C: Module Not Found
```
Error: Cannot find module 'express'
Error: Cannot find module './app'
```

**Fix:**
1. `package.json` check karo - sab dependencies hain?
2. Railway mein **Redeploy** karo

#### Error D: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
1. Railway automatically handle karega
2. Bas **Redeploy** karo

### Step 3: Environment Variables Verify Karo

**Railway Dashboard → Variables:**

**Minimum Required:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

**Optional (but recommended):**
```bash
SERPER_API_KEY=your_key_here
R2_BUCKET_NAME=your_bucket
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
```

### Step 4: Deployment Status Check Karo

**Railway Dashboard → Deployments:**

Dekho kya status hai:
- ✅ **Success** - Build successful, deploy successful
- ⏳ **Building** - Wait karo
- ❌ **Failed** - Logs mein error dekho

### Step 5: Redeploy Karo

**Agar kuch fix kiya hai:**
1. Railway Dashboard → **Deployments**
2. Latest deployment pe **⋮** (three dots) click karo
3. **Redeploy** select karo
4. Wait karo 2-3 minutes
5. Phir test karo

---

## 🧪 Testing Commands (Fix Ke Baad)

### Test 1: Health Check
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

**Agar sahi hai to:**
```json
{
  "success": true,
  "message": "DeepTrust API is running"
}
```

### Test 2: Create User
```bash
curl -X POST https://deeptrustgfbfbackend-production.up.railway.app/api/users -H "Content-Type: application/json" -d "{\"deviceId\":\"test-001\"}"
```

### Test 3: Get Plans
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/plans
```

---

## 🔧 Most Common Issues (Sabse Zyada Hone Wale Issues)

### Issue 1: MongoDB Connection Failed ❌

**Symptoms:**
- 502 error
- Logs mein "MongooseServerSelectionError"

**Fix:**
1. MongoDB Atlas → Network Access → Add `0.0.0.0/0`
2. Database Access → User ko permissions do
3. Railway → MONGODB_URI check karo
4. Redeploy karo

### Issue 2: Environment Variables Missing ❌

**Symptoms:**
- 502 error
- Logs mein "undefined" errors

**Fix:**
1. Railway → Variables tab
2. Add karo: `NODE_ENV`, `MONGODB_URI`
3. Auto-redeploy hoga

### Issue 3: Build Failed ❌

**Symptoms:**
- Deployment status "Failed"
- Logs mein build errors

**Fix:**
1. `package.json` check karo
2. All dependencies add karo
3. Redeploy karo

---

## 📋 Quick Checklist (Jaldi Se Check Karo)

Ye sab check karo:

- [ ] Railway deployment "Success" dikha raha hai?
- [ ] Logs mein "Server running on port 3000" dikha?
- [ ] Logs mein "MongoDB connected" dikha?
- [ ] `MONGODB_URI` set hai Railway mein?
- [ ] MongoDB Atlas mein IP `0.0.0.0/0` allowed hai?
- [ ] `package.json` mein "start" script hai?

---

## 🎯 Exact Steps (Bilkul Seedhe Steps)

### Agar MongoDB Error Hai:

1. **MongoDB Atlas kholo**
2. **Network Access** → **Add IP Address**
3. Type karo: `0.0.0.0/0`
4. **Comment:** "Railway Access"
5. **Confirm** karo
6. Railway mein **Redeploy** karo
7. 2 minute wait karo
8. Test karo: `curl https://deeptrustgfbfbackend-production.up.railway.app/api/health`

### Agar Environment Variable Missing Hai:

1. **Railway Dashboard** kholo
2. Service select karo
3. **Variables** tab pe jao
4. **New Variable** click karo
5. Add karo:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://...` (apna connection string)
6. **Add** karo
7. Auto-redeploy hoga
8. Test karo

### Agar Build Failed Hai:

1. **Deployments** tab kholo
2. Failed deployment pe click karo
3. **Logs** dekho - kya error hai?
4. Local mein fix karo
5. Git push karo
6. Railway auto-deploy karega
7. Test karo

---

## 💡 Pro Tips (Kaam Ki Baatein)

1. **Hamesha logs dekho pehle** - Wahan exact error hoga
2. **MongoDB IP whitelist** - Railway ke liye `0.0.0.0/0` use karo
3. **Environment variables** - Double-check spelling aur values
4. **Patience** - Deploy mein 2-3 minute lagta hai
5. **Test locally first** - `npm start` local pe chala ke dekho

---

## 🆘 Agar Phir Bhi Nahi Chala?

### Option 1: Logs Share Karo

Railway Dashboard → Logs → Copy karo aur share karo

### Option 2: Environment Variables Check Karo

Railway Dashboard → Variables → Screenshot lo aur share karo (passwords hide karke)

### Option 3: Deployment Status

Railway Dashboard → Deployments → Latest deployment ka status batao

---

## 📞 Railway CLI (Advanced)

Agar CLI use karna hai:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Check status
railway status
```

---

## ✅ Success Indicators (Sab Sahi Hai Agar)

Ye sab dikhe to sab theek hai:

1. **Railway Logs:**
   ```
   ✅ Server running on port 3000
   ✅ MongoDB connected successfully
   ✅ DeepTrust API is running
   ```

2. **Health Check:**
   ```bash
   curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
   # Returns: {"success": true, "message": "DeepTrust API is running"}
   ```

3. **Deployment Status:**
   ```
   ✅ Build: Success
   ✅ Deploy: Success
   ✅ Status: Running
   ```

---

## 🎯 Action Plan (Abhi Kya Karna Hai)

**Right Now:**

1. ✅ Railway Dashboard kholo
2. ✅ Logs tab pe jao
3. ✅ Latest error dekho
4. ✅ Upar se matching fix dhundo
5. ✅ Fix apply karo
6. ✅ Redeploy karo
7. ✅ Test karo

**Agar Error Samajh Nahi Aaya:**

1. Logs ka screenshot lo
2. Variables ka screenshot lo (passwords hide karke)
3. Share karo - main help karunga

---

Bhai, **Railway Dashboard kholo aur Logs dekho**. Wahan exact error dikhega! 

Logs mein jo bhi error dikhe, usko yahan search karo aur fix apply karo. 

**Most likely:** MongoDB connection issue hai. MongoDB Atlas mein `0.0.0.0/0` IP add karo! 🚀
