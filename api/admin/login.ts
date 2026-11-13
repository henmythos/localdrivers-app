import { generateAdminToken, cleanEnvValue, getAuthSecret } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST for administrator authentication.',
      requestId: reqId,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // 1. Clerk Authentication: Authorize localdrivers.in@gmail.com via Clerk Google Sign In
    if (body.clerkToken) {
      try {
        const { verifyToken, createClerkClient } = await import('@clerk/backend');
        const secretKey = cleanEnvValue(process.env.CLERK_SECRET_KEY);
        if (!secretKey) {
          throw new Error('Server CLERK_SECRET_KEY is missing or unconfigured.');
        }

        const verified = await verifyToken(body.clerkToken, { secretKey });
        const clerkClient = createClerkClient({ secretKey });
        const user = await clerkClient.users.getUser(verified.sub);
        const emails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
        const isAdmin = emails.includes('localdrivers.in@gmail.com');

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Only localdrivers.in@gmail.com is authorized as Administrator.',
            requestId: reqId,
          });
        }

        const token = generateAdminToken('localdrivers.in@gmail.com');
        return res.status(200).json({
          success: true,
          token,
          admin: {
            username: 'localdrivers.in@gmail.com',
            role: 'ADMIN',
          },
          requestId: reqId,
        });
      } catch (clerkErr: any) {
        console.error(`[Admin Clerk Login Error ${reqId}]:`, clerkErr.message || clerkErr);
        return res.status(401).json({
          success: false,
          error: `Clerk verification failed: ${clerkErr.message || 'Invalid token'}`,
          requestId: reqId,
        });
      }
    }

    const rawUser = body.username || body.userId || body.user || body.identifier || body.email || '';
    const rawPass = body.password || '';

    const cleanUser = String(rawUser).trim().toLowerCase();
    const cleanPass = String(rawPass);

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({
        success: false,
        error: 'Administrator User ID and Password are required.',
        requestId: reqId,
      });
    }

    const configuredAdminUser = cleanEnvValue(process.env.ADMIN_USERNAME);
    const configuredAdminPass = cleanEnvValue(process.env.ADMIN_PASSWORD);
    const authSecret = getAuthSecret();

    if (!configuredAdminUser || !configuredAdminPass || !authSecret) {
      console.error(`[Admin Auth Configuration Error ${reqId}]: Server admin credentials or ADMIN_JWT_SECRET missing or unconfigured.`);
      return res.status(500).json({
        success: false,
        error: 'Server authentication configuration error. Administrator credentials or security keys are not properly configured in the server environment.',
        requestId: reqId,
      });
    }

    // Strict identity match: only the explicitly configured administrator account is permitted.
    // Undocumented aliases ('admin', 'ranjith') are strictly disallowed.
    const isUserMatch = cleanUser === configuredAdminUser.toLowerCase();

    // Strict password match: strictly case-sensitive comparison.
    // Case-insensitivity and backdoors ('admin123') are strictly disallowed.
    const isPassMatch = cleanPass === configuredAdminPass;

    if (!isUserMatch || !isPassMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials.',
        requestId: reqId,
      });
    }

    // Generate cryptographically signed JWT for authenticated admin
    const token = generateAdminToken(configuredAdminUser);

    return res.status(200).json({
      success: true,
      token,
      admin: {
        username: configuredAdminUser,
        role: 'ADMIN',
      },
      requestId: reqId,
    });
  } catch (err: any) {
    console.error(`[Admin Login Exception ${reqId}]:`, err.message || err);
    return res.status(500).json({
      success: false,
      error: 'Administrator authentication failure.',
      requestId: reqId,
    });
  }
}
