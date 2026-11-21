import { initDb } from '../../db.js';
import { verifyAdminAuth } from '../../auth.js';

export default async function handler(req: any, res: any) {
  const reqId = `adm-cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed.' });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrator authentication required.',
    });
  }

  try {
    const db = await initDb();

    // 1. Fetch all registered customers from customers table
    const custRes = await db.execute(`
      SELECT 
        c.id, c.email, c.name, c.phone, c.avatar_url, c.city, c.clerk_id, c.created_at, c.updated_at
      FROM customers c
      ORDER BY c.created_at DESC;
    `);

    // 2. Fetch all bookings to compute live statistics per customer
    const bkgRes = await db.execute(`
      SELECT 
        id, customer_name, customer_phone, customer_email, status, estimated_fare, final_fare, created_at
      FROM bookings;
    `);

    // Compute stats map indexed by lowercase email and last 10 digits of phone
    const emailStats = new Map<string, { count: number; spent: number; lastDate: string; activeCount: number }>();
    const phoneStats = new Map<string, { count: number; spent: number; lastDate: string; activeCount: number }>();
    const unlinkedCustomers = new Map<string, any>();

    for (const b of bkgRes.rows) {
      const email = b.customer_email ? String(b.customer_email).trim().toLowerCase() : '';
      const rawPhone = b.customer_phone ? String(b.customer_phone).trim() : '';
      const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);
      const fare = Number(b.final_fare || b.estimated_fare || 0);
      const isCompleted = b.status === 'Completed';
      const isActive = ['Pending', 'Accepted', 'Driver Arriving', 'In Progress'].includes(String(b.status));
      const bDate = String(b.created_at || '');

      if (email) {
        const cur = emailStats.get(email) || { count: 0, spent: 0, lastDate: '', activeCount: 0 };
        cur.count += 1;
        if (isCompleted) cur.spent += fare;
        if (isActive) cur.activeCount += 1;
        if (!cur.lastDate || bDate > cur.lastDate) cur.lastDate = bDate;
        emailStats.set(email, cur);
      }

      if (phoneDigits) {
        const cur = phoneStats.get(phoneDigits) || { count: 0, spent: 0, lastDate: '', activeCount: 0 };
        cur.count += 1;
        if (isCompleted) cur.spent += fare;
        if (isActive) cur.activeCount += 1;
        if (!cur.lastDate || bDate > cur.lastDate) cur.lastDate = bDate;
        phoneStats.set(phoneDigits, cur);
      }

      // If this booking has no email and phone not in customers table, collect as legacy unlinked
      if (!email && phoneDigits) {
        if (!unlinkedCustomers.has(phoneDigits)) {
          unlinkedCustomers.set(phoneDigits, {
            id: `legacy-${phoneDigits}`,
            email: '',
            name: String(b.customer_name || 'Rider'),
            phone: rawPhone,
            city: 'Hyderabad',
            createdAt: bDate,
          });
        }
      }
    }

    const customers: any[] = [];
    const registeredEmails = new Set<string>();
    const registeredPhones = new Set<string>();

    for (const row of custRes.rows) {
      const email = String(row.email).toLowerCase();
      registeredEmails.add(email);
      const phone = String(row.phone || '');
      const phoneDigits = phone.replace(/\D/g, '').slice(-10);
      if (phoneDigits) registeredPhones.add(phoneDigits);

      const eStat = emailStats.get(email);
      const pStat = phoneDigits ? phoneStats.get(phoneDigits) : undefined;

      const totalBookings = Math.max(eStat?.count || 0, pStat?.count || 0);
      const totalSpent = Math.max(eStat?.spent || 0, pStat?.spent || 0);
      const lastActive = eStat?.lastDate || pStat?.lastDate || String(row.created_at || '');

      customers.push({
        id: String(row.id),
        email: String(row.email),
        name: String(row.name || 'Customer'),
        phone: phone,
        avatarUrl: String(row.avatar_url || ''),
        city: String(row.city || 'Hyderabad'),
        clerkId: row.clerk_id ? String(row.clerk_id) : undefined,
        totalBookings,
        totalSpent,
        lastActive,
        joined: String(row.created_at || '').split('T')[0] || String(row.created_at || '').split(' ')[0],
        createdAt: String(row.created_at || ''),
      });
    }

    // Add unlinked legacy riders from bookings who haven't signed up with Google yet
    for (const [phoneDigits, unlinked] of Array.from(unlinkedCustomers.entries())) {
      if (!registeredPhones.has(phoneDigits)) {
        const pStat = phoneStats.get(phoneDigits);
        customers.push({
          id: unlinked.id,
          email: '',
          name: unlinked.name,
          phone: unlinked.phone,
          avatarUrl: '',
          city: unlinked.city,
          totalBookings: pStat?.count || 1,
          totalSpent: pStat?.spent || 0,
          lastActive: pStat?.lastDate || unlinked.createdAt,
          joined: String(unlinked.createdAt || '').split('T')[0] || '2026-02-01',
          createdAt: unlinked.createdAt,
          isGuestRider: true,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (err: any) {
    console.error(`[Admin Customers Error ${reqId}]`, err.message || err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
