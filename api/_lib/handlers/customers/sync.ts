import { initDb } from '../../db.js';

export default async function handler(req: any, res: any) {
  const reqId = `cust-sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST to sync customer profile.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const rawEmail = body.email || body.primaryEmail || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid customer email is required.' });
    }

    const name = body.name ? String(body.name).trim() : '';
    const rawPhone = body.phone ? String(body.phone).trim() : '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : '';
    const city = body.city ? String(body.city).trim() : 'Hyderabad';
    const clerkId = body.clerkId ? String(body.clerkId).trim() : null;
    const custId = clerkId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const db = await initDb();

    // 1. Upsert customer profile into database
    await db.execute({
      sql: `
        INSERT INTO customers (id, email, name, phone, avatar_url, city, clerk_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(email) DO UPDATE SET
          name = CASE WHEN excluded.name != '' THEN excluded.name ELSE customers.name END,
          phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE customers.phone END,
          avatar_url = CASE WHEN excluded.avatar_url != '' THEN excluded.avatar_url ELSE customers.avatar_url END,
          city = CASE WHEN excluded.city != '' THEN excluded.city ELSE customers.city END,
          clerk_id = COALESCE(excluded.clerk_id, customers.clerk_id),
          updated_at = CURRENT_TIMESTAMP;
      `,
      args: [custId, cleanEmail, name || null, cleanPhone || null, avatarUrl || null, city, clerkId],
    });

    // 2. Retroactively bind historical rides for customer's phone or email
    if (cleanPhone) {
      await db.execute({
        sql: `
          UPDATE bookings 
          SET customer_email = ?,
              customer_id = COALESCE(customer_id, ?)
          WHERE (customer_phone LIKE ? OR replace(replace(customer_phone, ' ', ''), '+', '') LIKE ?)
            AND (customer_email IS NULL OR customer_email = '');
        `,
        args: [cleanEmail, custId, `%${cleanPhone}`, `%${cleanPhone}`],
      });
    }

    // 3. Query authoritative updated customer profile
    const custRes = await db.execute({
      sql: `SELECT * FROM customers WHERE email = ? LIMIT 1;`,
      args: [cleanEmail],
    });

    const customerRow = custRes.rows[0];

    // 4. Calculate real-time trip frequency and spend
    let statsSql = `
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN COALESCE(final_fare, estimated_fare, 0) ELSE 0 END), 0) as total_spent,
        SUM(CASE WHEN status IN ('Pending', 'Accepted', 'Driver Arriving', 'In Progress') THEN 1 ELSE 0 END) as active_bookings
      FROM bookings 
      WHERE LOWER(customer_email) = ?
    `;
    const statsArgs: any[] = [cleanEmail];
    if (cleanPhone) {
      statsSql += ` OR customer_phone LIKE ?`;
      statsArgs.push(`%${cleanPhone}`);
    }

    const statsRes = await db.execute({ sql: statsSql, args: statsArgs });
    const stats: any = statsRes.rows[0] || {};

    return res.status(200).json({
      success: true,
      customer: {
        id: String(customerRow.id),
        email: String(customerRow.email),
        name: String(customerRow.name || ''),
        phone: String(customerRow.phone || ''),
        avatarUrl: String(customerRow.avatar_url || ''),
        city: String(customerRow.city || 'Hyderabad'),
        clerkId: customerRow.clerk_id ? String(customerRow.clerk_id) : undefined,
        totalBookings: Number(stats.total_bookings) || 0,
        totalSpent: Number(stats.total_spent) || 0,
        activeBookings: Number(stats.active_bookings) || 0,
        createdAt: String(customerRow.created_at || ''),
        updatedAt: String(customerRow.updated_at || ''),
      },
    });
  } catch (err: any) {
    console.error(`[API Customer Sync Error ${reqId}]`, err.message || err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
