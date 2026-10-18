import { initDb } from './_lib/db.js';
import { verifyAdminAuth } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await initDb();

  // GET: Fetch bookings (Single by id, by phone, by driverId, or admin all)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, 'http://localhost');
      const idParam = url.searchParams.get('id');
      const phoneParam = url.searchParams.get('phone');
      const driverIdParam = url.searchParams.get('driverId');
      const isAdmin = verifyAdminAuth(req);

      let sql = `SELECT * FROM bookings WHERE 1=1`;
      const args: any[] = [];

      if (idParam) {
        sql += ` AND id = ?`;
        args.push(idParam);
      } else if (driverIdParam) {
        sql += ` AND driver_id = ?`;
        args.push(driverIdParam);
      } else if (phoneParam) {
        // Match last 10 digits
        const cleanDigits = phoneParam.replace(/\D/g, '').slice(-10);
        sql += ` AND customer_phone LIKE ?`;
        args.push(`%${cleanDigits}`);
      } else if (!isAdmin) {
        return res.status(401).json({
          success: false,
          error: 'Please specify an id, customer phone, or administrator credentials.',
        });
      }

      sql += ` ORDER BY created_at DESC;`;

      const result = await db.execute({ sql, args });
      const bookings = result.rows.map(row => {
        let extraData: any = {};
        try {
          if (row.data_json) extraData = JSON.parse(String(row.data_json));
        } catch {}

        return {
          id: String(row.id),
          customerName: String(row.customer_name),
          customerPhone: String(row.customer_phone),
          driverId: String(row.driver_id),
          driverName: String(row.driver_name),
          driverPhone: String(row.driver_phone || ''),
          driverPhoto: String(row.driver_photo || ''),
          driverCode: String(row.driver_code || ''),
          serviceTitle: String(row.service_title),
          status: String(row.status),
          pickupLocation: String(row.pickup_location),
          destinationLocation: String(row.destination_location),
          date: String(row.date || ''),
          time: String(row.time || ''),
          notes: String(row.notes || ''),
          estimatedFare: Number(row.estimated_fare) || 0,
          finalFare: row.final_fare != null ? Number(row.final_fare) : undefined,
          tripStartTime: row.trip_start_time ? String(row.trip_start_time) : undefined,
          tripEndTime: row.trip_end_time ? String(row.trip_end_time) : undefined,
          tripDurationMinutes: row.trip_duration_minutes != null ? Number(row.trip_duration_minutes) : undefined,
          waitingDurationMinutes: Number(row.waiting_duration_minutes) || 0,
          startLatitude: row.start_latitude != null ? Number(row.start_latitude) : undefined,
          startLongitude: row.start_longitude != null ? Number(row.start_longitude) : undefined,
          endLatitude: row.end_latitude != null ? Number(row.end_latitude) : undefined,
          endLongitude: row.end_longitude != null ? Number(row.end_longitude) : undefined,
          createdAt: String(row.created_at || ''),
          ...extraData,
        };
      });

      if (idParam && bookings.length > 0) {
        return res.status(200).json({ success: true, booking: bookings[0], bookings });
      }

      return res.status(200).json({ success: true, count: bookings.length, bookings });
    } catch (err: any) {
      console.error(`[API Get Bookings Error ${reqId}]`, err.message || err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create / Trip Start / Trip Complete
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { action } = body;

      // 1. ACTION: START TRIP
      if (action === 'start' || action === 'start_trip') {
        const { bookingId, location } = body;
        if (!bookingId) {
          return res.status(400).json({ success: false, error: 'bookingId is required.' });
        }

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
        const startLat = location?.latitude || null;
        const startLon = location?.longitude || null;

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
      if (action === 'complete' || action === 'complete_trip') {
        const { bookingId, location } = body;
        if (!bookingId) {
          return res.status(400).json({ success: false, error: 'bookingId is required.' });
        }

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
        const endLat = location?.latitude || null;
        const endLon = location?.longitude || null;
        const startTimeStr = String(booking.trip_start_time || booking.created_at || nowIso);
        const startTimeMs = new Date(startTimeStr).getTime();
        const endTimeMs = new Date(nowIso).getTime();
        const elapsedSeconds = Math.max(0, Math.floor((endTimeMs - startTimeMs) / 1000));
        const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
        const totalHoursExact = elapsedSeconds / 3600;
        const daysElapsed = Math.floor(elapsedSeconds / 86400);

        // Billing calculation adhering to configured pricing policy
        const estimatedFare = Number(booking.estimated_fare) || 299;
        const serviceTitle = String(booking.service_title || 'City Driver');
        const baseHourlyRate = estimatedFare > 2000 ? 250 : 200;
        const minimumHours = serviceTitle === 'Outstation Driver' ? 12 : 2;
        const billableHours = Math.max(minimumHours, Math.ceil(totalHoursExact));

        let finalFare = estimatedFare;
        if (daysElapsed >= 1) {
          const dailyRate = serviceTitle === 'Outstation Driver' ? 2200 : 2000;
          const dailyBase = daysElapsed * dailyRate;
          const remainingHours = Math.max(0, billableHours - daysElapsed * 24);
          let timeCharge = dailyBase + (remainingHours * baseHourlyRate);
          if (daysElapsed >= 2) {
            timeCharge = Math.round(timeCharge * 0.9); // 10% multi-day discount
          }
          finalFare = Math.max(estimatedFare, timeCharge);
        } else if (billableHours > minimumHours) {
          const calculatedCharge = billableHours * baseHourlyRate;
          finalFare = Math.max(estimatedFare, calculatedCharge);
        }

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

        // Driver availability restoration:
        // A driver who was Offline before or during the trip remains Offline after completion.
        // A driver who was Online returns to availability ONLY IF no conflicting booking exists.
        const driverRes = await db.execute({
          sql: `SELECT id, is_online, status, is_hold FROM drivers WHERE id = ?`,
          args: [bkgDriverId],
        });

        let driverIsOnline = false;
        if (driverRes.rows.length > 0) {
          driverIsOnline = Boolean(driverRes.rows[0].is_online);
        }

        // Check for conflicting or upcoming assigned bookings
        const nextBkgRes = await db.execute({
          sql: `SELECT id FROM bookings WHERE driver_id = ? AND status IN ('Assigned', 'In Progress', 'Pending') AND id != ? LIMIT 1`,
          args: [bkgDriverId, bookingId],
        });

        let nextWorkStatus = 'offline';
        let nextActiveBookingId: string | null = null;
        if (nextBkgRes.rows.length > 0) {
          nextWorkStatus = 'assigned';
          nextActiveBookingId = String(nextBkgRes.rows[0].id);
        } else if (driverIsOnline) {
          nextWorkStatus = 'available';
        }

        await db.execute({
          sql: `
            UPDATE drivers 
            SET current_work_status = ?,
                active_booking_id = ?,
                total_trips = total_trips + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
          `,
          args: [nextWorkStatus, nextActiveBookingId, bkgDriverId],
        });

        return res.status(200).json({
          success: true,
          bookingId,
          status: 'Completed',
          tripDurationMinutes: durationMinutes,
          finalFare,
          driverWorkStatus: nextWorkStatus,
          driverIsOnline,
          message: 'Trip completed. Active-job restriction released.',
        });
      }

      // 3. ACTION: CANCEL BOOKING
      if (action === 'cancel' || action === 'cancel_booking') {
        const { bookingId } = body;
        if (!bookingId) {
          return res.status(400).json({ success: false, error: 'bookingId is required.' });
        }

        const bkgRes = await db.execute({
          sql: `SELECT * FROM bookings WHERE id = ?`,
          args: [bookingId],
        });

        if (bkgRes.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        const booking = bkgRes.rows[0];
        const bkgDriverId = String(booking.driver_id);

        await db.execute({
          sql: `UPDATE bookings SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
          args: [bookingId],
        });

        // Release driver assignment if this was their active booking
        const driverRes = await db.execute({
          sql: `SELECT id, is_online, active_booking_id FROM drivers WHERE id = ?`,
          args: [bkgDriverId],
        });

        let driverIsOnline = false;
        let activeBkgId = null;
        if (driverRes.rows.length > 0) {
          driverIsOnline = Boolean(driverRes.rows[0].is_online);
          activeBkgId = driverRes.rows[0].active_booking_id;
        }

        if (activeBkgId === bookingId) {
          const targetStatus = driverIsOnline ? 'available' : 'offline';
          await db.execute({
            sql: `UPDATE drivers SET current_work_status = ?, active_booking_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
            args: [targetStatus, bkgDriverId],
          });
        }

        return res.status(200).json({
          success: true,
          bookingId,
          status: 'Cancelled',
          message: 'Booking cancelled successfully. Driver released.',
        });
      }

      // 3. DEFAULT: CREATE / ASSIGN BOOKING (Atomic & Race-Safe)
      const {
        driverId,
        customerName,
        customerPhone,
        serviceTitle,
        pickupLocation,
        destinationLocation,
        date,
        time,
        notes,
        estimatedFare,
        idempotencyKey,
        ...otherDetails
      } = body;

      if (!driverId || !customerPhone || !pickupLocation) {
        return res.status(400).json({
          success: false,
          error: 'Driver ID, customer phone, and pickup location are required.',
        });
      }

      // Safeguard: Check idempotency key
      if (idempotencyKey) {
        const existing = await db.execute({
          sql: `SELECT * FROM bookings WHERE idempotency_key = ?`,
          args: [idempotencyKey],
        });
        if (existing.rows.length > 0) {
          const row = existing.rows[0];
          return res.status(200).json({
            success: true,
            isDuplicate: true,
            booking: {
              id: String(row.id),
              customerName: String(row.customer_name),
              customerPhone: String(row.customer_phone),
              driverId: String(row.driver_id),
              driverName: String(row.driver_name),
              serviceTitle: String(row.service_title),
              status: String(row.status),
              estimatedFare: Number(row.estimated_fare),
            },
          });
        }
      }

      // Validate driver eligibility and perform atomic reservation
      const driverCheck = await db.execute({
        sql: `SELECT id, name, phone, photo, driver_code, status, is_hold, is_online, current_work_status FROM drivers WHERE id = ?`,
        args: [driverId],
      });

      if (driverCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'The requested driver could not be found.',
        });
      }

      const driverRow = driverCheck.rows[0];
      const status = String(driverRow.status);
      const isHold = Boolean(driverRow.is_hold);
      const isOnline = Boolean(driverRow.is_online);
      const workStatus = String(driverRow.current_work_status || 'available');

      if (status !== 'Approved' || isHold) {
        return res.status(409).json({
          success: false,
          error: 'This driver is currently not approved or on hold. Please choose another driver.',
        });
      }

      if (!isOnline) {
        return res.status(409).json({
          success: false,
          error: 'This driver is currently OFFLINE and cannot accept new bookings. Please select an available online driver.',
        });
      }

      if (workStatus === 'on_trip' || workStatus === 'assigned') {
        return res.status(409).json({
          success: false,
          error: 'This driver currently has an active assignment or trip. Please select another available driver.',
        });
      }

      const bookingId = `LD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // Conditional Update: Claim driver atomically (guarantees race safety)
      const claimResult = await db.execute({
        sql: `
          UPDATE drivers 
          SET current_work_status = 'assigned',
              active_booking_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? 
            AND status = 'Approved' 
            AND is_hold = 0 
            AND is_online = 1 
            AND (current_work_status IS NULL OR current_work_status = 'available');
        `,
        args: [bookingId, driverId],
      });

      if (claimResult.rowsAffected === 0) {
        return res.status(409).json({
          success: false,
          error: 'Driver assignment conflict: This driver was just booked by another customer. Please select another driver.',
        });
      }

      // Insert booking into database
      const dataJson = JSON.stringify(otherDetails || {});
      await db.execute({
        sql: `
          INSERT INTO bookings (
            id, customer_name, customer_phone, driver_id, driver_name,
            driver_phone, driver_photo, driver_code, service_title,
            status, pickup_location, destination_location, date, time,
            notes, estimated_fare, idempotency_key, data_json,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `,
        args: [
          bookingId,
          customerName || 'Customer',
          customerPhone,
          driverId,
          String(driverRow.name),
          String(driverRow.phone),
          String(driverRow.photo || ''),
          String(driverRow.driver_code || ''),
          serviceTitle || 'City Driver',
          pickupLocation,
          destinationLocation || '',
          date || '',
          time || '',
          notes || '',
          Number(estimatedFare) || 299,
          idempotencyKey || bookingId,
          dataJson,
        ],
      });

      const newBooking = {
        id: bookingId,
        customerName: customerName || 'Customer',
        customerPhone,
        driverId,
        driverName: String(driverRow.name),
        driverPhone: String(driverRow.phone),
        driverPhoto: String(driverRow.photo || ''),
        driverCode: String(driverRow.driver_code || ''),
        serviceTitle: serviceTitle || 'City Driver',
        status: 'Pending',
        pickupLocation,
        destinationLocation: destinationLocation || '',
        date: date || '',
        time: time || '',
        notes: notes || '',
        estimatedFare: Number(estimatedFare) || 299,
        createdAt: new Date().toISOString(),
        ...otherDetails,
      };

      return res.status(201).json({
        success: true,
        booking: newBooking,
        message: 'Booking confirmed and driver assigned successfully.',
        requestId: reqId,
      });
    } catch (error: any) {
      console.error(`[API Create Booking Error ${reqId}]`, error.message || error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process booking on server.',
        requestId: reqId,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed.' });
}
