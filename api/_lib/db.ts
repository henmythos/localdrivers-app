import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let dbClient: Client | null = null;
let isInitialized = false;

export function getTursoUrl(): string {
  return (
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.LOCALDRIVERS_TURSO_DATABASE_URL?.trim() ||
    process.env.VITE_TURSO_DATABASE_URL?.trim() ||
    ''
  );
}

export function getTursoToken(): string {
  return (
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    process.env.LOCALDRIVERS_TURSO_AUTH_TOKEN?.trim() ||
    process.env.VITE_TURSO_AUTH_TOKEN?.trim() ||
    ''
  );
}

/**
 * Returns a libSQL client instance.
 * Attempts cloud Turso database first. If unavailable, falls back to a persistent local SQLite file.
 */
export function getDb(): Client {
  if (dbClient) return dbClient;

  const rawUrl = getTursoUrl();
  const rawToken = getTursoToken();

  // If remote URL is provided and valid, try to connect
  if (rawUrl && (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://'))) {
    try {
      dbClient = createClient({
        url: rawUrl,
        authToken: rawToken || undefined,
      });
      return dbClient;
    } catch (err: any) {
      console.warn(`[DB] Failed to initialize remote Turso client: ${err.message}. Falling back to local database.`);
    }
  }

  // Local / serverless SQLite file fallback
  const isVercel = !!process.env.VERCEL;
  const dbDir = isVercel ? '/tmp' : process.cwd();
  const dbPath = path.join(dbDir, 'localdrivers.db');
  const fileUrl = `file:${dbPath}`;

  dbClient = createClient({
    url: fileUrl,
  });

  return dbClient;
}

/**
 * Ensures all required tables and indexes exist.
 * Automatically run before querying or modifying driver registrations.
 */
export async function initDb(): Promise<Client> {
  let db = getDb();

  if (isInitialized) return db;

  try {
    // 1. Drivers Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        driver_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT,
        salt TEXT,
        photo TEXT,
        rating REAL DEFAULT 5.0,
        total_trips INTEGER DEFAULT 0,
        experience_years INTEGER DEFAULT 1,
        languages TEXT,
        services TEXT,
        vehicle_categories TEXT,
        status TEXT NOT NULL DEFAULT 'Pending',
        is_online INTEGER DEFAULT 0,
        is_hold INTEGER DEFAULT 0,
        pending_commission_fee REAL DEFAULT 0,
        starting_price REAL DEFAULT 299,
        distance_km REAL DEFAULT 2.5,
        latitude REAL DEFAULT 17.4126,
        longitude REAL DEFAULT 78.4071,
        area TEXT DEFAULT 'Hyderabad',
        city TEXT DEFAULT 'Hyderabad',
        verification_badge INTEGER DEFAULT 0,
        description TEXT,
        joined_date TEXT,
        rejection_reason TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Driver Documents Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS driver_documents (
        id TEXT PRIMARY KEY,
        driver_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Under Review',
        url TEXT NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      );
    `);

    // Indexes for high performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_driver_docs_driver_id ON driver_documents(driver_id);`);

    // 3. Admin Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'ADMIN',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isInitialized = true;
    return db;
  } catch (err: any) {
    // If the remote Turso client failed due to auth/network, attempt local SQLite fallback
    const rawUrl = getTursoUrl();
    if (rawUrl && (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://'))) {
      console.warn(`[DB] Error initializing remote Turso database (${err.message}). Re-initializing on local SQLite.`);
      const isVercel = !!process.env.VERCEL;
      const dbDir = isVercel ? '/tmp' : process.cwd();
      const dbPath = path.join(dbDir, 'localdrivers.db');
      dbClient = createClient({ url: `file:${dbPath}` });
      isInitialized = false;
      return initDb();
    }
    console.error('[DB] Database initialization error:', err);
    throw err;
  }
}

