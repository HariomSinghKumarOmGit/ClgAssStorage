import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/assignments/[id] — Force delete a specific assignment submission
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Delete reports first if any
    await db.report.deleteMany({
      where: { assignmentId: id },
    });

    // Delete from Supabase / S3 storage
    const storage = getStorage();
    try {
      await storage.delete(assignment.storageKey);
    } catch (err) {
      console.warn("[Admin Assignment Delete] Failed to delete storage key:", assignment.storageKey, err);
    }

    // Delete assignment from DB
    await db.assignment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Assignment "${assignment.title}" deleted.`,
    });
  } catch (err) {
    console.error("[Admin Assignment Delete]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
