import crypto from 'crypto';

const AUTH_SECRET = process.env.ADMIN_JWT_SECRET || process.env.AUTH_SECRET || 'localdrivers_production_sec_key_2026_x871b';

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Signs a payload with HMAC-SHA256 to create a tamper-proof JWT
 */
export function signJwt(payload: Record<string, any>, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${claims}`)
    .digest('base64url');
  return `${header}.${claims}.${signature}`;
}

/**
 * Verifies a JWT token with HMAC-SHA256 and checks expiration
 */
export function verifyJwt<T = any>(token: string): T | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, claims, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${claims}`)
      .digest('base64url');

    if (signature.length !== expectedSignature.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
    if (!decoded.exp || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }

    return decoded as T;
  } catch {
    return null;
  }
}

/**
 * Generate cryptographically signed token for driver sessions
 */
export function generateToken(payload: Record<string, any>): string {
  return signJwt(payload);
}

/**
 * Generate cryptographically signed token for administrator sessions
 */
export function generateAdminToken(username: string): string {
  return signJwt({
    sub: 'admin',
    role: 'ADMIN',
    username,
  });
}

/**
 * Authoritative server-side administrator authorization verification.
 * Strictly requires a valid, server-verified cryptographically signed administrator token.
 * Static tokens, mock headers (e.g. x-admin-auth), and tampered/expired tokens are rejected.
 */
export function verifyAdminAuth(req: any): boolean {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return false;

  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return false;

  const decoded = verifyJwt<{ role: string; username?: string }>(token);
  if (decoded && decoded.role === 'ADMIN') {
    return true;
  }

  return false;
}

/**
 * Verifies driver authorization from Bearer token
 */
export function verifyDriverAuth(req: any): { sub: string; role: string; phone?: string } | null {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const decoded = verifyJwt<{ sub: string; role: string; phone?: string }>(token);
  if (decoded && decoded.role === 'DRIVER') {
    return decoded;
  }

  return null;
}
