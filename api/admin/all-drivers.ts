import { initDb } from '../_lib/db';
import { verifyAdminAuth } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized: Administrator access required.' });
  }

  try {
    const db = await initDb();

    const driversRes = await db.execute(`
      SELECT 
        id, driver_code, name, phone, email, photo, rating, total_trips,
        experience_years, languages, services, vehicle_categories, status,
        is_online, is_hold, pending_commission_fee, starting_price,
        distance_km, latitude, longitude, area, city, verification_badge,
        description, joined_date, created_at
      FROM drivers
      ORDER BY created_at DESC;
    `);

    const drivers = [];

    for (const row of driversRes.rows) {
      const docsRes = await db.execute({
        sql: `SELECT id, type, status, url, uploaded_at FROM driver_documents WHERE driver_id = ?;`,
        args: [row.id]
      });

      const documents = docsRes.rows.map((d: any) => ({
        id: String(d.id),
        type: d.type,
        status: d.status,
        url: d.url,
        uploadedAt: d.uploaded_at,
      }));

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
        id: String(row.id),
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
    });
  } catch (error: any) {
    console.error('[API All Drivers Error]', error);
    return res.status(500).json({
      error: 'Failed to retrieve drivers from database.',
      details: error.message,
    });
  }
}
