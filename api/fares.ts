import { initDb } from './_lib/db.js';
import { verifyAdminAuth } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `far-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await initDb();

  // GET: Fetch real-time active fare prices
  if (req.method === 'GET') {
    try {
      const rows = await db.execute(`SELECT key, value FROM app_settings;`);
      const settingsMap: Record<string, string> = {};
      for (const r of rows.rows) {
        settingsMap[String(r.key)] = String(r.value);
      }

      const fares = {
        hourlyRate: Number(settingsMap['hourly_rate']) || 200,
        minimumHours: Number(settingsMap['minimum_hours']) || 2,
        dailyRate24h: Number(settingsMap['daily_rate_24h']) || 2000,
        outstationRatePerDay: Number(settingsMap['outstation_rate_per_day']) || 2200,
        outstationIncludedKmPerDay: Number(settingsMap['outstation_included_km']) || 250,
        outstationExtraKmRate: Number(settingsMap['outstation_extra_km_rate']) || 12,
        waitingChargePerHour: Number(settingsMap['waiting_charge_per_hour']) || 99,
        nightAllowance: Number(settingsMap['night_allowance']) || 300,
        multiDayDiscountPercent: Number(settingsMap['multi_day_discount_percent']) || 10,
        commissionPercent: Number(settingsMap['commission_percent']) || 10,
        adminUpiId: settingsMap['admin_upi_id'] || 'localdrivers.in@okaxis',
      };

      return res.status(200).json({
        success: true,
        fares,
        requestId: reqId,
      });
    } catch (err: any) {
      console.error(`[API Fares GET Error ${reqId}]:`, err.message || err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve active fares.' });
    }
  }

  // POST: Admin updates fare prices in real time (affects immediately whole app)
  if (req.method === 'POST') {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Administrator credentials required to update fares.',
        requestId: reqId,
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      const keyMapping: Record<string, string> = {
        hourlyRate: 'hourly_rate',
        minimumHours: 'minimum_hours',
        dailyRate24h: 'daily_rate_24h',
        outstationRatePerDay: 'outstation_rate_per_day',
        outstationIncludedKmPerDay: 'outstation_included_km',
        outstationExtraKmRate: 'outstation_extra_km_rate',
        waitingChargePerHour: 'waiting_charge_per_hour',
        nightAllowance: 'night_allowance',
        multiDayDiscountPercent: 'multi_day_discount_percent',
        commissionPercent: 'commission_percent',
        adminUpiId: 'admin_upi_id',
      };

      for (const [camelKey, dbKey] of Object.entries(keyMapping)) {
        if (body[camelKey] !== undefined) {
          await db.execute({
            sql: `
              INSERT INTO app_settings (key, value, updated_at) 
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;
            `,
            args: [dbKey, String(body[camelKey])],
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Fare prices updated successfully. Real-time platform rates are now active across the app.',
        fares: body,
        requestId: reqId,
      });
    } catch (err: any) {
      console.error(`[API Fares POST Error ${reqId}]:`, err.message || err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to update fare prices.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed.' });
}
