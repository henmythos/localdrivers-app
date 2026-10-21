import { initDb } from '../_lib/db.js';
import { verifyAdminAuth, generateAdminToken, cleanEnvValue, getAuthSecret } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `all-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Secure Server-Side Administrator Authentication (Backwards Compatibility)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const rawUser = body.username || body.userId || body.user || body.identifier || body.email || '';
      const rawPass = body.password || '';

      const cleanUser = String(rawUser).trim().toLowerCase();
      const cleanPass = String(rawPass);

      if (!cleanUser || !cleanPass) {
        return res.status(400).json({
          success: false,
          error: 'Administrator User ID and Password are required.',
          requestId: reqId,
        });
      }

      const configuredAdminUser = cleanEnvValue(process.env.ADMIN_USERNAME);
      const configuredAdminPass = cleanEnvValue(process.env.ADMIN_PASSWORD);
      const authSecret = getAuthSecret();

      if (!configuredAdminUser || !configuredAdminPass || !authSecret) {
        console.error(`[Admin Auth Config Error ${reqId}]: Server admin credentials or ADMIN_JWT_SECRET missing or unconfigured.`);
        return res.status(500).json({
          success: false,
          error: 'Server authentication configuration error. Administrator credentials or security keys are not properly configured in the server environment.',
          requestId: reqId,
        });
      }

      // Strict identity match: only the explicitly configured administrator account is permitted.
      // Undocumented aliases ('admin', 'ranjith') are strictly disallowed.
      const isUserMatch = cleanUser === configuredAdminUser.toLowerCase();

      // Strict password match: strictly case-sensitive comparison.
      // Case-insensitivity and backdoors ('admin123') are strictly disallowed.
      const isPassMatch = cleanPass === configuredAdminPass;

      if (!isUserMatch || !isPassMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid administrator credentials.',
          requestId: reqId,
        });
      }

      // Generate cryptographically signed JWT for admin
      const token = generateAdminToken(configuredAdminUser);

      return res.status(200).json({
        success: true,
        token,
        admin: {
          username: configuredAdminUser,
          role: 'ADMIN',
        },
        requestId: reqId,
      });
    } catch (err: any) {
      console.error(`[Admin Auth Exception ${reqId}]:`, err.message || err);
      return res.status(500).json({
        success: false,
        error: 'Administrator authentication failure.',
        requestId: reqId,
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
      requestId: reqId,
    });
  }

  // Strict cryptographic admin authorization verification
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrator access required.',
      requestId: reqId,
    });
  }

  try {
    const db = await initDb();
    const url = new URL(req.url, 'http://localhost');
    const idParam = url.searchParams.get('id') || req.query?.id;

    let sql = `
      SELECT 
        id, driver_code, name, phone, email, photo, rating, total_trips,
        experience_years, languages, services, vehicle_categories, status,
        is_online, is_hold, pending_commission_fee, starting_price,
        distance_km, latitude, longitude, area, city, verification_badge,
        description, joined_date, created_at,
        current_work_status, active_booking_id, last_online_at
      FROM drivers
      WHERE 1=1
    `;
    const args: any[] = [];

    if (idParam) {
      sql += ` AND id = ?`;
      args.push(idParam);
    }

    sql += ` ORDER BY created_at DESC;`;

    const driversRes = await db.execute({ sql, args });

    if (idParam && driversRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Driver with ID ${idParam} not found.`,
        requestId: reqId,
      });
    }

    // Authorized administrator KYC document lookup
    let docsSql = `SELECT id, driver_id, type, status, url, uploaded_at FROM driver_documents`;
    const docsArgs: any[] = [];
    if (idParam) {
      docsSql += ` WHERE driver_id = ?`;
      docsArgs.push(idParam);
    }
    const docsRes = await db.execute({ sql: docsSql, args: docsArgs });

    const docsByDriverId = new Map<string, any[]>();
    for (const d of docsRes.rows) {
      const driverId = String(d.driver_id);
      if (!docsByDriverId.has(driverId)) {
        docsByDriverId.set(driverId, []);
      }
      // In summary list view, do not serialize full multi-megabyte base64 blobs across network
      const rawUrl = String(d.url || '');
      const docUrl = idParam ? rawUrl : (rawUrl.startsWith('data:') ? '[DOCUMENT_STORED_IN_DB]' : rawUrl);

      docsByDriverId.get(driverId)!.push({
        id: String(d.id),
        type: d.type,
        status: d.status,
        url: docUrl,
        uploadedAt: d.uploaded_at,
      });
    }

    const drivers = [];

    for (const row of driversRes.rows) {
      const driverId = String(row.id);
      const documents = docsByDriverId.get(driverId) || [];

      let languages = ['Telugu', 'Hindi'];
      try {
        if (row.languages) languages = JSON.parse(String(row.languages));
      } catch {}

      let services = ['City Driver'];
      try {
        if (row.services) services = JSON.parse(String(row.services));
      } catch {}

      let vehicleCategories = ['Manual', 'Automatic'];
      try {
        if (row.vehicle_categories) vehicleCategories = JSON.parse(String(row.vehicle_categories));
      } catch {}

      drivers.push({
        id: driverId,
        driverCode: String(row.driver_code || ''),
        name: String(row.name),
        phone: String(row.phone),
        email: String(row.email || ''),
        photo: String(row.photo || ''),
        rating: Number(row.rating) || 5.0,
        totalTrips: Number(row.total_trips) || 0,
        experienceYears: Number(row.experience_years) || 1,
        languages,
        services,
        vehicleCategories,
        status: String(row.status),
        isOnline: Boolean(row.is_online),
        isHold: Boolean(row.is_hold),
        pendingCommissionFee: Number(row.pending_commission_fee) || 0,
        startingPrice: Number(row.starting_price) || 299,
        distanceKm: Number(row.distance_km) || 2.5,
        latitude: Number(row.latitude) || 17.4126,
        longitude: Number(row.longitude) || 78.4071,
        area: String(row.area || 'Hyderabad'),
        city: String(row.city || 'Hyderabad'),
        verificationBadge: Boolean(row.verification_badge),
        documents,
        description: String(row.description || ''),
        joinedDate: String(row.joined_date || row.created_at || ''),
        currentWorkStatus: (row.current_work_status as any) || (Boolean(row.is_online) ? 'available' : 'offline'),
        activeBookingId: row.active_booking_id ? String(row.active_booking_id) : undefined,
        lastOnlineAt: row.last_online_at ? String(row.last_online_at) : undefined,
      });
    }

    if (idParam && drivers.length > 0) {
      return res.status(200).json({
        success: true,
        driver: drivers[0],
        drivers,
        requestId: reqId,
      });
    }

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
      requestId: reqId,
    });
  } catch (error: any) {
    console.error(`[API All Drivers Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve drivers from database.',
      requestId: reqId,
    });
  }
}
