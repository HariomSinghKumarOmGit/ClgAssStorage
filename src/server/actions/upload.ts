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
    // 1. Authenticate + check upload access
    const user = await requireUploadAccess();

    // 2. Extract form data
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const rawMetadata = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      subject: formData.get("subject") as string,
      course: (formData.get("course") as string) || undefined,
      semester: (formData.get("semester") as string) || undefined,
      college: (formData.get("college") as string) || undefined,
      university: (formData.get("university") as string) || undefined,
      tags: JSON.parse((formData.get("tags") as string) || "[]"),
      folderId: (formData.get("folderId") as string) || undefined,
      agreedToTerms: formData.get("agreedToTerms") === "true",
    };

    // 3. Validate metadata
    const metadataResult = uploadMetadataSchema.safeParse(rawMetadata);
    if (!metadataResult.success) {
      const firstError = metadataResult.error.errors[0];
      return { success: false, error: firstError.message };
    }
    const metadata = metadataResult.data;

    // 4. Validate file (server-side MIME + size)
    const fileValidation = validateFile(
      { name: file.name, size: file.size, type: file.type },
      user.role
    );
    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }

    // 5. Check upload count limit
    const existingCount = await db.assignment.count({
      where: {
        uploadedById: user.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    const countValidation = validateUploadCount(existingCount, user.role);
    if (!countValidation.valid) {
      return { success: false, error: countValidation.error };
    }

    // 6. Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 7. Compute SHA-256 for duplicate detection
    const fileHash = await computeFileHash(buffer);

    // 8. Check for exact duplicate (same hash, same uploader)
    const existingDuplicate = await db.assignment.findFirst({
      where: { fileHash, uploadedById: user.id, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (existingDuplicate) {
      return {
        success: false,
        error: "You have already uploaded this exact file.",
      };
    }

    // 9. Generate safe storage key (never use raw filename)
    const storageKey = generatePrivateKey(user.id, file.name);

    // 10. Upload to private storage
    const storage = getStorage();
    await storage.upload(storageKey, buffer, file.type);

    console.log(`[Upload] User ${user.id} uploaded file to ${storageKey}`);

    // 11. Create database record
    const slug = generateSlug(metadata.title);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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
        fileType: file.type,
        storageKey,
        fileHash,
        status: "PENDING",
        uploadedById: user.id,
        expiresAt,
      },
    });

    console.log(`[Upload] Assignment created: ${assignment.id} by user ${user.id}`);

    return {
      success: true,
      assignmentId: assignment.id,
      slug: assignment.slug,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Upload] Error:", error.message);

    if (error.message === "UNAUTHENTICATED") {
      return { success: false, error: "Please sign in to upload" };
    }
    if (error.message === "UPLOAD_NOT_APPROVED") {
      return {
        success: false,
        error: "Your account hasn't been approved for uploads yet. Request access first.",
      };
    }

    return { success: false, error: "Upload failed. Please try again." };
  }
}
