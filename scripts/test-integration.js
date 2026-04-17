require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

let testUserId = null;
let testPlanId = null;
let testUploadId = null;
let testSearchId = null;

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function test(name, fn) {
  try {
    await fn();
    logTest(name, true);
  } catch (error) {
    logTest(name, false, error.message);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  🧪 DeepTrust Backend Integration Tests');
  console.log('='.repeat(60) + '\n');

  // Test 1: Health Check
  await test('Health Check', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error('Health check failed');
    if (!res.data.success) throw new Error('Health check returned success: false');
  });

  // Test 2: Create Anonymous User
  await test('Create Anonymous User', async () => {
    const res = await axios.post(`${BASE_URL}/users`, {
      deviceId: 'test-device-' + Date.now(),
      deviceInfo: {
        platform: 'iOS',
        version: '17.0',
        model: 'iPhone 15'
      }
    });
    if (res.status !== 201) throw new Error('User creation failed');
    if (!res.data.data.user.appUserId) throw new Error('No appUserId returned');
    testUserId = res.data.data.user.appUserId;
    console.log(`   User ID: ${testUserId}`);
  });

  // Test 3: Get Current User
  await test('Get Current User', async () => {
    const res = await axios.get(`${BASE_URL}/users/me`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Get user failed');
    if (res.data.data.user.appUserId !== testUserId) throw new Error('User ID mismatch');
  });

  // Test 4: Get Plans
  await test('Get Plans', async () => {
    const res = await axios.get(`${BASE_URL}/plans`);
    if (res.status !== 200) throw new Error('Get plans failed');
    if (!res.data.data.plans || res.data.data.plans.length === 0) {
      throw new Error('No plans returned');
    }
    testPlanId = res.data.data.plans[0].id;
    console.log(`   Found ${res.data.data.plans.length} plans`);
  });

  // Test 5: Check Access Status (should be no access)
  await test('Check Access Status (No Access)', async () => {
    const res = await axios.get(`${BASE_URL}/access/status`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Access status check failed');
    if (res.data.data.access.hasAccess !== false) {
      throw new Error('User should not have access initially');
    }
  });

  // Test 6: Create Payment Order (should fail gracefully - Razorpay not configured)
  await test('Create Payment Order (Expected to fail - Razorpay not configured)', async () => {
    try {
      await axios.post(`${BASE_URL}/payments/order`, 
        { planId: testPlanId },
        { headers: { 'x-app-user-id': testUserId } }
      );
      throw new Error('Should have failed without Razorpay credentials');
    } catch (error) {
      if (error.response && error.response.data.errorCode === 'PAYMENT_NOT_AVAILABLE') {
        // Expected error
        return;
      }
      throw error;
    }
  });

  // Test 7: Try Search Without Access (should fail)
  await test('Try Search Without Access (Expected to fail)', async () => {
    try {
      await axios.post(`${BASE_URL}/searches`,
        { searchType: 'name', nameQuery: 'John Doe' },
        { headers: { 'x-app-user-id': testUserId } }
      );
      throw new Error('Should have failed without access');
    } catch (error) {
      if (error.response && error.response.data.errorCode === 'NO_ACTIVE_ACCESS') {
        // Expected error
        return;
      }
      throw error;
    }
  });

  // Test 8: Upload Image (R2 Integration Test)
  await test('Upload Image to R2', async () => {
    // Create a simple test image buffer (1x1 PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const form = new FormData();
    form.append('image', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const res = await axios.post(`${BASE_URL}/uploads`, form, {
      headers: {
        ...form.getHeaders(),
        'x-app-user-id': testUserId
      }
    });

    if (res.status !== 201) throw new Error('Upload failed');
    if (!res.data.data.upload.fileUrl) throw new Error('No file URL returned');
    testUploadId = res.data.data.upload.id;
    console.log(`   Upload ID: ${testUploadId}`);
    console.log(`   File URL: ${res.data.data.upload.fileUrl}`);
  });

  // Test 9: Get User Uploads
  await test('Get User Uploads', async () => {
    const res = await axios.get(`${BASE_URL}/uploads`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Get uploads failed');
    if (!res.data.data.uploads || res.data.data.uploads.length === 0) {
      throw new Error('No uploads returned');
    }
    console.log(`   Found ${res.data.data.uploads.length} upload(s)`);
  });

  // Test 10: Get Upload by ID
  await test('Get Upload by ID', async () => {
    const res = await axios.get(`${BASE_URL}/uploads/${testUploadId}`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Get upload by ID failed');
    if (res.data.data.upload.id !== testUploadId) throw new Error('Upload ID mismatch');
  });

  // Test 11: Get User Stats
  await test('Get User Stats', async () => {
    const res = await axios.get(`${BASE_URL}/users/me/stats`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Get stats failed');
    if (typeof res.data.data.stats.searches !== 'number') {
      throw new Error('Invalid stats format');
    }
  });

  // Test 12: Restore User
  await test('Restore User', async () => {
    const res = await axios.post(`${BASE_URL}/users/restore`, {
      appUserId: testUserId,
      deviceId: 'new-device-' + Date.now()
    });
    if (res.status !== 200) throw new Error('User restore failed');
    if (res.data.data.user.appUserId !== testUserId) throw new Error('User ID mismatch');
  });

  // Test 13: Delete Upload
  await test('Delete Upload from R2', async () => {
    const res = await axios.delete(`${BASE_URL}/uploads/${testUploadId}`, {
      headers: { 'x-app-user-id': testUserId }
    });
    if (res.status !== 200) throw new Error('Delete upload failed');
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`  Total Tests:  ${testResults.passed + testResults.failed}`);
  console.log(`  ✅ Passed:    ${testResults.passed}`);
  console.log(`  ❌ Failed:    ${testResults.failed}`);
  console.log('='.repeat(60) + '\n');

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    console.log('');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running, starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running on port 3000');
    console.error('   Please start the server first: npm run dev');
    process.exit(1);
  });
