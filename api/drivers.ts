import driversListHandler from './_lib/handlers/drivers/index.js';
import driverLoginHandler from './_lib/handlers/drivers/login.js';
import driverRegisterHandler from './_lib/handlers/drivers/register.js';

function extractAction(req: any): string {
  if (req.query?.action) {
    const act = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
    if (act) return String(act).toLowerCase().replace(/^\/+|\/+$/g, '');
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const parts = parsed.pathname.split('/').filter(Boolean);
      const driversIdx = parts.indexOf('drivers');
      if (driversIdx !== -1 && parts[driversIdx + 1]) {
        return parts.slice(driversIdx + 1).join('/').toLowerCase().replace(/^\/+|\/+$/g, '');
      }
    } catch {}
  }
  return '';
}

export default async function handler(req: any, res: any) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-driver-token');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = extractAction(req);

  switch (action) {
    case '':
    case 'index':
      return driversListHandler(req, res);
    case 'login':
      return driverLoginHandler(req, res);
    case 'register':
      return driverRegisterHandler(req, res);
    default:
      return res.status(404).json({ error: `Driver endpoint not found: ${action}` });
  }
}
