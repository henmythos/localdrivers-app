import { createClient as createWebClient } from '@libsql/client/web';
import { createClient as createNodeClient } from '@libsql/client';
import type { Client } from '@libsql/client';
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
 * Prefers pure-web client for remote Turso HTTP/libSQL endpoints (no native bindings required).
 * Falls back to local SQLite file for local development.
 */
export function getDb(): Client {
  if (dbClient) return dbClient;

  const rawUrl = getTursoUrl();
  const rawToken = getTursoToken();

  // If remote Turso URL is provided and valid, use pure-web client (zero native bindings)
  if (rawUrl && (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://'))) {
    try {
      dbClient = createWebClient({
        url: rawUrl,
        authToken: rawToken || undefined,
      }) as unknown as Client;
      return dbClient;
    } catch (err: any) {
      console.warn(`[DB] Failed to create remote Turso client: ${err.message}.`);
    }
  }

  // Local SQLite file fallback
  const isVercel = !!process.env.VERCEL;
  const dbDir = isVercel ? '/tmp' : process.cwd();
  const dbPath = path.join(dbDir, 'localdrivers.db');
  const fileUrl = `file:${dbPath}`;

  dbClient = createNodeClient({
    url: fileUrl,
  });

  return dbClient;
}

/**
 * Ensures all required tables and indexes exist.
 * Guaranteed to never enter infinite recursive loops on connection errors.
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

    // Safe column migrations on drivers table
    const safeAddColumns = [
      "ALTER TABLE drivers ADD COLUMN current_work_status TEXT DEFAULT 'available';",
      "ALTER TABLE drivers ADD COLUMN active_booking_id TEXT;",
      "ALTER TABLE drivers ADD COLUMN last_online_at TEXT;",
      "ALTER TABLE drivers ADD COLUMN last_location_at TEXT;"
    ];

    for (const alterSql of safeAddColumns) {
      try {
        await db.execute(alterSql);
      } catch (colErr: any) {
        // Ignore duplicate column errors
        if (!colErr.message?.includes('duplicate column')) {
          // console.warn('[DB Migration]', colErr.message);
        }
      }
    }

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

    // 3. Bookings Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        driver_id TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        driver_phone TEXT,
        driver_photo TEXT,
        driver_code TEXT,
        service_title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        pickup_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        pickup_coords TEXT,
        destination_coords TEXT,
        date TEXT,
        time TEXT,
        notes TEXT,
        estimated_fare REAL NOT NULL,
        final_fare REAL,
        trip_start_time TEXT,
        trip_end_time TEXT,
        trip_duration_minutes INTEGER,
        waiting_duration_minutes INTEGER DEFAULT 0,
        start_latitude REAL,
        start_longitude REAL,
        end_latitude REAL,
        end_longitude REAL,
        idempotency_key TEXT UNIQUE,
        data_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      );
    `);

    // Indexes for high performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_driver_docs_driver_id ON driver_documents(driver_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);`);

    // 4. Admin Users Table
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
    console.error('[DB Init Error]:', err.message || err);

    // If remote Turso failed and we haven't tried local fallback yet
    const rawUrl = getTursoUrl();
    if (rawUrl && (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://')) && !process.env.VERCEL) {
      console.warn(`[DB] Switching to local SQLite development database.`);
      const dbPath = path.join(process.cwd(), 'localdrivers.db');
      dbClient = createNodeClient({ url: `file:${dbPath}` });
      isInitialized = false;

      // One-time local retry
      await dbClient.execute(`
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
          current_work_status TEXT DEFAULT 'available',
          active_booking_id TEXT,
          last_online_at TEXT,
          last_location_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const safeAddColumnsLocal = [
        "ALTER TABLE drivers ADD COLUMN current_work_status TEXT DEFAULT 'available';",
        "ALTER TABLE drivers ADD COLUMN active_booking_id TEXT;",
        "ALTER TABLE drivers ADD COLUMN last_online_at TEXT;",
        "ALTER TABLE drivers ADD COLUMN last_location_at TEXT;"
      ];
      for (const alterSql of safeAddColumnsLocal) {
        try { await dbClient.execute(alterSql); } catch {}
      }

      await dbClient.execute(`
        CREATE TABLE IF NOT EXISTS driver_documents (
          id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Under Review',
          url TEXT NOT NULL,
          uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await dbClient.execute(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          driver_id TEXT NOT NULL,
          driver_name TEXT NOT NULL,
          driver_phone TEXT,
          driver_photo TEXT,
          driver_code TEXT,
          service_title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending',
          pickup_location TEXT NOT NULL,
          destination_location TEXT NOT NULL,
          pickup_coords TEXT,
          destination_coords TEXT,
          date TEXT,
          time TEXT,
          notes TEXT,
          estimated_fare REAL NOT NULL,
          final_fare REAL,
          trip_start_time TEXT,
          trip_end_time TEXT,
          trip_duration_minutes INTEGER,
          waiting_duration_minutes INTEGER DEFAULT 0,
          start_latitude REAL,
          start_longitude REAL,
          end_latitude REAL,
          end_longitude REAL,
          idempotency_key TEXT UNIQUE,
          data_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      isInitialized = true;
      return dbClient;
    }

    throw err;
  }
}
