import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Abstract Storage Interface ───────────────────────────────────────────────

export interface StorageProvider {
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  copy(sourceKey: string, destKey: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

// ─── Universal S3 (Neon / R2 / AWS) Implementation ───────────────────────────

class UniversalS3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    const accountId = process.env.STORAGE_ACCOUNT_ID;
    
    this.bucket = process.env.STORAGE_BUCKET || "asssubmit";

    if (endpoint) {
      // Neon Object Storage
      this.client = new S3Client({
        region: process.env.AWS_REGION || "us-east-2",
        endpoint: endpoint,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });
      this.publicUrl = process.env.STORAGE_PUBLIC_URL || `${endpoint}/${this.bucket}`;
    } else if (accountId) {
      // Cloudflare R2
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
          secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
        },
      });
      this.publicUrl = process.env.STORAGE_PUBLIC_URL || "";
    } else {
      throw new Error("No S3 configuration found");
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (err: unknown) {
      const error = err as { name?: string; Code?: string };
      if (error?.name === "NoSuchKey" || error?.Code === "NoSuchKey") {
        return;
      }
      throw err;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      })
    );
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 900
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string): string {
    return `/api/download/file?key=${encodeURIComponent(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Local Storage Fallback ───────────────────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(key: string, body: Buffer): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, body);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const src = path.join(this.baseDir, sourceKey);
    const dest = path.join(this.baseDir, destKey);
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(src)) {
      await fs.promises.copyFile(src, dest);
    }
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  getPublicUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    return fs.existsSync(filePath);
  }
}

// ─── Storage key helpers ──────────────────────────────────────────────────────

export function generatePrivateKey(
  userId: string,
  originalFilename: string
): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "bin";
  const randomId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  return `private/${userId}/${timestamp}-${randomId}.${ext}`;
}

export function generatePublicKey(
  assignmentId: string,
  slug: string,
  originalFilename: string
): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "bin";
  return `public/${slug}/${assignmentId}.${ext}`;
}

// ─── Singleton storage instance ───────────────────────────────────────────────

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    if (process.env.AWS_ENDPOINT_URL_S3 || process.env.STORAGE_ACCOUNT_ID) {
      try {
        storageInstance = new UniversalS3StorageProvider();
      } catch (e) {
        console.warn("[Storage] S3 initialization failed, falling back to local storage:", e);
        storageInstance = new LocalStorageProvider();
      }
    } else {
      storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

