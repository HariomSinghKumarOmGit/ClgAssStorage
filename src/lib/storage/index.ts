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

// ─── Local Storage Fallback ───────────────────────────────────────────────────

export class LocalStorageProvider implements StorageProvider {
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

// ─── Universal S3 (Neon / R2 / AWS) Implementation ───────────────────────────

class UniversalS3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;
  private localStorage: LocalStorageProvider;

  constructor() {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    const accountId = process.env.STORAGE_ACCOUNT_ID;
    this.localStorage = new LocalStorageProvider();
    this.bucket = process.env.STORAGE_BUCKET || "asssubmit";

    if (endpoint) {
      // Neon Object Storage requires path-style addressing
      this.client = new S3Client({
        region: process.env.AWS_REGION || "us-east-2",
        endpoint: endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });
      this.publicUrl = process.env.STORAGE_PUBLIC_URL || `${endpoint.replace(/\/$/, "")}/${this.bucket}`;
    } else if (accountId && process.env.STORAGE_ACCESS_KEY) {
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
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    } catch (err) {
      console.warn("[Storage] Remote S3 upload error, falling back to local file storage:", err);
      await this.localStorage.upload(key, body);
    }
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
      await this.localStorage.delete(key);
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destKey,
        })
      );
    } catch (err) {
      console.warn("[Storage] Remote copy failed, using local fallback:", err);
      await this.localStorage.copy(sourceKey, destKey);
    }
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 900
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.warn("[Storage] S3 presign failed, falling back to local:", err);
      return `/uploads/${key}`;
    }
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
    }
    return `/uploads/${key}`;
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
      return this.localStorage.exists(key);
    }
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

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Supabase Storage Provider ────────────────────────────────────────────────

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    this.bucket = process.env.STORAGE_BUCKET || "assignments";

    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY/SERVICE_ROLE_KEY");
    }

    this.client = createClient(url, key);
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, body, {
        contentType,
        upsert: true,
      });
    if (error) {
      console.warn("[Storage] Supabase upload failed, falling back to local:", error);
      const localStorage = new LocalStorageProvider();
      await localStorage.upload(key, body);
    }
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      console.warn("[Storage] Supabase delete error:", error);
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .copy(sourceKey, destKey);
    if (error) {
      console.warn("[Storage] Supabase copy error:", error);
    }
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 900
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresInSeconds);
    if (error || !data?.signedUrl) {
      return this.getPublicUrl(key);
    }
    return data.signedUrl;
  }

  getPublicUrl(key: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async exists(key: string): Promise<boolean> {
    const lastSlash = key.lastIndexOf("/");
    const dir = lastSlash > -1 ? key.substring(0, lastSlash) : "";
    const fileName = lastSlash > -1 ? key.substring(lastSlash + 1) : key;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(dir, { search: fileName });
    if (error || !data) return false;
    return data.some((file) => file.name === fileName);
  }
}

// ─── Singleton storage instance ───────────────────────────────────────────────

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        storageInstance = new SupabaseStorageProvider();
        console.log("[Storage] Using Supabase Storage Provider");
      } catch (e) {
        console.warn("[Storage] Supabase init failed, checking S3:", e);
      }
    }

    if (!storageInstance) {
      if (
        (process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID) ||
        (process.env.STORAGE_ACCOUNT_ID && process.env.STORAGE_ACCESS_KEY)
      ) {
        try {
          storageInstance = new UniversalS3StorageProvider();
          console.log("[Storage] Using S3 Storage Provider");
        } catch (e) {
          console.warn("[Storage] S3 initialization failed, falling back to local storage:", e);
          storageInstance = new LocalStorageProvider();
        }
      } else {
        storageInstance = new LocalStorageProvider();
      }
    }
  }
  return storageInstance;
}

