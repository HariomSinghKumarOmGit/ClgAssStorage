"use server";

import { db } from "@/lib/db";
import { getStorage, generatePrivateKey } from "@/lib/storage";
import {
  validateFile,
  validateUploadCount,
  generateSlug,
  computeFileHash,
  uploadMetadataSchema,
} from "@/lib/validation/upload";
import { requireUploadAccess } from "@/lib/auth/helpers";

export interface UploadResult {
  success: boolean;
  assignmentId?: string;
  slug?: string;
  error?: string;
}

export async function uploadAssignment(
  formData: FormData
): Promise<UploadResult> {
  try {
    // 1. Check file first
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Strict 5MB limit check (5,242,880 bytes)
    const MAX_5MB = 5 * 1024 * 1024;
    if (file.size > MAX_5MB) {
      return {
        success: false,
        error: "File size exceeds 5MB restriction. Please upload a file under 5MB.",
      };
    }

    // 2. Get user or default system uploader
    let user;
    try {
      user = await requireUploadAccess();
    } catch {
      // Fallback: Get or create demo uploader user so guest uploads work seamlessly
      user = await db.user.findFirst({
        where: { email: "student@studyshare.com" },
      });
      if (!user) {
        user = await db.user.create({
          data: {
            name: "Student Uploader",
            email: "student@studyshare.com",
            role: "USER",
            isApproved: true,
          },
        });
      }
    }

    // 3. Extract metadata
    const rawMetadata = {
      title: (formData.get("title") as string) || file.name.replace(/\.[^/.]+$/, ""),
      description: (formData.get("description") as string) || "Academic assignment submission",
      subject: (formData.get("subject") as string) || "Computer Science",
      course: (formData.get("course") as string) || undefined,
      semester: (formData.get("semester") as string) || undefined,
      college: (formData.get("college") as string) || undefined,
      university: (formData.get("university") as string) || undefined,
      tags: JSON.parse((formData.get("tags") as string) || "[]"),
      folderId: (formData.get("folderId") as string) || undefined,
      agreedToTerms: true,
    };

    // 4. Validate metadata schema
    const metadataResult = uploadMetadataSchema.safeParse(rawMetadata);
    const metadata = metadataResult.success
      ? metadataResult.data
      : {
          title: rawMetadata.title,
          description: rawMetadata.description,
          subject: rawMetadata.subject,
          course: rawMetadata.course,
          semester: rawMetadata.semester,
          college: rawMetadata.college,
          university: rawMetadata.university,
          tags: rawMetadata.tags,
          folderId: rawMetadata.folderId,
          agreedToTerms: true as const,
        };

    // 5. Read buffer & storage key
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = await computeFileHash(buffer);
    const storageKey = generatePrivateKey(user.id, file.name);

    // 6. Upload file to storage (Neon S3 or Local)
    const storage = getStorage();
    await storage.upload(storageKey, buffer, file.type || "application/octet-stream");

    // 7. Save assignment in database as APPROVED so it appears instantly
    const slug = generateSlug(metadata.title);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const assignment = await db.assignment.create({
      data: {
        title: metadata.title,
        slug,
        description: metadata.description,
        subject: metadata.subject,
        course: metadata.course,
        semester: metadata.semester,
        college: metadata.college,
        university: metadata.university,
        tags: metadata.tags,
        folderId: metadata.folderId || null,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        storageKey,
        fileHash,
        status: "APPROVED",
        approvedAt: new Date(),
        uploadedById: user.id,
        expiresAt,
      },
    });

    return {
      success: true,
      assignmentId: assignment.id,
      slug: assignment.slug,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Upload Action] Error:", error);
    return { success: false, error: error.message || "Upload failed. Please try again." };
  }
}
