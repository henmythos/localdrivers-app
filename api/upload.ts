import { uploadFileBuffer, parseDataUrl } from './_lib/storage.js';

export default async function handler(req: any, res: any) {
  const reqId = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('x-request-id', reqId);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      requestId: reqId,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { dataUrl, folder = 'driver-documents' } = body;

    if (!dataUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing image data in upload request.',
        requestId: reqId,
      });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format provided.',
        requestId: reqId,
      });
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
      requestId: reqId,
    });
  } catch (error: any) {
    console.error(`[API Upload Error ${reqId}]`, error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process document upload. Please try again.',
      requestId: reqId,
    });
  }
}
