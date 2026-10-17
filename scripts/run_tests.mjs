import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

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

async function loadHandler(filePath) {
  const outPath = path.resolve('scratch', path.basename(filePath).replace('.ts', '.bundle.mjs'));
  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch', { recursive: true });

  await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: outPath,
    external: ['@libsql/client', '@libsql/client/web', '@aws-sdk/client-s3']
  });

  const mod = await import(`file://${outPath}?t=${Date.now()}`);
  return mod.default;
}

async function main() {
  console.log('====================================================');
  console.log('RUNNING LOCALDRIVERS CRITICAL API & WORKFLOW SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Generate unique test numbers per run
  const runId = Date.now().toString().slice(-8);
  const testPhone = `98${runId}`;
  const rejectPhone = `97${runId}`;

  // 1. Health check
  try {
    const handler = await loadHandler('api/health.ts');
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    console.log(`[PASS] 1. GET /api/health returned HTTP ${res.statusCode}:`, res.body?.status);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 1. GET /api/health failed:`, err.message || err);
    failed++;
  }

  // 2. GET /api/drivers
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    console.log(`[PASS] 2. GET /api/drivers returned HTTP ${res.statusCode}, count:`, res.body?.count);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 2. GET /api/drivers failed:`, err.message || err);
    failed++;
  }

  // 3. POST /api/drivers/register
  let registeredDriverId = '';
  try {
    const handler = await loadHandler('api/drivers/register.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'Suresh Reddy',
        phone: testPhone,
        email: `suresh_${runId}@test.com`,
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
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success) {
      registeredDriverId = res.body.driverId;
      console.log(`[PASS] 3. POST /api/drivers/register: Successfully registered ${res.body.driverCode} (ID: ${registeredDriverId})`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 3. POST /api/drivers/register failed:`, err.message || err);
    failed++;
  }

  // 4. Test Idempotent Retry on Same Phone Number (Duplicate prevention)
  try {
    const handler = await loadHandler('api/drivers/register.ts');
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
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.driverId === registeredDriverId) {
      console.log(`[PASS] 4. Idempotent Registration Retry: Updated application without duplicate row.`);
      passed++;
    } else {
      throw new Error(`Unexpected retry result: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 4. Idempotent registration retry failed:`, err.message || err);
    failed++;
  }

  // 5. Test Driver Login while Pending (Should be blocked with clean 403 status)
  try {
    const handler = await loadHandler('api/drivers/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { identifier: testPhone, password: testPhone }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 403 && res.body?.status === 'Pending') {
      console.log(`[PASS] 5. Driver login while Pending correctly blocked with status: ${res.body.status}`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 5. Driver login pending check failed:`, err.message || err);
    failed++;
  }

  // 6. Test Admin Pending Drivers Queue (Must show registered driver)
  try {
    const handler = await loadHandler('api/admin/pending-drivers.ts');
    const req = {
      method: 'GET',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token' }
    };
    const res = createMockRes();
    await handler(req, res);
    const found = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && found) {
      console.log(`[PASS] 6. GET /api/admin/pending-drivers: Found registered driver ${registeredDriverId} in approval queue.`);
      passed++;
    } else {
      throw new Error(`Driver not found in pending list. Total pending: ${res.body?.drivers?.length}`);
    }
  } catch (err) {
    console.error(`[FAIL] 6. Admin pending-drivers queue check failed:`, err.message || err);
    failed++;
  }

  // 7. Test Admin Approval Workflow
  try {
    const handler = await loadHandler('api/admin/approve.ts');
    const req = {
      method: 'POST',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token', 'content-type': 'application/json' },
      body: { driverId: registeredDriverId }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success) {
      console.log(`[PASS] 7. POST /api/admin/approve: Successfully approved driver ${registeredDriverId}.`);
      passed++;
    } else {
      throw new Error(`Approval failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 7. Admin approval workflow failed:`, err.message || err);
    failed++;
  }

  // 8. Test Driver Login after Approval (Should succeed with JWT token)
  try {
    const handler = await loadHandler('api/drivers/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { identifier: testPhone, password: testPhone }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.token) {
      console.log(`[PASS] 8. Driver Login after Approval: Succeeded, token issued.`);
      passed++;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 8. Driver login after approval failed:`, err.message || err);
    failed++;
  }

  // 9. Test Approved Driver appears in Customer Discovery
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && inDiscovery) {
      console.log(`[PASS] 9. Customer Driver Discovery: Approved driver ${registeredDriverId} is visible to customers.`);
      passed++;
    } else {
      throw new Error(`Approved driver not found in discovery list.`);
    }
  } catch (err) {
    console.error(`[FAIL] 9. Customer driver discovery check failed:`, err.message || err);
    failed++;
  }

  // 10. Test Admin Reject Workflow on Another Driver
  let rejectDriverId = '';
  try {
    const regHandler = await loadHandler('api/drivers/register.ts');
    const regReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Incomplete Candidate', phone: rejectPhone }
    };
    const regRes = createMockRes();
    await regHandler(regReq, regRes);
    rejectDriverId = regRes.body?.driverId;

    const rejHandler = await loadHandler('api/admin/reject.ts');
    const rejReq = {
      method: 'POST',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token', 'content-type': 'application/json' },
      body: { driverId: rejectDriverId, reason: 'Unreadable licence scan' }
    };
    const rejRes = createMockRes();
    await rejHandler(rejReq, rejRes);
    if (rejRes.statusCode === 200 && rejRes.body?.success) {
      console.log(`[PASS] 10. POST /api/admin/reject: Successfully rejected candidate ${rejectDriverId}.`);
      passed++;
    } else {
      throw new Error(`Rejection failed: ${JSON.stringify(rejRes.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 10. Admin reject workflow failed:`, err.message || err);
    failed++;
  }

  // Cleanup scratch
  if (fs.existsSync('scratch')) {
    fs.rmSync('scratch', { recursive: true, force: true });
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED.`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

main();
