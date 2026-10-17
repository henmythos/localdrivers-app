import { initDb, getTursoUrl, getTursoToken } from './_lib/db.js';
import { isR2Configured, getR2Config } from './_lib/storage.js';

export default async function handler(req: any, res: any) {
  const reqId = `hlth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbLatencyMs = 0;
  let dbError: string | null = null;
  let driverCount = 0;

  try {
    const db = await initDb();
    const t0 = Date.now();
    const result = await db.execute('SELECT COUNT(*) as count FROM drivers;');
    dbLatencyMs = Date.now() - t0;
    driverCount = Number(result.rows[0]?.count) || 0;
    dbStatus = 'CONNECTED';
  } catch (err: any) {
    dbStatus = 'ERROR';
    dbError = err.message || 'Unknown DB error';
  }

  const r2Configured = isR2Configured();
  const r2Config = getR2Config();

  const isHealthy = dbStatus === 'CONNECTED';
  const totalLatencyMs = Date.now() - startTime;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'OPERATIONAL' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    totalLatencyMs,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      driverCount,
      urlConfigured: !!getTursoUrl(),
      tokenConfigured: !!getTursoToken(),
      error: dbError,
    },
    storage: {
      status: r2Configured ? 'CONFIGURED' : 'DEV_PUBLIC_FALLBACK',
      bucket: r2Config.bucketName,
      publicUrl: r2Config.publicUrl,
    },
    environment: {
      platform: process.env.VERCEL ? 'VERCEL_SERVERLESS' : 'NODEJS_LOCAL',
      nodeVersion: process.version,
    },
    requestId: reqId,
  });
}
