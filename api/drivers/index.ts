import { initDb } from '../_lib/db.js';
import { verifyAdminAuth } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `drv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');
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

  try {
    const db = await initDb();
    const url = new URL(req.url, 'http://localhost');
    const statusParam = url.searchParams.get('status');
    const idParam = url.searchParams.get('id');
    const isAdmin = verifyAdminAuth(req);

    let sql = `
      SELECT 
        id, driver_code, name, phone, email, photo, rating, total_trips,
        experience_years, languages, services, vehicle_categories, status,
        is_online, is_hold, pending_commission_fee, starting_price,
        distance_km, latitude, longitude, area, city, verification_badge,
        description, joined_date, current_work_status, active_booking_id,
        last_online_at, last_location_at
      FROM drivers
      WHERE 1=1
    `;
    const args: any[] = [];

    if (idParam) {
      sql += ` AND id = ?`;
      args.push(idParam);
    } else if (statusParam === 'Approved') {
      // Customer Discovery: Must be Approved, NOT on hold, Explicitly Online, and NOT on active trip
      sql += ` AND status = 'Approved' AND is_hold = 0 AND is_online = 1 AND (current_work_status IS NULL OR current_work_status != 'on_trip')`;
    } else if (statusParam) {
      sql += ` AND status = ?`;
      args.push(statusParam);
    }

    sql += ` ORDER BY rating DESC;`;

    const driversRes = await db.execute({ sql, args });

    // If searching by single ID and not found
    if (idParam && driversRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Driver profile with ID ${idParam} does not exist.`,
        requestId: reqId,
      });
    }

    // Fetch documents ONLY for authenticated administrators (preserve private KYC security)
    let docsByDriverId = new Map<string, any[]>();
    if (isAdmin) {
      try {
        let docsSql = `SELECT id, driver_id, type, status, url, uploaded_at FROM driver_documents`;
        const docsArgs: any[] = [];
        if (idParam) {
          docsSql += ` WHERE driver_id = ?`;
          docsArgs.push(idParam);
        }
        const docsRes = await db.execute({ sql: docsSql, args: docsArgs });
        for (const d of docsRes.rows) {
          const driverId = String(d.driver_id);
          if (!docsByDriverId.has(driverId)) docsByDriverId.set(driverId, []);
          docsByDriverId.get(driverId)!.push({
            id: String(d.id),
            type: d.type,
            status: d.status,
            url: isAdmin ? d.url : '', // Only authorized admins can see document images
            uploadedAt: d.uploaded_at,
          });
        }
      } catch (docErr: any) {
        console.warn(`[Docs fetch warning in drivers/index.ts]`, docErr.message);
      }
    }

    const drivers = [];

    for (const row of driversRes.rows) {
      const driverId = String(row.id);
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

      const driverDocs = docsByDriverId.get(driverId) || [];

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
        description: String(row.description || ''),
        joinedDate: String(row.joined_date || ''),
        currentWorkStatus: String(row.current_work_status || 'available'),
        activeBookingId: row.active_booking_id ? String(row.active_booking_id) : null,
        documents: driverDocs,
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
    console.error(`[API Get Drivers Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve driver list from database. Please try again.',
      requestId: reqId,
    });
  }
}
