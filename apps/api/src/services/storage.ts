/**
 * Abstract file storage layer.
 * Dev: local disk under STORAGE_LOCAL_PATH.
 * Production-ready interface for S3 / R2 (driver = 's3' — implement when needed).
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface StoredObject {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface StorageDriver {
  save(params: {
    tenantId: string;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
  }): Promise<StoredObject>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

class LocalStorageDriver implements StorageDriver {
  private root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }

  async save(params: {
    tenantId: string;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
  }): Promise<StoredObject> {
    const safeName = sanitizeFileName(params.fileName);
    const folder = params.folder || 'content';
    const key = path.posix.join(params.tenantId, folder, `${randomUUID()}-${safeName}`);
    const fullPath = path.join(this.root, key);
    await this.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, params.buffer);
    return {
      key,
      url: this.getPublicUrl(key),
      fileName: safeName,
      mimeType: params.mimeType,
      fileSize: params.buffer.length,
    };
  }

  getPublicUrl(key: string): string {
    const base = env.STORAGE_PUBLIC_BASE_URL || '/uploads';
    return `${base.replace(/\/$/, '')}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.root, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.root, key));
      return true;
    } catch {
      return false;
    }
  }
}

/** Placeholder for S3/R2 — throws until credentials + SDK are wired */
class S3StorageDriver implements StorageDriver {
  async save(): Promise<StoredObject> {
    throw new AppError(
      501,
      'S3 storage driver not configured. Set STORAGE_DRIVER=local or implement S3.',
      'NOT_IMPLEMENTED'
    );
  }
  getPublicUrl(key: string): string {
    return key;
  }
  async delete(): Promise<void> {
    throw new AppError(501, 'S3 storage driver not configured', 'NOT_IMPLEMENTED');
  }
  async exists(): Promise<boolean> {
    return false;
  }
}

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (!driver) {
    if (env.STORAGE_DRIVER === 's3') {
      driver = new S3StorageDriver();
    } else {
      driver = new LocalStorageDriver(env.STORAGE_LOCAL_PATH);
    }
  }
  return driver;
}

export async function saveUploadedFile(params: {
  tenantId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}): Promise<StoredObject> {
  const maxBytes = 50 * 1024 * 1024; // 50MB MVP limit
  if (params.buffer.length > maxBytes) {
    throw new AppError(413, 'File too large (max 50MB)', 'PAYLOAD_TOO_LARGE');
  }
  return getStorage().save(params);
}
