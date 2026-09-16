import { auth } from "@/lib/auth/config";
import type { UserRole } from "@prisma/client";

/**
 * Get the current session — server-side only
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user from session or throw if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}

/**
 * Require the user to be an approved uploader (USER, NURD, MODERATOR, ADMIN)
 */
export async function requireUploadAccess() {
  const user = await requireAuth();
  const canUpload =
    user.isApproved ||
    user.role === "MODERATOR" ||
    user.role === "ADMIN";

  if (!canUpload) {
    throw new Error("UPLOAD_NOT_APPROVED");
  }
  return user;
}

/**
 * Require MODERATOR or ADMIN role
 */
export async function requireModerator() {
  const user = await requireAuth();
  if (user.role !== "MODERATOR" && user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Require ADMIN role
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Check if a role has upload permission
 */
export function canUpload(role: UserRole, isApproved: boolean): boolean {
  return isApproved || role === "MODERATOR" || role === "ADMIN";
}

/**
 * Get upload limits for a given role
 */
export function getUploadLimits(role: UserRole): {
  maxFileSizeBytes: number;
  maxTotalFiles: number;
  maxFileSizeMB: number;
} {
  switch (role) {
    case "NURD":
      return { maxFileSizeBytes: 10 * 1024 * 1024, maxTotalFiles: 30, maxFileSizeMB: 10 };
    case "MODERATOR":
    case "ADMIN":
      return { maxFileSizeBytes: 50 * 1024 * 1024, maxTotalFiles: 999, maxFileSizeMB: 50 };
    default: // USER
      return { maxFileSizeBytes: 5 * 1024 * 1024, maxTotalFiles: 10, maxFileSizeMB: 5 };
  }
}
