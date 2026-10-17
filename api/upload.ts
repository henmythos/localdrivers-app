import { uploadFileBuffer, parseDataUrl } from './_lib/storage';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { dataUrl, folder = 'driver-documents', filename = 'document.jpg' } = body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'Missing dataUrl in request body.' });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid data URL format.' });
    }

    const ext = parsed.contentType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const key = `${folder}/${timestamp}-${random}.${ext}`;

    const result = await uploadFileBuffer(key, parsed.buffer, parsed.contentType);

    return res.status(200).json({
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      uploadedAt: result.uploadedAt,
    });
  } catch (error: any) {
    console.error('[API Upload Error]', error);
    return res.status(500).json({
      error: 'File upload failed.',
      details: error.message,
    });
  }
}
