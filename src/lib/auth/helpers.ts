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
 * Require the user to be an approved uploader (USER, NURD, ADMIN)
 * MODERATOR and SENIOR_MODERATOR are NOT uploaders by default
 */
export async function requireUploadAccess() {
  const user = await requireAuth();
  const canUpload = user.isApproved || user.role === "ADMIN";
  if (!canUpload) {
    throw new Error("UPLOAD_NOT_APPROVED");
  }
  return user;
}

/**
 * Require MODERATOR, SENIOR_MODERATOR, or ADMIN role
 * These can approve/reject assignments
 */
export async function requireModerator() {
  const user = await requireAuth();
  const isMod =
    user.role === "MODERATOR" ||
    user.role === "SENIOR_MODERATOR" ||
    user.role === "ADMIN";

  if (!isMod) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Require SENIOR_MODERATOR or ADMIN — needed to create folders
 */
export async function requireSeniorModerator() {
  const user = await requireAuth();
  const isSenior =
    user.role === "SENIOR_MODERATOR" || user.role === "ADMIN";

  if (!isSenior) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Require ADMIN role — needed for destructive operations
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

export function canUpload(role: UserRole, isApproved: boolean): boolean {
  return isApproved || role === "ADMIN";
}

export function canModerate(role: UserRole): boolean {
  return (
    role === "MODERATOR" ||
    role === "SENIOR_MODERATOR" ||
    role === "ADMIN"
  );
}

export function canCreateFolders(role: UserRole): boolean {
  return role === "SENIOR_MODERATOR" || role === "ADMIN";
}

export function canDeleteFolders(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canDeleteFiles(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Get upload limits for a given role.
 * MODERATOR / SENIOR_MODERATOR don't get upload limits (they don't upload).
 */
export function getUploadLimits(_role?: UserRole): {
  maxFileSizeBytes: number;
  maxTotalFiles: number;
  maxFileSizeMB: number;
} {
  return {
    maxFileSizeBytes: 5 * 1024 * 1024, // Strict 5MB limit
    maxTotalFiles: 100,
    maxFileSizeMB: 5,
  };
}

/**
 * Get accessible admin navigation items based on role
 */
export function getAdminNavItems(role: UserRole): {
  queue: boolean;
  folders: boolean;
  users: boolean;
} {
  return {
    queue: canModerate(role),
    folders: canCreateFolders(role),
    users: canManageUsers(role),
  };
}
