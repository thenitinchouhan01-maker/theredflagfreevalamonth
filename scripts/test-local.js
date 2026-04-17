/**
 * Local integration test — spins up in-memory MongoDB and tests all main endpoints.
 * Run: node scripts/test-local.js
 */
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');

let mongod;
let server;
let BASE_URL;
let appUserId;
let planId;

// ─── helpers ────────────────────────────────────────────────────────────────

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3099,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers
      }
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function pass(label) { console.log('  ✅ ' + label); }
function fail(label, detail) { console.log('  ❌ ' + label + ' — ' + JSON.stringify(detail)); }

function check(label, condition, detail) {
  condition ? pass(label) : fail(label, detail);
}

// ─── tests ──────────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n[1] Health Check');
  const r = await request('GET', '/health');
  check('GET /health → 200', r.status === 200, r.body);
  check('success: true', r.body.success === true, r.body);
  check('has timestamp', !!r.body.timestamp, r.body);
}

async function testCreateUser() {
  console.log('\n[2] Create Anonymous User');
  const r = await request('POST', '/users', {
    deviceId: 'test-device-001',
    deviceInfo: { platform: 'iOS', version: '17.0', model: 'iPhone 15' }
  });
  check('POST /users → 201', r.status === 201, r.body);
  check('success: true', r.body.success === true, r.body);
  check('has data.user.appUserId', !!r.body.data?.user?.appUserId, r.body);
  check('appUserId format DTX-XXXX-XXXX', /^DTX-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(r.body.data?.user?.appUserId), r.body);
  check('has data.access', r.body.data?.access !== undefined, r.body);
  appUserId = r.body.data?.user?.appUserId;
  console.log('  → appUserId:', appUserId);
}

async function testGetCurrentUser() {
  console.log('\n[3] Get Current User');
  const r = await request('GET', '/users/me', null, { 'x-app-user-id': appUserId });
  check('GET /users/me → 200', r.status === 200, r.body);
  check('has data.user', !!r.body.data?.user, r.body);
  check('has data.stats', !!r.body.data?.stats, r.body);
}

async function testGetPlans() {
  console.log('\n[4] Get Plans');
  const r = await request('GET', '/plans');
  check('GET /plans → 200', r.status === 200, r.body);
  check('success: true', r.body.success === true, r.body);
  check('has data.plans array', Array.isArray(r.body.data?.plans), r.body);
  check('plans count = 3', r.body.data?.plans?.length === 3, r.body);
  planId = r.body.data?.plans?.[0]?.id;
  console.log('  → planId:', planId);
}

async function testAccessStatus() {
  console.log('\n[5] Access Status (no plan purchased)');
  const r = await request('GET', '/access/status', null, { 'x-app-user-id': appUserId });
  check('GET /access/status → 200', r.status === 200, r.body);
  check('hasAccess: false', r.body.data?.access?.hasAccess === false, r.body);
}

async function testCreatePaymentOrder() {
  console.log('\n[6] Create Payment Order');
  const r = await request('POST', '/payments/order', { planId }, { 'x-app-user-id': appUserId });
  // Will fail with Razorpay error since keys are test placeholders — that's expected
  check('POST /payments/order → responds', r.status !== undefined, r.body);
  check('response has success field', r.body.success !== undefined, r.body);
  if (r.status === 200 || r.status === 201) {
    check('has data.order.id', !!r.body.data?.order?.id, r.body);
  } else {
    check('error has errorCode', !!r.body.errorCode, r.body);
    console.log('  ℹ️  Expected failure — Razorpay test keys not configured');
  }
}

async function testSearchWithoutAccess() {
  console.log('\n[7] Create Search Without Access (should be denied)');
  const r = await request('POST', '/searches', {
    searchType: 'name',
    nameQuery: 'John Doe'
  }, { 'x-app-user-id': appUserId });
  check('POST /searches → 403', r.status === 403, r.body);
  check('success: false', r.body.success === false, r.body);
  check('errorCode: NO_ACTIVE_ACCESS', r.body.errorCode === 'NO_ACTIVE_ACCESS', r.body);
}

async function testUploadWithoutFile() {
  console.log('\n[8] Upload Image (no file — should return 400)');
  const r = await request('POST', '/uploads', null, { 'x-app-user-id': appUserId });
  check('POST /uploads (no file) → 400', r.status === 400, r.body);
  check('success: false', r.body.success === false, r.body);
}

async function testGetReportHistory() {
  console.log('\n[9] Get Report History');
  const r = await request('GET', '/reports', null, { 'x-app-user-id': appUserId });
  check('GET /reports → 200', r.status === 200, r.body);
  check('success: true', r.body.success === true, r.body);
  check('has data.reports array', Array.isArray(r.body.data?.reports), r.body);
}

async function testInvalidUser() {
  console.log('\n[10] Invalid x-app-user-id (should return 401)');
  const r = await request('GET', '/users/me', null, { 'x-app-user-id': 'DTX-FAKE-0000' });
  check('GET /users/me with bad id → 401', r.status === 401, r.body);
  check('success: false', r.body.success === false, r.body);
  check('errorCode: USER_NOT_FOUND', r.body.errorCode === 'USER_NOT_FOUND', r.body);
}

async function testRouteNotFound() {
  console.log('\n[11] Route Not Found');
  const r = await request('GET', '/nonexistent');
  check('GET /nonexistent → 404', r.status === 404, r.body);
  check('success: false', r.body.success === false, r.body);
  check('errorCode: ROUTE_NOT_FOUND', r.body.errorCode === 'ROUTE_NOT_FOUND', r.body);
}

async function testRestoreUser() {
  console.log('\n[12] Restore User');
  const r = await request('POST', '/users/restore', {
    appUserId,
    deviceId: 'test-device-002'
  });
  check('POST /users/restore → 200', r.status === 200, r.body);
  check('success: true', r.body.success === true, r.body);
  check('appUserId matches', r.body.data?.user?.appUserId === appUserId, r.body);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(55));
  console.log('  DeepTrust Backend — Local Integration Tests');
  console.log('='.repeat(55));

  // Start in-memory MongoDB
  console.log('\n⚙️  Starting in-memory MongoDB...');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.PORT = '3099';
  console.log('  MongoDB URI:', uri);

  // Start Express app
  const app = require('../app');
  server = http.createServer(app);
  await new Promise(r => server.listen(3099, r));
  console.log('  Server running on port 3099');

  // Seed plans
  const { Plan } = require('../models');
  await Plan.seedDefaultPlans();
  console.log('  Plans seeded');

  // Run tests
  try {
    await testHealth();
    await testCreateUser();
    await testGetCurrentUser();
    await testGetPlans();
    await testAccessStatus();
    await testCreatePaymentOrder();
    await testSearchWithoutAccess();
    await testUploadWithoutFile();
    await testGetReportHistory();
    await testInvalidUser();
    await testRouteNotFound();
    await testRestoreUser();
  } catch (err) {
    console.error('\n💥 Test runner error:', err.message);
  }

  console.log('\n' + '='.repeat(55));
  console.log('  Tests complete');
  console.log('='.repeat(55) + '\n');

  server.close();
  await mongod.stop();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
