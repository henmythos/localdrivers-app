import { initDb } from '../_lib/db.js';

export default async function handler(req: any, res: any) {
  const reqId = `avail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await initDb();

  // GET current availability for a driver
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const driverId = url.searchParams.get('driverId');

    if (!driverId) {
      return res.status(400).json({ success: false, error: 'driverId parameter is required' });
    }

    try {
      const result = await db.execute({
        sql: `SELECT id, status, is_online, is_hold, current_work_status, active_booking_id, last_online_at FROM drivers WHERE id = ?`,
        args: [driverId],
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Driver not found' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        success: true,
        driverId: String(row.id),
        status: String(row.status),
        isOnline: Boolean(row.is_online),
        isHold: Boolean(row.is_hold),
        currentWorkStatus: String(row.current_work_status || 'available'),
        activeBookingId: row.active_booking_id ? String(row.active_booking_id) : null,
        isBookable: String(row.status) === 'Approved' && !Boolean(row.is_hold) && Boolean(row.is_online) && String(row.current_work_status || 'available') !== 'on_trip',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST or GET.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { driverId, isOnline, latitude, longitude } = body;

    if (!driverId) {
      return res.status(400).json({ success: false, error: 'driverId is required' });
    }

    // 1. Check existing driver state in database
    const driverRes = await db.execute({
      sql: `SELECT id, status, is_hold, is_online, current_work_status, active_booking_id FROM drivers WHERE id = ?`,
      args: [driverId],
    });

    if (driverRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver record not found.' });
    }

    const currentDriver = driverRes.rows[0];
    const currentStatus = String(currentDriver.status);
    const isHold = Boolean(currentDriver.is_hold);
    const currentWorkStatus = String(currentDriver.current_work_status || 'available');

    // Rule: Pending or Rejected drivers cannot become bookable
    if (isOnline && (currentStatus === 'Pending' || currentStatus === 'Rejected')) {
      return res.status(403).json({
        success: false,
        error: `Cannot go online. Your driver profile status is '${currentStatus}'. Approval by admin is required.`,
        savedState: {
          isOnline: false,
          status: currentStatus,
          currentWorkStatus,
        },
      });
    }

    // Rule: Driver on Hold cannot go online
    if (isOnline && isHold) {
      return res.status(403).json({
        success: false,
        error: 'Cannot go online while account is on Hold or platform commission fee is pending.',
        savedState: {
          isOnline: false,
          status: currentStatus,
          isHold: true,
          currentWorkStatus,
        },
      });
    }

    // Rule: If driver is currently on a trip and toggles offline/online:
    // Trip must remain active and timer intact.
    const targetOnlineVal = isOnline ? 1 : 0;
    const nowIso = new Date().toISOString();

    let updateSql = `
      UPDATE drivers 
      SET is_online = ?, 
          last_online_at = ?,
          updated_at = CURRENT_TIMESTAMP
    `;
    const updateArgs: any[] = [targetOnlineVal, nowIso];

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      updateSql += `, latitude = ?, longitude = ?, last_location_at = ?`;
      updateArgs.push(latitude, longitude, nowIso);
    }

    updateSql += ` WHERE id = ?`;
    updateArgs.push(driverId);

    await db.execute({ sql: updateSql, args: updateArgs });

    // Effective bookability:
    // An approved driver who is online and NOT currently on a trip
    const isBookable = currentStatus === 'Approved' && !isHold && Boolean(targetOnlineVal) && currentWorkStatus !== 'on_trip';

    return res.status(200).json({
      success: true,
      driverId,
      isOnline: Boolean(targetOnlineVal),
      status: currentStatus,
      currentWorkStatus,
      isBookable,
      message: targetOnlineVal
        ? (currentWorkStatus === 'on_trip'
            ? 'Saved online preference. Note: You have an active trip in progress and will be discoverable once the trip is completed.'
            : 'You are now ONLINE and available for bookings.')
        : (currentWorkStatus === 'on_trip'
            ? 'Saved offline preference. Your active trip remains in progress; you will not receive new bookings.'
            : 'You are now OFFLINE and hidden from customer search.'),
    });
  } catch (error: any) {
    console.error(`[API Availability Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update availability on server. Please retry.',
      requestId: reqId,
    });
  }
}
