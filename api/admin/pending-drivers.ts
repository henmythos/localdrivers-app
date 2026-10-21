import { initDb } from '../_lib/db.js';
import { verifyAdminAuth } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `pnd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
      requestId: reqId,
    });
  }

  // Authorization check
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrator access required.',
      requestId: reqId,
    });
  }

  try {
    const db = await initDb();

    // Query pending drivers (ordered newest first)
    const driversRes = await db.execute(`
      SELECT 
        id, driver_code, name, phone, email, photo, rating, total_trips,
        experience_years, languages, services, vehicle_categories, status,
        is_online, is_hold, pending_commission_fee, starting_price,
        distance_km, latitude, longitude, area, city, verification_badge,
        description, joined_date, created_at
      FROM drivers
      WHERE status = 'Pending'
      ORDER BY created_at DESC;
    `);

    // Fetch documents only for pending drivers (prevents full table scans and memory exhaustion)
    const docsRes = driversRes.rows.length > 0 
      ? await db.execute(`
          SELECT id, driver_id, type, status, url, uploaded_at 
          FROM driver_documents
          WHERE driver_id IN (SELECT id FROM drivers WHERE status = 'Pending');
        `)
      : { rows: [] };

    const docsByDriverId = new Map<string, any[]>();
    for (const d of docsRes.rows) {
      const driverId = String(d.driver_id);
      if (!docsByDriverId.has(driverId)) {
        docsByDriverId.set(driverId, []);
      }
      docsByDriverId.get(driverId)!.push({
        id: String(d.id),
        type: d.type,
        status: d.status,
        url: d.url,
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
      });
    }

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
      requestId: reqId,
    });
  } catch (error: any) {
    console.error(`[API Pending Drivers Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending drivers from database.',
      requestId: reqId,
    });
  }
}
