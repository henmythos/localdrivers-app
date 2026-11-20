import { initDb } from '../_lib/db.js';

export default async function handler(req: any, res: any) {
  const reqId = `cust-prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await initDb();

  // GET: Fetch customer profile with booking records
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, 'http://localhost');
      const emailParam = url.searchParams.get('email') || req.query?.email;
      const phoneParam = url.searchParams.get('phone') || req.query?.phone;

      if (!emailParam && !phoneParam) {
        return res.status(400).json({ success: false, error: 'Customer email or phone is required.' });
      }

      let sql = `SELECT * FROM customers WHERE 1=0`;
      const args: any[] = [];

      if (emailParam) {
        sql += ` OR LOWER(email) = ?`;
        args.push(String(emailParam).trim().toLowerCase());
      }
      if (phoneParam) {
        const cleanPhone = String(phoneParam).replace(/\D/g, '').slice(-10);
        sql += ` OR phone LIKE ?`;
        args.push(`%${cleanPhone}`);
      }
      sql += ` LIMIT 1;`;

      const custRes = await db.execute({ sql, args });

      if (custRes.rows.length === 0) {
        // Fallback: If not in customers table yet, check bookings table
        if (emailParam) {
          const bkgCheck = await db.execute({
            sql: `SELECT customer_name, customer_phone, customer_email FROM bookings WHERE LOWER(customer_email) = ? LIMIT 1;`,
            args: [String(emailParam).trim().toLowerCase()],
          });
          if (bkgCheck.rows.length > 0) {
            const b = bkgCheck.rows[0];
            return res.status(200).json({
              success: true,
              customer: {
                id: `cust-legacy-${Date.now()}`,
                email: String(b.customer_email || emailParam),
                name: String(b.customer_name || 'Customer'),
                phone: String(b.customer_phone || ''),
                city: 'Hyderabad',
                totalBookings: 1,
                totalSpent: 0,
              },
            });
          }
        }
        return res.status(404).json({ success: false, error: 'Customer profile not found.' });
      }

      const row = custRes.rows[0];
      const email = String(row.email);
      const phone = String(row.phone || '');

      // Query customer aggregated statistics
      let statsSql = `
        SELECT 
          COUNT(*) as total_bookings,
          COALESCE(SUM(CASE WHEN status = 'Completed' THEN COALESCE(final_fare, estimated_fare, 0) ELSE 0 END), 0) as total_spent,
          SUM(CASE WHEN status IN ('Pending', 'Accepted', 'Driver Arriving', 'In Progress') THEN 1 ELSE 0 END) as active_bookings
        FROM bookings 
        WHERE LOWER(customer_email) = ?
      `;
      const statsArgs: any[] = [email.toLowerCase()];
      if (phone) {
        statsSql += ` OR customer_phone LIKE ?`;
        statsArgs.push(`%${phone.slice(-10)}`);
      }

      const statsRes = await db.execute({ sql: statsSql, args: statsArgs });
      const stats: any = statsRes.rows[0] || {};

      return res.status(200).json({
        success: true,
        customer: {
          id: String(row.id),
          email: String(row.email),
          name: String(row.name || ''),
          phone: String(row.phone || ''),
          avatarUrl: String(row.avatar_url || ''),
          city: String(row.city || 'Hyderabad'),
          clerkId: row.clerk_id ? String(row.clerk_id) : undefined,
          totalBookings: Number(stats.total_bookings) || 0,
          totalSpent: Number(stats.total_spent) || 0,
          activeBookings: Number(stats.active_bookings) || 0,
          createdAt: String(row.created_at || ''),
          updatedAt: String(row.updated_at || ''),
        },
      });
    } catch (err: any) {
      console.error(`[API Customer Profile GET Error ${reqId}]`, err.message || err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Update customer contact or details
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const email = body.email ? String(body.email).trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ success: false, error: 'Customer email is required to update profile.' });
      }

      const updates: string[] = [];
      const args: any[] = [];

      if (body.name !== undefined) {
        updates.push('name = ?');
        args.push(String(body.name).trim());
      }
      if (body.phone !== undefined) {
        const cleanPhone = String(body.phone).replace(/\D/g, '').slice(-10);
        updates.push('phone = ?');
        args.push(cleanPhone);
      }
      if (body.city !== undefined) {
        updates.push('city = ?');
        args.push(String(body.city).trim());
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields provided to update.' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      args.push(email);

      await db.execute({
        sql: `UPDATE customers SET ${updates.join(', ')} WHERE LOWER(email) = ?;`,
        args,
      });

      return res.status(200).json({ success: true, message: 'Customer profile updated successfully.' });
    } catch (err: any) {
      console.error(`[API Customer Profile POST Error ${reqId}]`, err.message || err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed.' });
}
