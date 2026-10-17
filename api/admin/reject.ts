import { initDb } from '../_lib/db';
import { verifyAdminAuth } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized: Administrator access required.' });
  }

  try {
    const db = await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { driverId, reason = 'Document verification could not be completed' } = body;

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required for rejection.' });
    }

    const driverCheck = await db.execute({
      sql: `SELECT id, name FROM drivers WHERE id = ?;`,
      args: [driverId]
    });

    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ error: `Driver with ID ${driverId} not found.` });
    }

    const driverName = driverCheck.rows[0].name;

    await db.execute({
      sql: `UPDATE drivers SET
        status = 'Rejected',
        verification_badge = 0,
        is_online = 0,
        rejection_reason = ?,
        reviewed_by = 'Ranjith.ceo',
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;`,
      args: [reason, driverId]
    });

    await db.execute({
      sql: `UPDATE driver_documents SET status = 'Rejected' WHERE driver_id = ?;`,
      args: [driverId]
    });

    return res.status(200).json({
      success: true,
      message: `Driver application for ${driverName} rejected. Reason: ${reason}.`,
    });
  } catch (error: any) {
    console.error('[API Reject Driver Error]', error);
    return res.status(500).json({
      error: 'Failed to reject driver application in database.',
      details: error.message,
    });
  }
}
