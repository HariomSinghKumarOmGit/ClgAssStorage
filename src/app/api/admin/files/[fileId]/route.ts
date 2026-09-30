import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

// DELETE /api/admin/files/[fileId] — Force delete a specific PDF file from storage and database
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const file = await db.classroomFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 1. Delete from Supabase / S3 storage
    const storage = getStorage();
    try {
      await storage.delete(file.storageKey);
    } catch (err) {
      console.warn("[Admin File Delete] Failed to delete from storage:", file.storageKey, err);
    }

    // 2. Delete database record
    await db.classroomFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: `File "${file.fileName}" force deleted successfully.`,
      fileId: file.id,
    });
  } catch (err) {
    console.error("[Admin File Delete]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
