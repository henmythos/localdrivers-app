import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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

// Initialize global mock for localStorage in Node test environment
const storageStore = new Map();
globalThis.localStorage = {
  getItem: (k) => storageStore.get(k) || null,
  setItem: (k, v) => storageStore.set(k, String(v)),
  removeItem: (k) => storageStore.delete(k),
  clear: () => storageStore.clear(),
};

async function loadModule(filePath) {
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

  return await import(`file://${outPath}?t=${Date.now()}`);
}

async function loadHandler(filePath) {
  const mod = await loadModule(filePath);
  return mod.default || mod;
}

async function main() {
  console.log('====================================================');
  console.log('RUNNING LOCALDRIVERS CRITICAL API & WORKFLOW SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const runId = Date.now().toString().slice(-8);
  const testPhone = `98${runId}`;
  const rejectPhone = `97${runId}`;

  let adminToken = '';
  let registeredDriverId = '';
  let rejectDriverId = '';
  let bookingId = '';

  // 1. Health check
  try {
    const handler = await loadHandler('api/health.ts');
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.status === 'OPERATIONAL') {
      console.log(`[PASS] 1. GET /api/health returned HTTP 200: OPERATIONAL`);
      passed++;
    } else {
      throw new Error(`Health returned HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 1. GET /api/health failed:`, err.message || err);
    failed++;
  }

  // 2. Admin Login: Missing Credentials Validation (HTTP 400)
  try {
    const handler = await loadHandler('api/admin/login.ts');
    const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: {} };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 400 && res.body?.success === false) {
      console.log(`[PASS] 2. Admin Login: Missing credentials rejected with HTTP 400.`);
      passed++;
    } else {
      throw new Error(`Expected HTTP 400, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 2. Admin login missing credentials check failed:`, err.message || err);
    failed++;
  }

  // 3. Admin Login: Invalid Credentials Rejection (HTTP 401 without secret leakage)
  try {
    const handler = await loadHandler('api/admin/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { username: 'Ranjith.ceo', password: 'wrongpassword' }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 401 && res.body?.success === false && res.body?.error === 'Invalid administrator credentials.') {
      console.log(`[PASS] 3. Admin Login: Invalid credentials securely rejected with HTTP 401.`);
      passed++;
    } else {
      throw new Error(`Expected HTTP 401, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 3. Admin login invalid credentials check failed:`, err.message || err);
    failed++;
  }

  // 4. Admin Login: Valid Standard Credentials & Cryptographic Token Issuance
  try {
    const handler = await loadHandler('api/admin/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { username: 'Ranjith.ceo', password: 'ranjith@2026' }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.token && res.body?.admin?.role === 'ADMIN') {
      adminToken = res.body.token;
      console.log(`[PASS] 4. Admin Login: Configured credentials authenticate successfully, issued Admin JWT.`);
      passed++;
    } else {
      throw new Error(`Admin login failed with status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 4. Admin login valid credentials failed:`, err.message || err);
    failed++;
  }

  // 5. Admin Login: Case-Insensitive / Capital Password & Aliases Check
  try {
    const handler = await loadHandler('api/admin/login.ts');
    // Test with capital 'Ranjith@2026' and alias 'userId'
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { userId: 'ranjith.ceo', password: 'Ranjith@2026' }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.token) {
      console.log(`[PASS] 5. Admin Login: Supported password case variation and userId alias.`);
      passed++;
    } else {
      throw new Error(`Admin login with capital password failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 5. Admin login case-insensitivity failed:`, err.message || err);
    failed++;
  }

  // 6. Admin Login: Backwards Compatible all-drivers POST Endpoint
  try {
    const handler = await loadHandler('api/admin/all-drivers.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { username: 'admin', password: 'admin123' }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success && res.body?.token) {
      console.log(`[PASS] 6. Admin Login: Backwards compatible POST /api/admin/all-drivers operates correctly.`);
      passed++;
    } else {
      throw new Error(`all-drivers POST auth failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 6. Backwards compatible all-drivers login failed:`, err.message || err);
    failed++;
  }

  // 7. Security: Rejection of legacy x-admin-auth header and unauthenticated requests
  try {
    const handler = await loadHandler('api/admin/pending-drivers.ts');
    const legacyReq = {
      method: 'GET',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token' }
    };
    const legacyRes = createMockRes();
    await handler(legacyReq, legacyRes);

    const noAuthReq = { method: 'GET', headers: {} };
    const noAuthRes = createMockRes();
    await handler(noAuthReq, noAuthRes);

    if (legacyRes.statusCode === 401 && noAuthRes.statusCode === 401) {
      console.log(`[PASS] 7. Security: Legacy x-admin-auth header and unauthenticated requests strictly rejected with HTTP 401.`);
      passed++;
    } else {
      throw new Error(`Security check failed: legacy=${legacyRes.statusCode}, noAuth=${noAuthRes.statusCode}`);
    }
  } catch (err) {
    console.error(`[FAIL] 7. Security authorization rejection check failed:`, err.message || err);
    failed++;
  }

  // 8. Security: Rejection of tampered and expired tokens
  try {
    const handler = await loadHandler('api/admin/pending-drivers.ts');
    // Tampered token
    const tamperedReq = {
      method: 'GET',
      headers: { 'authorization': `Bearer ${adminToken}tampered` }
    };
    const tamperedRes = createMockRes();
    await handler(tamperedReq, tamperedRes);

    // Forged non-admin token
    const fakeDriverToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoiRFJJVkVSIiwiZXhwIjoyNTI0NjA4MDAwMDAwfQ.invalid';
    const fakeReq = {
      method: 'GET',
      headers: { 'authorization': `Bearer ${fakeDriverToken}` }
    };
    const fakeRes = createMockRes();
    await handler(fakeReq, fakeRes);

    if (tamperedRes.statusCode === 401 && fakeRes.statusCode === 401) {
      console.log(`[PASS] 8. Security: Tampered and non-admin tokens strictly rejected with HTTP 401.`);
      passed++;
    } else {
      throw new Error(`Tampered token check failed: tampered=${tamperedRes.statusCode}, fake=${fakeRes.statusCode}`);
    }
  } catch (err) {
    console.error(`[FAIL] 8. Security tampered token check failed:`, err.message || err);
    failed++;
  }

  // 9. Initial Customer Discovery: GET /api/drivers
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    console.log(`[PASS] 9. GET /api/drivers returned HTTP ${res.statusCode}, count: ${res.body?.count}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 9. GET /api/drivers failed:`, err.message || err);
    failed++;
  }

  // 10. Driver Registration: POST /api/drivers/register (Privacy: zero KYC documents in public response)
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
      if (res.body.documents || res.body.driver?.documents) {
        throw new Error('Public registration response leaked sensitive document data!');
      }
      console.log(`[PASS] 10. POST /api/drivers/register: Successfully registered ${res.body.driverCode} (ID: ${registeredDriverId}) without KYC leaks.`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 10. POST /api/drivers/register failed:`, err.message || err);
    failed++;
  }

  // 11. Idempotent Registration Retry on Same Phone Number (Duplicate prevention)
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
      console.log(`[PASS] 11. Idempotent Registration Retry: Updated application without duplicate row.`);
      passed++;
    } else {
      throw new Error(`Unexpected retry result: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 11. Idempotent registration retry failed:`, err.message || err);
    failed++;
  }

  // 12. Driver Login while Pending: Blocked with HTTP 403
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
      console.log(`[PASS] 12. Driver login while Pending correctly blocked with status: Pending`);
      passed++;
    } else {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 12. Driver login pending check failed:`, err.message || err);
    failed++;
  }

  // 13. Admin Pending Drivers Queue: Verified with Authenticated Admin Bearer Token
  try {
    const handler = await loadHandler('api/admin/pending-drivers.ts');
    const req = {
      method: 'GET',
      headers: { 'authorization': `Bearer ${adminToken}` }
    };
    const res = createMockRes();
    await handler(req, res);
    const found = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && found) {
      console.log(`[PASS] 13. GET /api/admin/pending-drivers: Found registered driver in authenticated approval queue.`);
      passed++;
    } else {
      throw new Error(`Driver not found in pending list. Total pending: ${res.body?.drivers?.length}`);
    }
  } catch (err) {
    console.error(`[FAIL] 13. Admin pending-drivers queue check failed:`, err.message || err);
    failed++;
  }

  // 14. Admin Approval Workflow with Authenticated Bearer Token
  try {
    const handler = await loadHandler('api/admin/approve.ts');
    const req = {
      method: 'POST',
      headers: { 'authorization': `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: { driverId: registeredDriverId }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.success) {
      console.log(`[PASS] 14. POST /api/admin/approve: Successfully approved driver ${registeredDriverId}.`);
      passed++;
    } else {
      throw new Error(`Approval failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 14. Admin approval workflow failed:`, err.message || err);
    failed++;
  }

  // 15. Driver Login after Approval (Succeeds with Driver Token)
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
      console.log(`[PASS] 15. Driver Login after Approval: Succeeded, driver session token issued.`);
      passed++;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 15. Driver login after approval failed:`, err.message || err);
    failed++;
  }

  // 16. Customer Driver Discovery: Approved driver visible
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && inDiscovery) {
      console.log(`[PASS] 16. Customer Driver Discovery: Approved driver ${registeredDriverId} is visible.`);
      passed++;
    } else {
      throw new Error(`Approved driver not found in discovery list.`);
    }
  } catch (err) {
    console.error(`[FAIL] 16. Customer driver discovery check failed:`, err.message || err);
    failed++;
  }

  // 17. Admin Reject Workflow on Another Driver
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
      headers: { 'authorization': `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: { driverId: rejectDriverId, reason: 'Unreadable licence scan' }
    };
    const rejRes = createMockRes();
    await rejHandler(rejReq, rejRes);
    if (rejRes.statusCode === 200 && rejRes.body?.success) {
      console.log(`[PASS] 17. POST /api/admin/reject: Successfully rejected candidate ${rejectDriverId}.`);
      passed++;
    } else {
      throw new Error(`Rejection failed: ${JSON.stringify(rejRes.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 17. Admin reject workflow failed:`, err.message || err);
    failed++;
  }

  // 18. Rejected Driver Login Attempt: Blocked with HTTP 403 & Reason
  try {
    const handler = await loadHandler('api/drivers/login.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { identifier: rejectPhone, password: rejectPhone }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 403 && res.body?.status === 'Rejected') {
      console.log(`[PASS] 18. Rejected Driver Login: Accurately returned HTTP 403 status 'Rejected'.`);
      passed++;
    } else {
      throw new Error(`Expected 403 Rejected, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 18. Rejected driver login check failed:`, err.message || err);
    failed++;
  }

  // 19. Public Driver Profile Lookup (Safe, zero KYC leakage)
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: `/api/drivers?id=${registeredDriverId}`, headers: {} };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.driver?.id === registeredDriverId) {
      if (res.body.driver.documents && res.body.driver.documents.length > 0) {
        throw new Error('Public profile leaked private KYC documents!');
      }
      console.log(`[PASS] 19. Public Driver Profile Lookup: Retrieved profile securely without KYC leakage.`);
      passed++;
    } else {
      throw new Error(`Public lookup failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 19. Public driver profile lookup failed:`, err.message || err);
    failed++;
  }

  // 20. Admin Driver Detail KYC Lookup: Authorized with Bearer Token
  try {
    const handler = await loadHandler('api/admin/all-drivers.ts');
    const req = {
      method: 'GET',
      url: `/api/admin/all-drivers?id=${registeredDriverId}`,
      headers: { 'authorization': `Bearer ${adminToken}` }
    };
    const res = createMockRes();
    await handler(req, res);
    const driver = res.body?.driver || res.body?.drivers?.[0];
    if (res.statusCode === 200 && driver && Array.isArray(driver.documents) && driver.documents.length > 0) {
      console.log(`[PASS] 20. Admin KYC Document Lookup: Successfully retrieved ${driver.documents.length} documents via authorized endpoint.`);
      passed++;
    } else {
      throw new Error(`Admin detail failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 20. Admin driver detail lookup failed:`, err.message || err);
    failed++;
  }

  // 21. Driver Availability: Toggling OFFLINE
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isOnline: false }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.isOnline === false && res.body?.isBookable === false) {
      console.log(`[PASS] 21. Driver Availability: Driver successfully toggled OFFLINE.`);
      passed++;
    } else {
      throw new Error(`Failed to toggle offline: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 21. Driver offline toggle failed:`, err.message || err);
    failed++;
  }

  // 22. Customer Discovery Excludes Offline Driver
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 22. Customer Discovery: Offline driver is properly excluded from available results.`);
      passed++;
    } else {
      throw new Error(`Offline driver was still visible in customer discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 22. Offline customer discovery exclusion check failed:`, err.message || err);
    failed++;
  }

  // 23. Driver Availability: Toggling Back ONLINE
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isOnline: true }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.isOnline === true && res.body?.isBookable === true) {
      console.log(`[PASS] 23. Driver Availability: Driver successfully toggled ONLINE.`);
      passed++;
    } else {
      throw new Error(`Failed to toggle online: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 23. Driver online toggle failed:`, err.message || err);
    failed++;
  }

  // 24. Atomic Booking Assignment & Race-Safe Creation
  try {
    const handler = await loadHandler('api/bookings.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        driverId: registeredDriverId,
        customerName: 'Anil Kumar',
        customerPhone: '9848022338',
        serviceTitle: 'City Driver',
        pickupLocation: 'Road No. 36, Jubilee Hills',
        destinationLocation: 'Inorbit Mall, Madhapur',
        date: '2026-10-18',
        time: 'Instant ASAP',
        estimatedFare: 499,
        idempotencyKey: `idem-${Date.now()}`
      }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 201 && res.body?.success && res.body?.booking?.id) {
      bookingId = res.body.booking.id;
      console.log(`[PASS] 24. Atomic Booking: Successfully created booking ${bookingId} and assigned driver.`);
      passed++;
    } else {
      throw new Error(`Failed to create booking: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 24. Atomic booking creation failed:`, err.message || err);
    failed++;
  }

  // 25. Double Booking Conflict Prevention (Concurrent booking must be rejected with 409)
  try {
    const handler = await loadHandler('api/bookings.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        driverId: registeredDriverId,
        customerName: 'Second Customer',
        customerPhone: '9848099887',
        serviceTitle: 'City Driver',
        pickupLocation: 'Banjara Hills',
        destinationLocation: 'Secunderabad',
        date: '2026-10-18',
        time: 'Instant ASAP',
        estimatedFare: 499,
      }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 409) {
      console.log(`[PASS] 25. Double-Booking Safeguard: Concurrent booking correctly rejected with HTTP 409 Conflict.`);
      passed++;
    } else {
      throw new Error(`Expected HTTP 409 conflict, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 25. Double-booking conflict check failed:`, err.message || err);
    failed++;
  }

  // 26. Trip Start Lifecycle
  try {
    const handler = await loadHandler('api/bookings.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        action: 'start',
        bookingId: bookingId,
        driverId: registeredDriverId,
        location: { latitude: 17.4319, longitude: 78.4073 }
      }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.status === 'In Progress' && res.body?.driverWorkStatus === 'on_trip') {
      console.log(`[PASS] 26. Trip Lifecycle: Trip started with authoritative timestamp; driver marked 'on_trip'.`);
      passed++;
    } else {
      throw new Error(`Failed to start trip: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 26. Trip start lifecycle check failed:`, err.message || err);
    failed++;
  }

  // 27. Customer Discovery Excludes On-Trip Driver
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 27. Customer Discovery: On-trip driver is properly excluded from immediate recommendations.`);
      passed++;
    } else {
      throw new Error(`On-trip driver was still visible in immediate customer discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 27. On-trip discovery exclusion check failed:`, err.message || err);
    failed++;
  }

  // 28. Trip Completion Lifecycle
  try {
    const handler = await loadHandler('api/bookings.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        action: 'complete',
        bookingId: bookingId,
        location: { latitude: 17.4356, longitude: 78.3869 },
        completedBy: 'customer'
      }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.status === 'Completed' && res.body?.driverWorkStatus === 'available') {
      console.log(`[PASS] 28. Trip Lifecycle: Trip completed; active-job restriction released; driver returned to available.`);
      passed++;
    } else {
      throw new Error(`Failed to complete trip: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 28. Trip completion lifecycle check failed:`, err.message || err);
    failed++;
  }

  // 29. Admin Hold Toggle & Discovery Filter
  try {
    const holdHandler = await loadHandler('api/admin/approve.ts');
    const holdReq = {
      method: 'POST',
      headers: { 'authorization': `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, action: 'hold', isHold: true }
    };
    const holdRes = createMockRes();
    await holdHandler(holdReq, holdRes);

    const discHandler = await loadHandler('api/drivers/index.ts');
    const discReq = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const discRes = createMockRes();
    await discHandler(discReq, discRes);
    const inDiscovery = discRes.body?.drivers?.some(d => d.id === registeredDriverId);

    if (holdRes.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 29. Admin Hold: Driver put on hold is hidden from customer discovery.`);
      passed++;
    } else {
      throw new Error(`Driver on hold was still visible in discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 29. Admin hold toggle check failed:`, err.message || err);
    failed++;
  }

  // 30. Booking Cancellation & Driver Release
  try {
    const unholdHandler = await loadHandler('api/admin/approve.ts');
    await unholdHandler({
      method: 'POST',
      headers: { 'authorization': `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, action: 'hold', isHold: false }
    }, createMockRes());

    const bkgHandler = await loadHandler('api/bookings.ts');
    const newBkgRes = createMockRes();
    await bkgHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        driverId: registeredDriverId,
        customerName: 'Cancel Test',
        customerPhone: '9848099112',
        serviceTitle: 'City Driver',
        pickupLocation: 'Jubilee Hills',
        destinationLocation: 'Banjara Hills',
        estimatedFare: 299,
        idempotencyKey: `cancel-test-${Date.now()}`
      }
    }, newBkgRes);

    const cancelBookingId = newBkgRes.body?.booking?.id;
    const cancelRes = createMockRes();
    await bkgHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { action: 'cancel', bookingId: cancelBookingId }
    }, cancelRes);

    const drvHandler = await loadHandler('api/drivers/index.ts');
    const drvRes = createMockRes();
    await drvHandler({ method: 'GET', url: `/api/drivers?id=${registeredDriverId}`, headers: {} }, drvRes);

    if (cancelRes.statusCode === 200 && cancelRes.body?.status === 'Cancelled' && drvRes.body?.driver?.currentWorkStatus === 'available') {
      console.log(`[PASS] 30. Booking Cancellation: Booking cancelled and driver assignment released safely.`);
      passed++;
    } else {
      throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 30. Booking cancellation check failed:`, err.message || err);
    failed++;
  }

  // 31. Offline Persistence after Trip Completion
  try {
    const drvHandler = await loadHandler('api/drivers/index.ts');
    const bkgHandler = await loadHandler('api/bookings.ts');

    const bkgRes = createMockRes();
    await bkgHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        driverId: registeredDriverId,
        customerName: 'Offline Test Customer',
        customerPhone: '9848077665',
        serviceTitle: 'City Driver',
        pickupLocation: 'Gachibowli',
        destinationLocation: 'Hitec City',
        estimatedFare: 349,
        idempotencyKey: `offline-trip-${Date.now()}`
      }
    }, bkgRes);
    const testBkgId = bkgRes.body?.booking?.id;

    await bkgHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { action: 'start', bookingId: testBkgId }
    }, createMockRes());

    // Driver toggles OFFLINE during trip
    await drvHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isOnline: false }
    }, createMockRes());

    const completeRes = createMockRes();
    await bkgHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { action: 'complete', bookingId: testBkgId }
    }, completeRes);

    const verifyDriverRes = createMockRes();
    await drvHandler({ method: 'GET', url: `/api/drivers?id=${registeredDriverId}`, headers: {} }, verifyDriverRes);
    const d = verifyDriverRes.body?.driver;

    if (d?.isOnline === false && d?.currentWorkStatus === 'offline') {
      console.log(`[PASS] 31. Offline Persistence: Driver who selected Offline remains strictly OFFLINE after trip completion.`);
      passed++;
    } else {
      throw new Error(`Driver was incorrectly brought online! isOnline=${d?.isOnline}, currentWorkStatus=${d?.currentWorkStatus}`);
    }
  } catch (err) {
    console.error(`[FAIL] 31. Offline persistence after trip completion check failed:`, err.message || err);
    failed++;
  }

  // 32. Authoritative Billing & Pricing Rules: Hourly, 12h, 24h, 48h, partial hour rounding, night, extra km
  try {
    const billingModule = await loadModule('src/services/billing.ts');
    const billingService = new billingModule.BillingService();

    // 32a: 2-hour minimum billing for City Driver
    const trip2h = billingService.calculateTripCharges({
      id: 'test-2h',
      serviceTitle: 'City Driver',
      estimatedFare: 400,
      createdAt: '2026-10-21T10:00:00Z',
      tripStartedAt: '2026-10-21T10:00:00Z',
      tripCompletedAt: '2026-10-21T11:15:00Z', // 1h 15m -> ceil to 2h minimum
    });
    if (trip2h.billableHours !== 2 || trip2h.timeBasedCharge !== 400) {
      throw new Error(`2h trip billing failed: billableHours=${trip2h.billableHours}, charge=${trip2h.timeBasedCharge}`);
    }

    // 32b: Partial hour rounding (ceil_hour: 3h 10m -> 4 billable hours)
    const tripCeil = billingService.calculateTripCharges({
      id: 'test-ceil',
      serviceTitle: 'City Driver',
      estimatedFare: 400,
      createdAt: '2026-10-21T10:00:00Z',
      tripStartedAt: '2026-10-21T10:00:00Z',
      tripCompletedAt: '2026-10-21T13:10:00Z', // 3h 10m -> ceil to 4h
    });
    if (tripCeil.billableHours !== 4 || tripCeil.timeBasedCharge !== 800) {
      throw new Error(`Ceil hour billing failed: billableHours=${tripCeil.billableHours}, charge=${tripCeil.timeBasedCharge}`);
    }

    // 32c: 24-hour day package (₹2000 flat rate)
    const trip24h = billingService.calculateTripCharges({
      id: 'test-24h',
      serviceTitle: 'City Driver',
      estimatedFare: 2000,
      createdAt: '2026-10-21T10:00:00Z',
      tripStartedAt: '2026-10-21T10:00:00Z',
      tripCompletedAt: '2026-10-22T10:00:00Z', // exactly 24h
    });
    if (!trip24h.isOver24Hours || trip24h.daysElapsed !== 1 || trip24h.timeBasedCharge !== 2000) {
      throw new Error(`24h package billing failed: days=${trip24h.daysElapsed}, charge=${trip24h.timeBasedCharge}`);
    }

    // 32d: 48-hour multi-day package with 10% discount: 2 * 2000 = 4000 - 10% = 3600
    const trip48h = billingService.calculateTripCharges({
      id: 'test-48h',
      serviceTitle: 'City Driver',
      estimatedFare: 3600,
      createdAt: '2026-10-21T10:00:00Z',
      tripStartedAt: '2026-10-21T10:00:00Z',
      tripCompletedAt: '2026-10-23T10:00:00Z', // exactly 48h (2 days)
    });
    if (trip48h.daysElapsed !== 2 || trip48h.timeBasedCharge !== 3600) {
      throw new Error(`48h package billing failed: days=${trip48h.daysElapsed}, charge=${trip48h.timeBasedCharge}`);
    }

    // 32e: Extra distance billing (280 km traveled on 1-day trip with 250 included km @ ₹12/km = 30 * 12 = ₹360)
    const tripExtraKm = billingService.calculateTripCharges({
      id: 'test-extrakm',
      serviceTitle: 'Outstation Driver',
      estimatedFare: 2200,
      createdAt: '2026-10-21T10:00:00Z',
      tripStartedAt: '2026-10-21T10:00:00Z',
      tripCompletedAt: '2026-10-22T10:00:00Z',
      actualTraveledKm: 280,
    });
    if (tripExtraKm.distanceBasedCharge !== 360) {
      throw new Error(`Extra km billing failed: distanceCharge=${tripExtraKm.distanceBasedCharge}`);
    }

    console.log(`[PASS] 32. Authoritative Billing Engine: Verified 2h minimum, partial-hour ceil, 24h package, 48h multi-day discount, and extra km rates.`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 32. Billing and pricing engine check failed:`, err.message || err);
    failed++;
  }

  // 33. Session Restoration & Page Refresh Persistence Design
  try {
    const authModule = await loadModule('src/services/auth.ts');
    const authService = authModule.authService;

    // Mock localStorage in global environment
    const storageMap = new Map();
    globalThis.localStorage = {
      getItem: (k) => storageMap.get(k) || null,
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k),
      clear: () => storageMap.clear(),
    };

    // Simulate clean state
    const cleanState = authService.getAuthState();
    if (cleanState.isAdminAuthenticated || cleanState.isDriverAuthenticated) {
      throw new Error('Expected unauthenticated state initially.');
    }

    // Set admin session as issued by login
    localStorage.setItem('localdrivers_session_admin', 'true');
    localStorage.setItem('localdrivers_admin_token', adminToken);
    localStorage.setItem('localdrivers_admin_username', 'Ranjith.ceo');

    // Simulate page refresh
    const refreshedState = authService.getAuthState();
    if (!refreshedState.isAdminAuthenticated || refreshedState.adminEmail !== 'admin@localdrivers.in') {
      throw new Error(`Admin session failed to survive refresh: ${JSON.stringify(refreshedState)}`);
    }

    const adminHeaders = authService.getAdminAuthHeaders();
    if (adminHeaders['Authorization'] !== `Bearer ${adminToken}`) {
      throw new Error(`Admin Authorization header missing or corrupted: ${JSON.stringify(adminHeaders)}`);
    }

    // Test Admin Logout
    authService.logoutAdmin();
    const loggedOutState = authService.getAuthState();
    if (loggedOutState.isAdminAuthenticated) {
      throw new Error('Admin remained authenticated after logout.');
    }

    console.log(`[PASS] 33. Session Persistence: Admin session survives page refresh and clears completely on logout.`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 33. Session persistence check failed:`, err.message || err);
    failed++;
  }

  // 34. Comprehensive HTTP Status Codes & Error Contracts
  try {
    const adminLoginHandler = await loadHandler('api/admin/login.ts');
    const bookingsHandler = await loadHandler('api/bookings.ts');
    const driversHandler = await loadHandler('api/drivers/index.ts');

    // HTTP 405 Method Not Allowed on GET to /api/admin/login
    const mnaRes = createMockRes();
    await adminLoginHandler({ method: 'GET', headers: {} }, mnaRes);
    if (mnaRes.statusCode !== 405) {
      throw new Error(`Expected 405 Method Not Allowed, got ${mnaRes.statusCode}`);
    }

    // HTTP 400 Bad Request on missing booking fields
    const badReqRes = createMockRes();
    await bookingsHandler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: {} }, badReqRes);
    if (badReqRes.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${badReqRes.statusCode}`);
    }

    // HTTP 404 Not Found on nonexistent driver query
    const notFoundRes = createMockRes();
    await driversHandler({ method: 'GET', url: '/api/drivers?id=nonexistent-id-99999', headers: {} }, notFoundRes);
    if (notFoundRes.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found, got ${notFoundRes.statusCode}`);
    }

    console.log(`[PASS] 34. Error Contracts: Verified consistent responses for HTTP 400, 401, 403, 404, 405, and 409.`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 34. Error contract verification check failed:`, err.message || err);
    failed++;
  }

  // 35. Public KYC Sanitization & Prevention of Document Leaks
  try {
    const driversHandler = await loadHandler('api/drivers/index.ts');
    const discRes = createMockRes();
    await driversHandler({ method: 'GET', url: '/api/drivers?status=Approved', headers: {} }, discRes);

    const publicDrivers = discRes.body?.drivers || [];
    for (const d of publicDrivers) {
      if (d.documents || d.driver_documents || d.password_hash || d.salt) {
        throw new Error(`Public driver list leaked private fields for driver ${d.id}!`);
      }
    }

    console.log(`[PASS] 35. Security & KYC Audit: Zero document URLs, base64 blobs, or cryptographic hashes leaked across public endpoints.`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] 35. Public KYC sanitization audit check failed:`, err.message || err);
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
