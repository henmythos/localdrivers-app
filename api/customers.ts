import customerProfileHandler from './_lib/handlers/customers/profile.js';
import customerSyncHandler from './_lib/handlers/customers/sync.js';

function extractAction(req: any): string {
  if (req.query?.action) {
    const act = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
    if (act) return String(act).toLowerCase().replace(/^\/+|\/+$/g, '');
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const parts = parsed.pathname.split('/').filter(Boolean);
      const custIdx = parts.indexOf('customers');
      if (custIdx !== -1 && parts[custIdx + 1]) {
        return parts.slice(custIdx + 1).join('/').toLowerCase().replace(/^\/+|\/+$/g, '');
      }
    } catch {}
  }
  return '';
}

export default async function handler(req: any, res: any) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = extractAction(req);

  switch (action) {
    case 'profile':
      return customerProfileHandler(req, res);
    case 'sync':
      return customerSyncHandler(req, res);
    default:
      return res.status(404).json({ error: `Customer endpoint not found: ${action || '(root)'}` });
  }
}
