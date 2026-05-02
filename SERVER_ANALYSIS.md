# Complete server.js Analysis

## 1. PORT Configuration

**Line 11:**
```javascript
const PORT = parseInt(process.env.PORT) || config.port || 3000;
```

**Explanation:**
- First tries: `process.env.PORT` (Railway sets this to 8080)
- Fallback 1: `config.port` (from env config)
- Fallback 2: `3000` (hardcoded default)

**On Railway:** PORT = 8080 (from Railway's environment variable)

---

## 2. app.listen() Code - PRODUCTION

**Lines 135-156 (Production Mode):**

```javascript
if (process.env.NODE_ENV === 'production') {
  // Railway provides exact port - don't search for alternatives
  server = app.listen(PORT, '0.0.0.0', () => {
    const configSummary = getConfigSummary();
    
    console.log('\n' + '='.repeat(60));
    console.log('  🚀 DeepTrust API Server Started (Railway)');
    console.log('='.repeat(60));
    console.log(`  Environment:     ${configSummary.environment}`);
    console.log(`  Port:            ${PORT}`);
    console.log(`  Database:        ${configSummary.database}`);
    console.log(`  Razorpay:        ${configSummary.razorpay}`);
    console.log(`  Storage:         ${configSummary.storage}`);
    console.log(`  CORS:            ${configSummary.cors}`);
    console.log('='.repeat(60));
    console.log(`  Health Check:    /health`);
    console.log(`  API Base:        /api`);
    console.log('='.repeat(60) + '\n');
    
    logger.info('DeepTrust API server running on Railway', {
      port: PORT,
      environment: config.nodeEnv
    });
  });
}
```

**Key Points:**
- ✅ Binds to `'0.0.0.0'` (all network interfaces)
- ✅ Uses PORT from Railway (8080)
- ✅ Production mode only

---

## 3. app.listen() Code - DEVELOPMENT

**Lines 158-186 (Development Mode):**

```javascript
else {
  // Development: Find available port
  const availablePort = await findAvailablePort(PORT);
  
  if (availablePort !== PORT) {
    console.log(`\n⚠️  Port ${PORT} is already in use. Using port ${availablePort} instead.\n`);
    logger.warn(`Port ${PORT} in use, switching to ${availablePort}`);
  }
  
  server = app.listen(availablePort, () => {
    const configSummary = getConfigSummary();
    
    console.log('\n' + '='.repeat(60));
    console.log('  🚀 DeepTrust API Server Started');
    console.log('='.repeat(60));
    console.log(`  Environment:     ${configSummary.environment}`);
    console.log(`  Port:            ${availablePort}`);
    console.log(`  Database:        ${configSummary.database}`);
    console.log(`  Razorpay:        ${configSummary.razorpay}`);
    console.log(`  Storage:         ${configSummary.storage}`);
    console.log(`  CORS:            ${configSummary.cors}`);
    console.log(`  Real Credentials: ${configSummary.hasRealCredentials ? '✅ Yes' : '⚠️  No (using test values)'}`);
    console.log('='.repeat(60));
    console.log(`  Health Check:    http://localhost:${availablePort}/health`);
    console.log(`  API Base:        http://localhost:${availablePort}/api`);
    console.log('='.repeat(60) + '\n');
    
    logger.info('DeepTrust API server running', {
      port: availablePort,
      environment: config.nodeEnv,
      hasRealCredentials: configSummary.hasRealCredentials
    });
  });
}
```

**Key Points:**
- ❌ Does NOT bind to `'0.0.0.0'` (binds to default localhost)
- ✅ Finds available port if default is in use
- ✅ Development mode only

---

## 4. Root Route "/" - YES

**Location:** app.js (Lines 85-91)

```javascript
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DeepTrust API is running',
    version: '1.0.0'
  });
});
```

**Response:**
```json
{
  "success": true,
  "message": "DeepTrust API is running",
  "version": "1.0.0"
}
```

---

## 5. /health Route - YES

**Location:** app.js (Lines 93-99)

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'OK'
  });
});
```

**Response:**
```json
{
  "success": true,
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "OK"
}
```

---

## 6. Server Binding to '0.0.0.0'?

### ✅ YES - In Production

**Line 135:**
```javascript
server = app.listen(PORT, '0.0.0.0', () => {
```

**Explanation:**
- Production mode (NODE_ENV=production)
- Binds to `'0.0.0.0'` (all network interfaces)
- Allows external connections
- Railway can route traffic to it

### ❌ NO - In Development

**Line 166:**
```javascript
server = app.listen(availablePort, () => {
```

**Explanation:**
- Development mode
- No second parameter = binds to default (localhost/127.0.0.1)
- Only local connections allowed
- Not accessible externally

---

## Summary Table

| Question | Answer | Location |
|----------|--------|----------|
| **PORT used** | `process.env.PORT` (8080 on Railway) | Line 11 |
| **Production binding** | `'0.0.0.0'` ✅ | Line 135 |
| **Development binding** | Default (localhost) ❌ | Line 166 |
| **Root route "/"** | YES ✅ | app.js Line 85 |
| **Health route "/health"** | YES ✅ | app.js Line 93 |

---

## Current Railway Setup

**On Railway (Production):**
```
NODE_ENV = production
PORT = 8080 (set by Railway)

Server binds to: 0.0.0.0:8080 ✅
External access: Should work ✅
```

**Routes Available:**
```
GET /                    → "DeepTrust API is running"
GET /health              → Health check with uptime
GET /api/health          → API health check
GET /api/*               → All API routes
```

---

## Why 502 Might Still Occur

Even though:
- ✅ Server binds to `0.0.0.0`
- ✅ PORT is correct (8080)
- ✅ Routes exist (`/` and `/health`)
- ✅ Server starts successfully

**Possible reasons for 502:**

1. **Railway proxy configuration** - Needs `railway.json` and `Procfile`
2. **Health check path mismatch** - Railway might be checking wrong path
3. **Startup timing** - Server might not be ready when Railway checks
4. **Network configuration** - Railway's internal routing issue

**Solution:** The `railway.json` and `Procfile` files we created should fix this.

---

## Verification Commands

### Test Root Route:
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/
```

### Test Health Route:
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/health
```

### Test API Health Route:
```bash
curl https://deeptrustgfbfbackend-production.up.railway.app/api/health
```

All three should work after deploying `railway.json` and `Procfile`.
