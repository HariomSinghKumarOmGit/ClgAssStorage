"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireSeniorModerator } from "@/lib/auth/helpers";
import { generateFolderSlug } from "@/lib/validation/upload";

export interface FolderResult {
  success: boolean;
  folderId?: string;
  error?: string;
}

export async function createFolder(
  name: string,
  parentId?: string,
  description?: string
): Promise<FolderResult> {
  try {
    // SENIOR_MODERATOR and ADMIN can create folders
    const user = await requireSeniorModerator();

    if (!name?.trim() || name.length < 2) {
      return { success: false, error: "Folder name must be at least 2 characters" };
    }

    const slug = generateFolderSlug(name);

    const folder = await db.folder.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        parentId: parentId || null,
        createdById: user.id,
      },
    });

    console.log(`[Folder] Created folder "${name}" (${folder.id}) by ${user.role} ${user.id}`);

    return { success: true, folderId: folder.id };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Folder] Create error:", error.message);
    if (error.message === "FORBIDDEN") return { success: false, error: "Access denied — requires Senior Moderator or Admin" };
    return { success: false, error: "Failed to create folder" };
  }
}

export async function renameFolder(
  folderId: string,
  newName: string
): Promise<FolderResult> {
  try {
    await requireSeniorModerator();

    await db.folder.update({
      where: { id: folderId },
      data: { name: newName.trim() },
    });

    return { success: true, folderId };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === "FORBIDDEN") return { success: false, error: "Access denied — requires Senior Moderator or Admin" };
    return { success: false, error: "Failed to rename folder" };
  }
}

export async function deleteFolder(folderId: string): Promise<FolderResult> {
  try {
    await requireAdmin();

    // Check if folder has assignments
    const assignmentCount = await db.assignment.count({
      where: { folderId },
    });

    if (assignmentCount > 0) {
      return {
        success: false,
        error: `Cannot delete folder with ${assignmentCount} assignment(s). Move or delete them first.`,
      };
    }

    // Check for subfolders
    const subfolderCount = await db.folder.count({
      where: { parentId: folderId },
    });

    if (subfolderCount > 0) {
      return {
        success: false,
        error: "Cannot delete folder with subfolders. Delete subfolders first.",
      };
    }

    await db.folder.delete({ where: { id: folderId } });

    console.log(`[Folder] Deleted folder ${folderId}`);

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to delete folder" };
  }
}

export async function getFolderTree() {
  const folders = await db.folder.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { assignments: true } },
    },
  });

  // Build tree structure
  type FolderNode = (typeof folders)[0] & { children: FolderNode[] };
  const map = new Map<string, FolderNode>();
  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));

  const roots: FolderNode[] = [];
  map.forEach((folder) => {
    if (folder.parentId) {
      const parent = map.get(folder.parentId);
      if (parent) parent.children.push(folder);
    } else {
      roots.push(folder);
    }
  });

  return roots;
}
