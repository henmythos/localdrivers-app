/**
 * Cloudflare R2 Storage Service Abstraction
 * 
 * In production:
 * - Client requests a presigned PUT URL from a Vercel Serverless Function (/api/upload/presign).
 * - Client uploads file directly to R2 bucket via presigned URL.
 * - Public CDN URL (https://cdn.localdrivers.in/...) is returned & stored in database.
 */

export interface StorageUploadResult {
  url: string;
  key: string;
  bucket: string;
  uploadedAt: string;
}

export const storageService = {
  // Simulated R2 document/photo upload for demo mode
  async uploadFile(
    file: File | Blob, 
    folder: 'driver-photos' | 'driver-documents' | 'verification'
  ): Promise<StorageUploadResult> {
    // Artificial delay to simulate real cloud storage network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const fileExtension = file.type.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // For demo mode, create an object URL or return realistic unsplash/placeholder CDN URL
    let demoUrl = '';
    if (file instanceof File && file.type.startsWith('image/')) {
      demoUrl = URL.createObjectURL(file);
    } else {
      demoUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400';
    }

    return {
      url: demoUrl,
      key,
      bucket: process.env.R2_BUCKET_NAME || 'localdrivers-media-prod',
      uploadedAt: new Date().toISOString(),
    };
  },

  // Generates placeholder R2 URL for documentation
  getStorageUrl(key: string): string {
    return `https://r2.localdrivers.in/${key}`;
  }
};
