import { initDb } from '../_lib/db.js';
import { verifyAdminAuth } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `adm-drv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
  }

  // Enforce admin authentication
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrator authentication required.',
    });
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');

    if (!id) {
      return res.status(400).json({ success: false, error: 'Driver ID parameter (?id=...) is required.' });
    }

    const db = await initDb();

    // 1. Fetch authoritative driver record
    const driverRes = await db.execute({
      sql: `
        SELECT 
          id, driver_code, name, phone, email, photo, rating, total_trips,
          experience_years, languages, services, vehicle_categories, status,
          is_online, is_hold, pending_commission_fee, starting_price,
          distance_km, latitude, longitude, area, city, verification_badge,
          description, joined_date, rejection_reason, reviewed_by, reviewed_at,
          current_work_status, active_booking_id, last_online_at, last_location_at,
          created_at, updated_at
        FROM drivers
        WHERE id = ?;
      `,
      args: [id],
    });

    if (driverRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No driver record found with ID '${id}'.`,
        requestId: reqId,
      });
    }

    const row = driverRes.rows[0];

    // 2. Fetch submitted KYC documents (Aadhaar, Driving License, Selfie)
    const docsRes = await db.execute({
      sql: `SELECT id, driver_id, type, status, url, uploaded_at FROM driver_documents WHERE driver_id = ?;`,
      args: [id],
    });

    const documents = docsRes.rows.map(d => ({
      id: String(d.id),
      type: String(d.type),
      status: String(d.status),
      url: String(d.url),
      uploadedAt: String(d.uploaded_at || ''),
    }));

    // Parse JSON arrays safely
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

    // 3. Fetch recent bookings for this driver
    const bookingsRes = await db.execute({
      sql: `SELECT id, customer_name, customer_phone, service_title, status, estimated_fare, created_at FROM bookings WHERE driver_id = ? ORDER BY created_at DESC LIMIT 5;`,
      args: [id],
    });

    const recentBookings = bookingsRes.rows.map(b => ({
      id: String(b.id),
      customerName: String(b.customer_name),
      customerPhone: String(b.customer_phone),
      serviceTitle: String(b.service_title),
      status: String(b.status),
      estimatedFare: Number(b.estimated_fare) || 0,
      createdAt: String(b.created_at || ''),
    }));

    const driver = {
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
      description: String(row.description || ''),
      joinedDate: String(row.joined_date || row.created_at || ''),
      currentWorkStatus: String(row.current_work_status || 'available'),
      activeBookingId: row.active_booking_id ? String(row.active_booking_id) : null,
      lastOnlineAt: row.last_online_at ? String(row.last_online_at) : undefined,
      lastLocationAt: row.last_location_at ? String(row.last_location_at) : undefined,
      rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
      documents,
      recentBookings,
    };

    return res.status(200).json({
      success: true,
      driver,
      requestId: reqId,
    });
  } catch (error: any) {
    console.error(`[API Admin Driver Detail Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve driver profile details.',
      requestId: reqId,
    });
  }
}
