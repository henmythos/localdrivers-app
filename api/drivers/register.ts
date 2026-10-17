import { initDb } from '../_lib/db';
import { uploadFileBuffer, parseDataUrl } from '../_lib/storage';
import { hashPassword } from '../_lib/auth';

function generateDriverCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '123456789';
  const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const l3 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  return `${l1}${n1}${l2}${n2}${l3}${n3}`;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-auth');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const db = await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const {
      name,
      phone,
      email,
      password,
      area = 'Hyderabad',
      city = 'Hyderabad',
      experienceYears = 1,
      languages = ['Telugu', 'Hindi'],
      services = ['City Driver'],
      vehicleCategories = ['Manual', 'Automatic'],
      description = '',
      documents = [],
      photo = '',
    } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }

    const cleanPhoneDigits = (phone || '').toString().replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
    }

    const standardPhone = cleanPhoneDigits.length === 10
      ? `+91 ${cleanPhoneDigits.slice(0, 5)} ${cleanPhoneDigits.slice(5)}`
      : `+${cleanPhoneDigits}`;

    // 2. Check for existing driver with same phone number
    const last10 = cleanPhoneDigits.slice(-10);
    const existingCheck = await db.execute({
      sql: `SELECT id, driver_code, status, name FROM drivers WHERE 
        phone = ? OR 
        replace(replace(replace(phone, ' ', ''), '+', ''), '-', '') LIKE ?;`,
      args: [standardPhone, `%${last10}%`]
    });

    let driverId = `drv-${Date.now()}`;
    let driverCode = generateDriverCode();
    let isUpdate = false;

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      if (existing.status === 'Approved') {
        return res.status(400).json({
          error: `A driver account for ${existing.name} with this mobile number is already Approved. Please proceed to Driver Login.`
        });
      }
      // Allow resuming or updating pending/rejected application
      driverId = String(existing.id);
      driverCode = String(existing.driver_code);
      isUpdate = true;
    }

    // 3. Process Profile Photo & Documents
    let savedPhotoUrl = photo;
    if (photo && photo.startsWith('data:')) {
      const parsed = parseDataUrl(photo);
      if (parsed) {
        const ext = parsed.contentType.split('/')[1] || 'jpg';
        const key = `driver-photos/${driverId}-selfie.${ext}`;
        const upload = await uploadFileBuffer(key, parsed.buffer, parsed.contentType);
        savedPhotoUrl = upload.url;
      }
    }

    const processedDocuments: Array<{ id: string; type: string; status: string; url: string; uploadedAt: string }> = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      let docUrl = doc.url || '';

      if (docUrl && docUrl.startsWith('data:')) {
        const parsed = parseDataUrl(docUrl);
        if (parsed) {
          const ext = parsed.contentType.split('/')[1] || 'jpg';
          const cleanDocType = (doc.type || `doc-${i}`).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const key = `driver-documents/${driverId}-${cleanDocType}.${ext}`;
          const upload = await uploadFileBuffer(key, parsed.buffer, parsed.contentType);
          docUrl = upload.url;
        }
      }

      const docId = doc.id || `doc-${driverId}-${i + 1}`;
      processedDocuments.push({
        id: docId,
        type: doc.type,
        status: 'Under Review',
        url: docUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    // Ensure photo selfie is in documents list
    if (savedPhotoUrl && !processedDocuments.some(d => d.type === 'Profile Photo Selfie')) {
      processedDocuments.unshift({
        id: `doc-${driverId}-selfie`,
        type: 'Profile Photo Selfie',
        status: 'Under Review',
        url: savedPhotoUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    // 4. Password hashing
    let passwordHash = '';
    let salt = '';
    if (password && typeof password === 'string' && password.trim().length >= 4) {
      const hashed = hashPassword(password.trim());
      passwordHash = hashed.hash;
      salt = hashed.salt;
    } else {
      // Default initial hash from mobile number
      const hashed = hashPassword(cleanPhoneDigits.slice(-10));
      passwordHash = hashed.hash;
      salt = hashed.salt;
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // 5. Database transaction (or batch)
    if (isUpdate) {
      await db.execute({
        sql: `UPDATE drivers SET
          name = ?,
          email = ?,
          password_hash = COALESCE(?, password_hash),
          salt = COALESCE(?, salt),
          photo = ?,
          experience_years = ?,
          languages = ?,
          services = ?,
          vehicle_categories = ?,
          status = 'Pending',
          area = ?,
          city = ?,
          description = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;`,
        args: [
          name.trim(),
          email?.trim() || `${cleanPhoneDigits}@localdrivers.in`,
          passwordHash || null,
          salt || null,
          savedPhotoUrl || '',
          Number(experienceYears) || 1,
          JSON.stringify(languages),
          JSON.stringify(services),
          JSON.stringify(vehicleCategories),
          area.trim(),
          city.trim(),
          description.trim(),
          driverId
        ]
      });

      // Clear old documents for fresh submission
      await db.execute({
        sql: `DELETE FROM driver_documents WHERE driver_id = ?;`,
        args: [driverId]
      });
    } else {
      await db.execute({
        sql: `INSERT INTO drivers (
          id, driver_code, name, phone, email, password_hash, salt, photo,
          rating, total_trips, experience_years, languages, services,
          vehicle_categories, status, is_online, is_hold, pending_commission_fee,
          starting_price, distance_km, latitude, longitude, area, city,
          verification_badge, description, joined_date, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          5.0, 0, ?, ?, ?,
          ?, 'Pending', 0, 0, 0,
          299, 2.5, 17.4126, 78.4071, ?, ?,
          0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );`,
        args: [
          driverId,
          driverCode,
          name.trim(),
          standardPhone,
          email?.trim() || `${cleanPhoneDigits}@localdrivers.in`,
          passwordHash,
          salt,
          savedPhotoUrl || '',
          Number(experienceYears) || 1,
          JSON.stringify(languages),
          JSON.stringify(services),
          JSON.stringify(vehicleCategories),
          area.trim(),
          city.trim(),
          description.trim(),
          today
        ]
      });
    }

    // Insert processed documents
    for (const doc of processedDocuments) {
      await db.execute({
        sql: `INSERT INTO driver_documents (id, driver_id, type, status, url, uploaded_at)
              VALUES (?, ?, ?, ?, ?, ?);`,
        args: [doc.id, driverId, doc.type, doc.status, doc.url, doc.uploadedAt]
      });
    }

    return res.status(200).json({
      success: true,
      driverId,
      driverCode,
      status: 'Pending',
      message: 'Driver registration submitted successfully. Your profile is now under verification review by Admin.',
    });
  } catch (error: any) {
    console.error('[API Register Error]', error);
    return res.status(500).json({
      error: 'Failed to save driver registration. Please try again or contact support at 8500274288.',
      details: error.message,
    });
  }
}
