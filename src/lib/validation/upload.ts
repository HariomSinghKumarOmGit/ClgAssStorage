import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { getUploadLimits } from "@/lib/auth/helpers";

// ─── Allowed MIME types ────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
};

export const ALLOWED_MIME_LIST = Object.keys(ALLOWED_MIME_TYPES);

// ─── Upload metadata schema ────────────────────────────────────────────────────

export const uploadMetadataSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description too long"),
  subject: z.string().min(1, "Subject is required").max(100),
  course: z.string().max(100).optional(),
  semester: z.string().max(50).optional(),
  college: z.string().max(200).optional(),
  university: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(10, "Max 10 tags").default([]),
  folderId: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the upload terms" }),
  }),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

// ─── File validation ───────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: { name: string; size: number; type: string },
  role: UserRole
): FileValidationResult {
  const limits = getUploadLimits(role);

  // Check MIME type (server-side — never trust client extension alone)
  if (!ALLOWED_MIME_LIST.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: PDF, DOC, DOCX, PPT, PPTX, TXT`,
    };
  }

  // Check file size
  if (file.size > limits.maxFileSizeBytes) {
    return {
      valid: false,
      error: `File too large. Your limit is ${limits.maxFileSizeMB} MB per file.`,
    };
  }

  // Check empty file
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Sanitize filename — check for path traversal
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  if (safeName !== file.name && file.name.includes("..")) {
    return { valid: false, error: "Invalid filename" };
  }

  return { valid: true };
}

// ─── Upload count validation ───────────────────────────────────────────────────

export function validateUploadCount(
  currentCount: number,
  role: UserRole
): FileValidationResult {
  const limits = getUploadLimits(role);
  if (currentCount >= limits.maxTotalFiles) {
    return {
      valid: false,
      error: `You've reached your upload limit (${limits.maxTotalFiles} files). Contact an admin to upgrade your account.`,
    };
  }
  return { valid: true };
}

// ─── Slug generation ───────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

// ─── SHA-256 hash ──────────────────────────────────────────────────────────────

export async function computeFileHash(buffer: Buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Folder slug ──────────────────────────────────────────────────────────────

export function generateFolderSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36)
  );
}
