import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let s3Client: S3Client | null = null;

export function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID?.trim() || '3b25d6fc00d328f896be8a3382324774',
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || process.env.R2_TOKEN_ID?.trim() || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || '',
    bucketName: process.env.R2_BUCKET_NAME?.trim() || 'localdrivers',
    publicUrl: process.env.VITE_R2_PUBLIC_URL?.trim() || process.env.R2_PUBLIC_DEV_URL?.trim() || 'https://pub-e6716545434140d796808e125fc8dc7d.r2.dev',
  };
}

export function isR2Configured(): boolean {
  const cfg = getR2Config();
  return !!(cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucketName);
}

function getS3Client(): S3Client {
  if (!s3Client) {
    const cfg = getR2Config();
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return s3Client;
}

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  uploadedAt: string;
}

/**
 * Uploads a file buffer or base64 data string to Cloudflare R2 or local storage.
 */
export async function uploadFileBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const cfg = getR2Config();
  const uploadedAt = new Date().toISOString();

  if (isR2Configured()) {
    try {
      const client = getS3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      const url = `${cfg.publicUrl}/${key}`;
      return { url, key, bucket: cfg.bucketName, uploadedAt };
    } catch (r2Err: any) {
      console.warn(`[R2 Storage] Direct R2 upload warning: ${r2Err.message}. Falling back to local storage.`);
    }
  }

  // Fallback: save to storage directory or return data URL
  const isVercel = !!process.env.VERCEL;
  const storageDir = isVercel ? path.join('/tmp', '.storage') : path.join(process.cwd(), '.storage');
  const filePath = path.join(storageDir, key);
  const dir = path.dirname(filePath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
  } catch (fsErr: any) {
    console.warn(`[Storage] Could not write file to disk: ${fsErr.message}`);
  }

  // For instant display, return a data URI if small enough (< 2MB), or public dev URL reference
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${contentType};base64,${base64}`;

  return {
    url: dataUrl,
    key,
    bucket: cfg.bucketName,
    uploadedAt,
  };
}

/**
 * Parses a DataURL (e.g. data:image/jpeg;base64,...) into Buffer and mimeType.
 */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return {
    contentType: matches[1],
    buffer: Buffer.from(matches[2], 'base64'),
  };
}
