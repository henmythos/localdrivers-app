import { createClient } from '@libsql/client';
import fs from 'fs';

// Helper to mock req/res for Vercel Serverless Function handlers
function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(data) { this.body = data; this.ended = true; return this; },
    end() { this.ended = true; return this; }
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING LOCALDRIVERS CRITICAL API & WORKFLOW AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Test Health Endpoint
  try {
    const { default: healthHandler } = await import('../api/health.ts');
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await healthHandler(req, res);
    console.log(`[PASS] Health check returned HTTP ${res.statusCode}:`, res.body?.status);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Health check failed:`, err);
    failed++;
  }

  // 2. Test Get Drivers Endpoint
  try {
    const { default: driversHandler } = await import('../api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await driversHandler(req, res);
    console.log(`[PASS] GET /api/drivers returned HTTP ${res.statusCode}, count:`, res.body?.count);
    passed++;
  } catch (err) {
    console.error(`[FAIL] GET /api/drivers failed:`, err);
    failed++;
  }

  // 3. Test Driver Registration Endpoint (New Driver)
  const testPhone = '9988776655';
  let registeredDriverId = '';
  try {
    const { default: registerHandler } = await import('../api/drivers/register.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'Suresh Reddy',
        phone: testPhone,
        email: 'suresh@test.com',
        area: 'Madhapur',
        city: 'Hyderabad',
        experienceYears: 4,
        languages: ['Telugu', 'Hindi', 'English'],
        services: ['City Driver', 'Outstation Driver'],
        vehicleCategories: ['Manual', 'Automatic'],
        description: 'Punctual & experienced chauffeur',
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        documents: [
          { type: 'Aadhaar Card (Front)', url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' },
          { type: 'Driving Licence (Front)', url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
        ]
      }
    };
    const res = createMockRes();
    await registerHandler(req, res);
    if (res.statusCode === 200 && res.body?.success) {
      registeredDriverId = res.body.driverId;
      console.log(`[PASS] POST /api/drivers/register: Successfully registered ${res.body.driverCode} (ID: ${registeredDriverId})`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] POST /api/drivers/register failed:`, err.message || err);
    failed++;
  }

  // 4. Test Idempotent Retry on Same Phone Number (Duplicate prevention)
  try {
    const { default: registerHandler } = await import('../api/drivers/register.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'Suresh Reddy (Updated)',
        phone: testPhone,
        area: 'Gachibowli',
        experienceYears: 5
      }
    };
    const res = createMockRes();
    await registerHandler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.driverId === registeredDriverId) {
      console.log(`[PASS] Idempotent Registration Retry: Updated application without duplicate row.`);
      passed++;
    } else {
      throw new Error(`Unexpected retry result: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Idempotent registration retry failed:`, err.message || err);
    failed++;
  }

  // 5. Test Driver Login while Pending (Should be blocked with clean 403 status)
  try {
    const { default: loginHandler } = await import('../api/drivers/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { identifier: testPhone, password: testPhone }
    };
    const res = createMockRes();
    await loginHandler(req, res);
    if (res.statusCode === 403 && res.body?.status === 'Pending') {
      console.log(`[PASS] Driver login while Pending correctly blocked with status: ${res.body.status}`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Driver login pending check failed:`, err.message || err);
    failed++;
  }

  // 6. Test Admin Pending Drivers Queue (Must show registered driver)
  try {
    const { default: pendingHandler } = await import('../api/admin/pending-drivers.ts');
    const req = {
      method: 'GET',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token' }
    };
    const res = createMockRes();
    await pendingHandler(req, res);
    const found = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && found) {
      console.log(`[PASS] GET /api/admin/pending-drivers: Found registered driver ${registeredDriverId} in approval queue.`);
      passed++;
    } else {
      throw new Error(`Driver not found in pending list. Total pending: ${res.body?.drivers?.length}`);
    }
  } catch (err) {
    console.error(`[FAIL] Admin pending-drivers queue check failed:`, err.message || err);
    failed++;
  }

  // 7. Test Admin Approval Workflow
  try {
    const { default: approveHandler } = await import('../api/admin/approve.ts');
    const req = {
      method: 'POST',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token', 'content-type': 'application/json' },
      body: { driverId: registeredDriverId }
    };
    const res = createMockRes();
    await approveHandler(req, res);
    if (res.statusCode === 200 && res.body?.success) {
      console.log(`[PASS] POST /api/admin/approve: Successfully approved driver ${registeredDriverId}.`);
      passed++;
    } else {
      throw new Error(`Approval failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Admin approval workflow failed:`, err.message || err);
    failed++;
  }

  // 8. Test Driver Login after Approval (Should succeed with JWT token)
  try {
    const { default: loginHandler } = await import('../api/drivers/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { identifier: testPhone, password: testPhone }
    };
    const res = createMockRes();
    await loginHandler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.token) {
      console.log(`[PASS] Driver Login after Approval: Succeeded, token issued.`);
      passed++;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Driver login after approval failed:`, err.message || err);
    failed++;
  }

  // 9. Test Approved Driver appears in Customer Discovery
  try {
    const { default: driversHandler } = await import('../api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await driversHandler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && inDiscovery) {
      console.log(`[PASS] Customer Driver Discovery: Approved driver ${registeredDriverId} is visible to customers.`);
      passed++;
    } else {
      throw new Error(`Approved driver not found in discovery list.`);
    }
  } catch (err) {
    console.error(`[FAIL] Customer driver discovery check failed:`, err.message || err);
    failed++;
  }

  // 10. Test Admin Reject Workflow on Another Driver
  const rejectPhone = '9911223344';
  let rejectDriverId = '';
  try {
    const { default: registerHandler } = await import('../api/drivers/register.ts');
    const regReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Incomplete Candidate', phone: rejectPhone }
    };
    const regRes = createMockRes();
    await registerHandler(regReq, regRes);
    rejectDriverId = regRes.body?.driverId;

    const { default: rejectHandler } = await import('../api/admin/reject.ts');
    const rejReq = {
      method: 'POST',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token', 'content-type': 'application/json' },
      body: { driverId: rejectDriverId, reason: 'Unreadable licence scan' }
    };
    const rejRes = createMockRes();
    await rejectHandler(rejReq, rejRes);
    if (rejRes.statusCode === 200 && rejRes.body?.success) {
      console.log(`[PASS] POST /api/admin/reject: Successfully rejected candidate ${rejectDriverId}.`);
      passed++;
    } else {
      throw new Error(`Rejection failed: ${JSON.stringify(rejRes.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Admin reject workflow failed:`, err.message || err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED.`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
