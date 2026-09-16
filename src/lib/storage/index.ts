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

// ─── Cloudflare R2 Implementation ────────────────────────────────────────────

class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.STORAGE_ACCOUNT_ID!;
    this.bucket = process.env.STORAGE_BUCKET!;
    this.publicUrl = process.env.STORAGE_PUBLIC_URL!;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
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
      // If the file doesn't exist, treat as success (idempotent)
      const error = err as { name?: string; Code?: string };
      if (error?.name === "NoSuchKey" || error?.Code === "NoSuchKey") {
        console.warn(`[Storage] File not found during delete: ${key}`);
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
    expiresInSeconds = 900 // 15 minutes
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
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

// ─── Storage key helpers ──────────────────────────────────────────────────────

/**
 * Generate a safe, unpredictable private storage key.
 * Format: private/{userId}/{timestamp}-{randomId}.{ext}
 */
export function generatePrivateKey(
  userId: string,
  originalFilename: string
): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "bin";
  const randomId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  return `private/${userId}/${timestamp}-${randomId}.${ext}`;
}

/**
 * Generate a public storage key for approved assignments.
 * Format: public/{slug}/{assignmentId}.{ext}
 */
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
    storageInstance = new R2StorageProvider();
  }
  return storageInstance;
}
