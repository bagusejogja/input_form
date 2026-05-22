import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicDomain = process.env.R2_PUBLIC_DOMAIN;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export interface R2UploadResult {
  name: string;
  size: number;
  url: string;
  source: 'cloudflare_r2';
}

export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<R2UploadResult> {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Cloudflare R2 credentials are not fully configured in .env.local');
  }

  // Gunakan nama file yang sudah diformat dari route.ts
  const uniqueFileName = fileName;
  
  // Folder sesuai permintaan: "revisi terjadwal/2026_II/"
  const fileKey = `revisi terjadwal/2026_II/${uniqueFileName}`;

  console.log(`📤 Mengunggah "${fileName}" ke Cloudflare R2 pada folder "${fileKey}"...`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return {
    name: fileName,
    size: fileSize,
    url: `${publicDomain}/${fileKey}`,
    source: 'cloudflare_r2',
  };
}
