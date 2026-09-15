import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../../config/env';

export interface ObjectStorageService {
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

// note: Cloudinary authenticated assets when CLOUDINARY_* is set; otherwise local HMAC signed URLs.

export function assertSafeStorageKey(key: string): string {
  if (
    !key ||
    key.includes('..') ||
    key.includes('\0') ||
    path.isAbsolute(key) ||
    key.startsWith('/')
  ) {
    throw new Error('Invalid storage key');
  }
  return key;
}

export function signStorageAccess(key: string, expiresAtUnix: number, secret: string): string {
  return createHmac('sha256', secret).update(`${key}:${expiresAtUnix}`).digest('base64url');
}

export function isValidStorageSignature(
  key: string,
  expiresAtUnix: number,
  signature: string,
  secret: string,
  nowUnix = Math.floor(Date.now() / 1000),
): boolean {
  if (!Number.isFinite(expiresAtUnix) || expiresAtUnix < nowUnix) {
    return false;
  }
  const expected = signStorageAccess(key, expiresAtUnix, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export class LocalObjectStorage implements ObjectStorageService {
  constructor(
    private readonly rootDir: string,
    private readonly publicUrl: string,
    private readonly secret: string,
  ) {}

  async upload(key: string, body: Buffer, _contentType: string): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async delete(key: string): Promise<void> {
    const full = this.resolve(key);
    try {
      await unlink(full);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    assertSafeStorageKey(key);
    const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = signStorageAccess(key, expiresAtUnix, this.secret);
    const url = new URL('/api/v1/media/files', this.publicUrl);
    url.searchParams.set('k', key);
    url.searchParams.set('e', String(expiresAtUnix));
    url.searchParams.set('s', signature);
    return url.toString();
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async clear(): Promise<void> {
    await rm(this.rootDir, { recursive: true, force: true });
  }

  private resolve(key: string): string {
    const safe = assertSafeStorageKey(key);
    const root = path.resolve(this.rootDir);
    const full = path.resolve(root, safe);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error('Invalid storage key');
    }
    return full;
  }
}

export function toCloudinaryPublicId(key: string): string {
  return assertSafeStorageKey(key).replace(/\.[^.]+$/, '');
}

export class CloudinaryObjectStorage implements ObjectStorageService {
  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async upload(key: string, body: Buffer, _contentType: string): Promise<void> {
    const publicId = toCloudinaryPublicId(key);
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          type: 'authenticated',
          overwrite: true,
          unique_filename: false,
          invalidate: true,
        },
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
      stream.end(body);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(toCloudinaryPublicId(key), {
      resource_type: 'image',
      type: 'authenticated',
      invalidate: true,
    });
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + Math.max(1, expiresInSeconds);
    return cloudinary.url(toCloudinaryPublicId(key), {
      resource_type: 'image',
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      format: 'jpg',
    });
  }
}

function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

let storage: ObjectStorageService | undefined;

export function getObjectStorage(): ObjectStorageService {
  storage ??= isCloudinaryConfigured()
    ? new CloudinaryObjectStorage(
        env.cloudinaryCloudName,
        env.cloudinaryApiKey,
        env.cloudinaryApiSecret,
      )
    : new LocalObjectStorage(
        env.mediaStorageDir,
        env.apiPublicUrl,
        env.storageSecret || env.jwtAccessSecret,
      );
  return storage;
}

export function requireLocalObjectStorage(): LocalObjectStorage {
  const current = getObjectStorage();
  if (!(current instanceof LocalObjectStorage)) {
    throw new Error('Local object storage is required');
  }
  return current;
}

export function resetObjectStorage(): void {
  storage = undefined;
}
