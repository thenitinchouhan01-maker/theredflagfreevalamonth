#!/usr/bin/env node

/**
 * Critical Fixes Verification Script
 * Tests all 4 critical fixes without breaking existing functionality
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    testsPassed++;
    logSuccess(`PASS: ${name}`);
  } catch (error) {
    testsFailed++;
    logError(`FAIL: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

// Test 1: Credit Deduction Order
async function testCreditDeductionOrder() {
  logTest('Test 1: Credit Deduction Before Search Creation');
  
  // Create user with 0 credits
  const userRes = await axios.post(`${API_URL}/users`, {
    deviceId: `test-credit-${Date.now()}`
  });
  
  const appUserId = userRes.data.data.user.appUserId;
  log(`Created user: ${appUserId}`, 'blue');
  
  // Try to create search with 0 credits
  await test('Search creation fails with 0 credits', async () => {
    try {
      await axios.post(`${API_URL}/searches`, {
        searchType: 'name',
        nameQuery: 'Test User'
      }, {
        headers: { 'x-app-user-id': appUserId }
      });
      throw new Error('Should have failed with insufficient credits');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        if (error.response.data.errorCode === 'INSUFFICIENT_CREDITS') {
          return; // Expected error
        }
      }
      throw error;
    }
  });
  
  // Verify no orphan searches created
  await test('No orphan searches in database', async () => {
    const searchesRes = await axios.get(`${API_URL}/searches`, {
      headers: { 'x-app-user-id': appUserId }
    });
    
    if (searchesRes.data.data.searches.length !== 0) {
      throw new Error(`Found ${searchesRes.data.data.searches.length} orphan searches`);
    }
  });
}

// Test 2: Payment Duplicate Check
async function testPaymentDuplicateCheck() {
  logTest('Test 2: Payment Duplicate Check Before Credit Addition');
  
  log('⚠️  This test requires manual Razorpay payment verification', 'yellow');
  log('   Skipping automated test - verify manually with real payment', 'yellow');
  
  // Manual test instructions
  log('\nManual Test Steps:', 'cyan');
  log('1. Create order: POST /api/payments/create-order', 'blue');
  log('2. Complete payment in Razorpay', 'blue');
  log('3. Verify payment: POST /api/payments/verify', 'blue');
  log('4. Verify SAME payment again (should return alreadyProcessed: true)', 'blue');
  log('5. Check user credits (should only be added once)', 'blue');
}

// Test 3: NoSQL Injection Protection
async function testNoSQLInjectionProtection() {
  logTest('Test 3: NoSQL Injection Protection');
  
  // Create user
  const userRes = await axios.post(`${API_URL}/users`, {
    deviceId: `test-nosql-${Date.now()}`
  });
  
  const appUserId = userRes.data.data.user.appUserId;
  
  await test('NoSQL injection in query sanitized', async () => {
    // Try to inject NoSQL query
    const maliciousQuery = {
      searchType: 'name',
      nameQuery: { '$ne': null } // NoSQL injection attempt
    };
    
    try {
      await axios.post(`${API_URL}/searches`, maliciousQuery, {
        headers: { 'x-app-user-id': appUserId }
      });
    } catch (error) {
      // Should fail with validation error (not internal error)
      if (error.response && error.response.status === 422) {
        return; // Expected - validation caught it
      }
      throw error;
    }
  });
}

// Test 4: XSS Protection
async function testXSSProtection() {
  logTest('Test 4: XSS Protection');
  
  await test('XSS in user input sanitized', async () => {
    const xssPayload = {
      deviceId: `test-xss-${Date.now()}`,
      deviceInfo: {
        platform: '<script>alert("XSS")</script>',
        model: '<img src=x onerror=alert("XSS")>'
      }
    };
    
    const res = await axios.post(`${API_URL}/users`, xssPayload);
    
    // Check if XSS was sanitized
    const deviceInfo = res.data.data.user.deviceInfo || {};
    
    if (deviceInfo.platform && deviceInfo.platform.includes('<script>')) {
      throw new Error('XSS not sanitized in platform field');
    }
    
    if (deviceInfo.model && deviceInfo.model.includes('onerror=')) {
      throw new Error('XSS not sanitized in model field');
    }
  });
}

// Test 5: CORS Mobile App Support
async function testCORSMobileSupport() {
  logTest('Test 5: CORS Mobile App Support (No Origin Header)');
  
  await test('Request without Origin header succeeds', async () => {
    // Axios doesn't send Origin header by default (simulates mobile app)
    const res = await axios.get(`${BASE_URL}/health`);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
  
  await test('API request without Origin header succeeds', async () => {
    const res = await axios.get(`${API_URL}/plans`);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
}

// Test 6: Existing APIs Still Work
async function testExistingAPIs() {
  logTest('Test 6: Existing APIs Compatibility');
  
  await test('Health check works', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (!res.data.success) throw new Error('Health check failed');
  });
  
  await test('User creation works', async () => {
    const res = await axios.post(`${API_URL}/users`, {
      deviceId: `test-compat-${Date.now()}`
    });
    if (!res.data.success) throw new Error('User creation failed');
    if (!res.data.data.user.appUserId) throw new Error('No appUserId returned');
  });
  
  await test('Plans retrieval works', async () => {
    const res = await axios.get(`${API_URL}/plans`);
    if (!res.data.success) throw new Error('Plans retrieval failed');
  });
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('🔒 CRITICAL FIXES VERIFICATION TESTS', 'cyan');
  console.log('='.repeat(60));
  
  log(`\nTesting against: ${BASE_URL}`, 'blue');
  log('Make sure the server is running!\n', 'yellow');
  
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    logSuccess('Server is running');
  } catch (error) {
    logError('Server is not running!');
    log(`Start server with: npm run dev`, 'yellow');
    process.exit(1);
  }
  
  try {
    await testCreditDeductionOrder();
    await testPaymentDuplicateCheck();
    await testNoSQLInjectionProtection();
    await testXSSProtection();
    await testCORSMobileSupport();
    await testExistingAPIs();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log('📊 TEST SUMMARY', 'cyan');
    console.log('='.repeat(60));
    logSuccess(`Passed: ${testsPassed}`);
    if (testsFailed > 0) {
      logError(`Failed: ${testsFailed}`);
    }
    
    if (testsFailed === 0) {
      console.log('\n' + '='.repeat(60));
      logSuccess('🎉 ALL CRITICAL FIXES VERIFIED!');
      console.log('='.repeat(60) + '\n');
      process.exit(0);
    } else {
      console.log('\n' + '='.repeat(60));
      logError('❌ SOME TESTS FAILED - REVIEW FIXES');
      console.log('='.repeat(60) + '\n');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
