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

  if (!assignment || assignment.status !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment download count (non-blocking)
  db.assignment.update({
    where: { id: params.id },
    data: { downloadCount: { increment: 1 } },
  }).catch((e) => console.error("[Download] Count increment failed:", e));

  const storage = getStorage();

  // For approved files in public storage, return the public URL directly
  const publicUrl = storage.getPublicUrl(assignment.storageKey);

  console.log(`[Download] Assignment ${params.id} downloaded`);

  return NextResponse.redirect(publicUrl);
}
