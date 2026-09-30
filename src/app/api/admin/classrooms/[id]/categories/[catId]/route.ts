import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string; catId: string }>;
}

// PATCH /api/admin/classrooms/[id]/categories/[catId] — rename category
export async function PATCH(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { catId } = await params;
  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await db.category.update({
    where: { id: catId },
    data: { name: name.trim() },
    include: { _count: { select: { files: true } } },
  });

  return NextResponse.json({ category });
}

// DELETE /api/admin/classrooms/[id]/categories/[catId]
// Query param: ?force=true to also delete associated files
export async function DELETE(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { catId } = await params;
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  // Check for associated files
  const files = await db.classroomFile.findMany({
    where: { categoryId: catId },
    select: { id: true, storageKey: true },
  });

  if (files.length > 0 && !force) {
    return NextResponse.json(
      {
        error: `This category has ${files.length} uploaded file(s). Pass ?force=true to delete the category and all its files.`,
        fileCount: files.length,
        requiresForce: true,
      },
      { status: 409 }
    );
  }

  // If force=true, delete files from storage and DB
  if (files.length > 0 && force) {
    const storage = getStorage();
    for (const file of files) {
      try {
        await storage.delete(file.storageKey);
      } catch (err) {
        console.warn("[Category Delete] Could not delete file from storage:", file.storageKey, err);
      }
    }
    await db.classroomFile.deleteMany({ where: { categoryId: catId } });
  }

  await db.category.delete({ where: { id: catId } });
  return NextResponse.json({ success: true, deletedFiles: files.length });
}
