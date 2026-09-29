import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const assignment = await db.assignment.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, storageKey: true, fileName: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment download count (non-blocking)
  db.assignment
    .update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } },
    })
    .catch((e) => console.error("[Download] Count increment failed:", e));

  const storage = getStorage();
  try {
    const downloadUrl = await storage.getSignedDownloadUrl(assignment.storageKey);
    return NextResponse.redirect(downloadUrl);
  } catch {
    const publicUrl = storage.getPublicUrl(assignment.storageKey);
    return NextResponse.redirect(publicUrl);
  }
}
