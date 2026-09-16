"use server";

import { db } from "@/lib/db";
import { getStorage, generatePublicKey } from "@/lib/storage";
import { requireModerator } from "@/lib/auth/helpers";
import type { RejectionReason } from "@/types";

// ─── Approve Assignment ───────────────────────────────────────────────────────

export interface ModerationResult {
  success: boolean;
  error?: string;
}

export async function approveAssignment(
  assignmentId: string
): Promise<ModerationResult> {
  try {
    const moderator = await requireModerator();

    // Fetch assignment — verify it's still PENDING
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        slug: true,
        status: true,
        storageKey: true,
        fileName: true,
        uploadedById: true,
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }
    if (assignment.status !== "PENDING") {
      return {
        success: false,
        error: `Cannot approve — status is ${assignment.status}`,
      };
    }

    // Generate public storage key
    const publicKey = generatePublicKey(
      assignment.id,
      assignment.slug,
      assignment.fileName
    );

    // Copy from private → public storage BEFORE updating DB
    const storage = getStorage();
    await storage.copy(assignment.storageKey, publicKey);

    console.log(
      `[Moderation] Copied ${assignment.storageKey} → ${publicKey}`
    );

    // Update database record (transaction-safe)
    await db.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "APPROVED",
        storageKey: publicKey, // Now points to public storage
        approvedById: moderator.id,
        approvedAt: new Date(),
        expiresAt: new Date("2099-01-01"), // No longer expires
      },
    });

    // Clean up private file after successful DB update
    try {
      await storage.delete(assignment.storageKey);
    } catch {
      // Non-critical — log but don't fail
      console.warn(
        `[Moderation] Could not delete private file: ${assignment.storageKey}`
      );
    }

    console.log(
      `[Moderation] Approved assignment ${assignmentId} by moderator ${moderator.id}`
    );

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Moderation] Approve error:", error.message);

    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Access denied" };
    }
    return { success: false, error: "Approval failed. Please try again." };
  }
}

// ─── Reject Assignment ────────────────────────────────────────────────────────

export async function rejectAssignment(
  assignmentId: string,
  reason: RejectionReason,
  notes?: string
): Promise<ModerationResult> {
  try {
    const moderator = await requireModerator();

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, status: true, storageKey: true },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }
    if (assignment.status !== "PENDING") {
      return {
        success: false,
        error: `Cannot reject — status is ${assignment.status}`,
      };
    }

    const rejectionReason = notes
      ? `${reason}: ${notes}`
      : reason;

    // Update DB first
    await db.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "REJECTED",
        rejectionReason,
        rejectedById: moderator.id,
        rejectedAt: new Date(),
      },
    });

    // Delete private file (idempotent)
    const storage = getStorage();
    await storage.delete(assignment.storageKey);

    console.log(
      `[Moderation] Rejected assignment ${assignmentId} by moderator ${moderator.id}: ${rejectionReason}`
    );

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Moderation] Reject error:", error.message);

    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Access denied" };
    }
    return { success: false, error: "Rejection failed. Please try again." };
  }
}

// ─── Get Signed Preview URL (moderator only) ──────────────────────────────────

export async function getPreviewUrl(
  assignmentId: string
): Promise<{ url?: string; error?: string }> {
  try {
    await requireModerator();

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { storageKey: true, status: true },
    });

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    const storage = getStorage();
    const url = await storage.getSignedDownloadUrl(assignment.storageKey, 900);

    return { url };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === "FORBIDDEN") {
      return { error: "Access denied" };
    }
    return { error: "Could not generate preview URL" };
  }
}
