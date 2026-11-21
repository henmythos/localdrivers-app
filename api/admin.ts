import loginHandler from './_lib/handlers/admin/login.js';
import allDriversHandler from './_lib/handlers/admin/all-drivers.js';
import pendingDriversHandler from './_lib/handlers/admin/pending-drivers.js';
import approveHandler from './_lib/handlers/admin/approve.js';
import rejectHandler from './_lib/handlers/admin/reject.js';
import customersHandler from './_lib/handlers/admin/customers.js';

function extractAction(req: any): string {
  if (req.query?.action) {
    const act = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
    if (act) return String(act).toLowerCase().replace(/^\/+|\/+$/g, '');
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const parts = parsed.pathname.split('/').filter(Boolean);
      const adminIdx = parts.indexOf('admin');
      if (adminIdx !== -1 && parts[adminIdx + 1]) {
        return parts.slice(adminIdx + 1).join('/').toLowerCase().replace(/^\/+|\/+$/g, '');
      }
    } catch {}
  }
  return '';
}

export default async function handler(req: any, res: any) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = extractAction(req);

  switch (action) {
    case 'login':
      return loginHandler(req, res);
    case 'all-drivers':
      return allDriversHandler(req, res);
    case 'pending-drivers':
      return pendingDriversHandler(req, res);
    case 'approve':
      return approveHandler(req, res);
    case 'reject':
      return rejectHandler(req, res);
    case 'customers':
      return customersHandler(req, res);
    default:
      return res.status(404).json({ error: `Admin endpoint not found: ${action || '(root)'}` });
  }
}
