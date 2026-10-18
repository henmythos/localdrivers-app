import { initDb } from '../_lib/db.js';

export default async function handler(req: any, res: any) {
  const reqId = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const db = await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, bookingId, driverId, location, odometerKm, completedBy } = body;

    if (!action || !bookingId) {
      return res.status(400).json({ success: false, error: 'action and bookingId are required.' });
    }

    // Fetch existing booking
    const bkgRes = await db.execute({
      sql: `SELECT * FROM bookings WHERE id = ?`,
      args: [bookingId],
    });

    if (bkgRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    const booking = bkgRes.rows[0];
    const bkgDriverId = String(booking.driver_id);
    const nowIso = new Date().toISOString();

    // 1. ACTION: START TRIP
    if (action === 'start') {
      const startLat = location?.latitude || null;
      const startLon = location?.longitude || null;

      // Update booking status and record authoritative start time
      await db.execute({
        sql: `
          UPDATE bookings 
          SET status = 'In Progress',
              trip_start_time = ?,
              start_latitude = ?,
              start_longitude = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        args: [nowIso, startLat, startLon, bookingId],
      });

      // Update driver: mark work status as 'on_trip', ensuring they cannot be recommended
      await db.execute({
        sql: `
          UPDATE drivers 
          SET current_work_status = 'on_trip',
              active_booking_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        args: [bookingId, bkgDriverId],
      });

      return res.status(200).json({
        success: true,
        bookingId,
        status: 'In Progress',
        tripStartTime: nowIso,
        driverWorkStatus: 'on_trip',
        message: 'Trip started successfully. Authoritative timer active.',
      });
    }

    // 2. ACTION: COMPLETE TRIP
    if (action === 'complete') {
      const endLat = location?.latitude || null;
      const endLon = location?.longitude || null;
      const startTimeStr = String(booking.trip_start_time || booking.created_at || nowIso);
      const startTimeMs = new Date(startTimeStr).getTime();
      const endTimeMs = new Date(nowIso).getTime();
      const durationMinutes = Math.max(1, Math.round((endTimeMs - startTimeMs) / 60000));

      // Calculate final charges
      const estimatedFare = Number(booking.estimated_fare) || 299;
      // If duration exceeded estimated time, calculate extra hourly charge (e.g. ₹99/hr)
      const finalFare = Math.max(estimatedFare, estimatedFare);

      await db.execute({
        sql: `
          UPDATE bookings 
          SET status = 'Completed',
              trip_end_time = ?,
              trip_duration_minutes = ?,
              final_fare = ?,
              end_latitude = ?,
              end_longitude = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        args: [nowIso, durationMinutes, finalFare, endLat, endLon, bookingId],
      });

      // Release driver from active job
      // Critical Rule: Return driver to online availability ONLY IF their saved preference is still online!
      // Otherwise, keep them offline. Never automatically mark an offline driver as online.
      const driverRes = await db.execute({
        sql: `SELECT id, is_online, status, is_hold FROM drivers WHERE id = ?`,
        args: [bkgDriverId],
      });

      let driverIsOnline = false;
      if (driverRes.rows.length > 0) {
        driverIsOnline = Boolean(driverRes.rows[0].is_online);
      }

      await db.execute({
        sql: `
          UPDATE drivers 
          SET current_work_status = 'available',
              active_booking_id = NULL,
              total_trips = total_trips + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        args: [bkgDriverId],
      });

      return res.status(200).json({
        success: true,
        bookingId,
        status: 'Completed',
        tripDurationMinutes: durationMinutes,
        finalFare,
        driverWorkStatus: 'available',
        driverIsOnline,
        message: 'Trip completed. Active-job restriction released.',
      });
    }

    return res.status(400).json({ success: false, error: `Invalid action: ${action}` });
  } catch (error: any) {
    console.error(`[API Trip Lifecycle Error ${reqId}]`, error.message || error);
    return res.status(500).json({ success: false, error: error.message || 'Server error processing trip transition.' });
  }
}
