import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { StorageProvider } from '@prisma/client';

export interface UploadResult {
  url: string;
  storageKey: string;
  provider: StorageProvider;
}

// ==================== LOCAL STORAGE ====================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function uploadLocal(
  buffer: Buffer,
  filename: string,
  folder: string,
): Promise<UploadResult> {
  const uploadDir = path.join(config.storage.localPath, folder);
  ensureDir(uploadDir);

  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  const storageKey = `${folder}/${filename}`;
  const url = `${config.storage.localUrlBase}/${folder}/${filename}`;

  return { url, storageKey, provider: 'LOCAL' };
}

async function deleteLocal(storageKey: string): Promise<void> {
  const filePath = path.join(config.storage.localPath, storageKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ==================== S3 STORAGE ====================

// Dynamically try to load @aws-sdk/client-s3 if available
type S3ClientType = {
  send: (cmd: unknown) => Promise<unknown>;
};
type GetObjectCommandType = new (params: object) => unknown;
type PutObjectCommandType = new (params: object) => unknown;
type DeleteObjectCommandType = new (params: object) => unknown;
type GetObjectCommandInputType = { Bucket: string; Key: string; Expires?: number };

let S3Client: (new (cfg: object) => S3ClientType) | null = null;
let PutObjectCommand: PutObjectCommandType | null = null;
let DeleteObjectCommand: DeleteObjectCommandType | null = null;
let GetObjectCommand: GetObjectCommandType | null = null;
let getSignedUrlFn: ((client: S3ClientType, cmd: unknown, opts: object) => Promise<string>) | null = null;

let s3InitAttempted = false;

function tryInitS3(): boolean {
  if (s3InitAttempted) return S3Client !== null;
  s3InitAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sdk = require('@aws-sdk/client-s3');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const presign = require('@aws-sdk/s3-request-presigner');
    S3Client = sdk.S3Client;
    PutObjectCommand = sdk.PutObjectCommand;
    DeleteObjectCommand = sdk.DeleteObjectCommand;
    GetObjectCommand = sdk.GetObjectCommand;
    getSignedUrlFn = presign.getSignedUrl;
    return true;
  } catch {
    logger.warn('AWS SDK not installed – S3 storage is unavailable, falling back to local.');
    return false;
  }
}

let s3ClientInstance: S3ClientType | null = null;

function getS3Client(): S3ClientType {
  if (s3ClientInstance) return s3ClientInstance;
  if (!S3Client) throw new Error('AWS SDK not available');

  const cfg: Record<string, unknown> = {
    region: config.storage.s3.region,
    credentials: {
      accessKeyId: config.storage.s3.accessKeyId,
      secretAccessKey: config.storage.s3.secretAccessKey,
    },
  };
  if (config.storage.s3.endpoint) {
    cfg.endpoint = config.storage.s3.endpoint;
    cfg.forcePathStyle = true;
  }

  s3ClientInstance = new S3Client(cfg);
  return s3ClientInstance;
}

async function uploadS3(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string,
): Promise<UploadResult> {
  const s3 = getS3Client();
  const storageKey = `${folder}/${filename}`;

  const cmd = new PutObjectCommand!({
    Bucket: config.storage.s3.bucket,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(cmd);

  const url = config.storage.s3.cdnUrl
    ? `${config.storage.s3.cdnUrl}/${storageKey}`
    : `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${storageKey}`;

  return { url, storageKey, provider: 'S3' };
}

async function deleteS3(storageKey: string): Promise<void> {
  const s3 = getS3Client();
  const cmd = new DeleteObjectCommand!({
    Bucket: config.storage.s3.bucket,
    Key: storageKey,
  });
  await s3.send(cmd);
}

// ==================== PUBLIC API ====================

/**
 * Upload a file buffer. Automatically routes to S3 or local based on config.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string = 'uploads',
): Promise<UploadResult> {
  if (config.storage.provider === 's3' && tryInitS3()) {
    return uploadS3(buffer, filename, mimeType, folder);
  }
  return uploadLocal(buffer, filename, folder);
}

/**
 * Delete a file from storage by its storage key and provider.
 */
export async function deleteFile(storageKey: string, provider: StorageProvider): Promise<void> {
  if (provider === 'S3') {
    if (!tryInitS3()) {
      logger.warn('Cannot delete from S3: AWS SDK not installed');
      return;
    }
    await deleteS3(storageKey);
  } else {
    await deleteLocal(storageKey);
  }
}

/**
 * Generate a pre-signed URL for S3 objects (stub if not configured).
 */
export async function getSignedUrl(storageKey: string): Promise<string> {
  if (!tryInitS3() || !getSignedUrlFn || !GetObjectCommand) {
    // Stub: fall back to local URL
    return `${config.storage.localUrlBase}/${storageKey}`;
  }

  const s3 = getS3Client();
  const cmd = new GetObjectCommand({
    Bucket: config.storage.s3.bucket,
    Key: storageKey,
  } as GetObjectCommandInputType);

  return getSignedUrlFn(s3, cmd, { expiresIn: 3600 });
}
