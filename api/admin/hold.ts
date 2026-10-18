import { initDb } from '../_lib/db.js';
import { verifyAdminAuth } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `hold-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      requestId: reqId,
    });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrator access required.',
      requestId: reqId,
    });
  }

  try {
    const db = await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { driverId, isHold } = body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'driverId is required.',
        requestId: reqId,
      });
    }

    const holdVal = isHold ? 1 : 0;
    await db.execute({
      sql: `UPDATE drivers SET is_hold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
      args: [holdVal, driverId],
    });

    return res.status(200).json({
      success: true,
      driverId,
      isHold: Boolean(holdVal),
      message: holdVal ? 'Driver placed on hold.' : 'Driver removed from hold.',
      requestId: reqId,
    });
  } catch (error: any) {
    console.error(`[API Hold Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error updating hold status.',
      requestId: reqId,
    });
  }
}
