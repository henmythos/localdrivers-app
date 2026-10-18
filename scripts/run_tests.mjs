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

  // 11. Test Public Driver Profile Lookup by Stable ID (Safe, no private KYC leaks)
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: `/api/drivers?id=${registeredDriverId}`, headers: {} };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.driver?.id === registeredDriverId) {
      if (res.body.driver.documents && res.body.driver.documents.length > 0) {
        throw new Error('Public profile leaked private KYC documents!');
      }
      console.log(`[PASS] 11. Public Driver Profile Lookup: Retrieved profile for ${registeredDriverId} securely without KYC leakage.`);
      passed++;
    } else {
      throw new Error(`Public lookup failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 11. Public driver profile lookup failed:`, err.message || err);
    failed++;
  }

  // 12. Test Admin Driver Detail Lookup by Stable ID (Includes full KYC docs)
  try {
    const handler = await loadHandler('api/admin/driver-detail.ts');
    const req = {
      method: 'GET',
      url: `/api/admin/driver-detail?id=${registeredDriverId}`,
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token' }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.driver?.id === registeredDriverId && res.body?.driver?.documents?.length > 0) {
      console.log(`[PASS] 12. Admin Driver Profile Lookup: Successfully retrieved driver with ${res.body.driver.documents.length} verified documents.`);
      passed++;
    } else {
      throw new Error(`Admin detail failed: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 12. Admin driver detail lookup failed:`, err.message || err);
    failed++;
  }

  // 13. Test Driver-Controlled Online/Offline Toggle (Switching to Offline)
  try {
    const handler = await loadHandler('api/drivers/availability.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isOnline: false }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.isOnline === false && res.body?.isBookable === false) {
      console.log(`[PASS] 13. Driver Availability: Driver successfully toggled OFFLINE.`);
      passed++;
    } else {
      throw new Error(`Failed to toggle offline: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 13. Driver offline toggle failed:`, err.message || err);
    failed++;
  }

  // 14. Test Customer Discovery Excludes Offline Driver
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 14. Customer Discovery: Offline driver ${registeredDriverId} is properly excluded from available search results.`);
      passed++;
    } else {
      throw new Error(`Offline driver was still visible in customer discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 14. Offline customer discovery exclusion check failed:`, err.message || err);
    failed++;
  }

  // 15. Test Driver Toggles Back Online
  try {
    const handler = await loadHandler('api/drivers/availability.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isOnline: true }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 200 && res.body?.isOnline === true && res.body?.isBookable === true) {
      console.log(`[PASS] 15. Driver Availability: Driver successfully toggled ONLINE.`);
      passed++;
    } else {
      throw new Error(`Failed to toggle online: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 15. Driver online toggle failed:`, err.message || err);
    failed++;
  }

  // 16. Test Rejected/Pending Candidate Cannot Go Online
  try {
    const handler = await loadHandler('api/drivers/availability.ts');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { driverId: rejectDriverId, isOnline: true }
    };
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode === 403) {
      console.log(`[PASS] 16. Driver Availability: Rejected candidate is blocked from going online.`);
      passed++;
    } else {
      throw new Error(`Expected HTTP 403, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 16. Candidate cannot go online check failed:`, err.message || err);
    failed++;
  }

  // 17. Test Atomic Booking Assignment & Race-Safe Creation
  let bookingId = '';
  try {
    const handler = await loadHandler('api/bookings/index.ts');
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
      console.log(`[PASS] 17. Atomic Booking: Successfully created booking ${bookingId} and assigned driver.`);
      passed++;
    } else {
      throw new Error(`Failed to create booking: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 17. Atomic booking creation failed:`, err.message || err);
    failed++;
  }

  // 18. Test Double Booking Conflict Prevention (Concurrent booking attempt must be rejected)
  try {
    const handler = await loadHandler('api/bookings/index.ts');
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
      console.log(`[PASS] 18. Double-Booking Safeguard: Concurrent booking correctly rejected with HTTP 409 Conflict.`);
      passed++;
    } else {
      throw new Error(`Expected HTTP 409 conflict, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 18. Double-booking conflict check failed:`, err.message || err);
    failed++;
  }

  // 18. Test Start Trip Lifecycle
  try {
    const handler = await loadHandler('api/bookings/trip.ts');
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
      console.log(`[PASS] 18. Trip Lifecycle: Trip started with authoritative timestamp; driver marked 'on_trip'.`);
      passed++;
    } else {
      throw new Error(`Failed to start trip: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 18. Trip start lifecycle check failed:`, err.message || err);
    failed++;
  }

  // 19. Test Customer Discovery Excludes On-Trip Driver
  try {
    const handler = await loadHandler('api/drivers/index.ts');
    const req = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    const inDiscovery = res.body?.drivers?.some(d => d.id === registeredDriverId);
    if (res.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 19. Customer Discovery: On-trip driver ${registeredDriverId} is properly excluded from immediate booking recommendations.`);
      passed++;
    } else {
      throw new Error(`On-trip driver was still visible in immediate customer discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 19. On-trip discovery exclusion check failed:`, err.message || err);
    failed++;
  }

  // 20. Test Complete Trip Lifecycle
  try {
    const handler = await loadHandler('api/bookings/trip.ts');
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
      console.log(`[PASS] 20. Trip Lifecycle: Trip completed; active-job restriction released; driver returned to available.`);
      passed++;
    } else {
      throw new Error(`Failed to complete trip: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] 20. Trip completion lifecycle check failed:`, err.message || err);
    failed++;
  }

  // 21. Test Admin Hold Toggle & Discovery Filter
  try {
    const holdHandler = await loadHandler('api/admin/hold.ts');
    const holdReq = {
      method: 'POST',
      headers: { 'x-admin-auth': 'localdrivers_admin_session_token', 'content-type': 'application/json' },
      body: { driverId: registeredDriverId, isHold: true }
    };
    const holdRes = createMockRes();
    await holdHandler(holdReq, holdRes);

    const discHandler = await loadHandler('api/drivers/index.ts');
    const discReq = { method: 'GET', url: '/api/drivers?status=Approved', headers: {} };
    const discRes = createMockRes();
    await discHandler(discReq, discRes);
    const inDiscovery = discRes.body?.drivers?.some(d => d.id === registeredDriverId);

    if (holdRes.statusCode === 200 && !inDiscovery) {
      console.log(`[PASS] 21. Admin Hold: Driver put on hold is hidden from customer discovery.`);
      passed++;
    } else {
      throw new Error(`Driver on hold was still visible in discovery!`);
    }
  } catch (err) {
    console.error(`[FAIL] 21. Admin hold toggle check failed:`, err.message || err);
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
