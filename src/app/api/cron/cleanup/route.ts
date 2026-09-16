import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

// This route is called by Vercel Cron daily at 2 AM UTC
// Protected by CRON_SECRET environment variable

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    console.warn("[Cron] Unauthorized cleanup attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Starting cleanup job...");

  const now = new Date();
  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  // Find expired pending assignments
  const expiredAssignments = await db.assignment.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
    },
    select: { id: true, storageKey: true, title: true },
  });

  console.log(`[Cron] Found ${expiredAssignments.length} expired assignments`);

  const storage = getStorage();

  for (const assignment of expiredAssignments) {
    try {
      // Delete from storage (idempotent — handles missing files)
      await storage.delete(assignment.storageKey);
      console.log(`[Cron] Deleted storage: ${assignment.storageKey}`);

      // Mark as EXPIRED in DB
      await db.assignment.update({
        where: { id: assignment.id },
        data: { status: "EXPIRED" },
      });

      deleted++;
    } catch (err) {
      console.error(`[Cron] Failed to process ${assignment.id}:`, err);
      failed++;
    }
  }

  // Also clean up REJECTED assignments' files if any slipped through
  // (Belt-and-suspenders cleanup)
  const rejectedWithFiles = await db.assignment.findMany({
    where: {
      status: "REJECTED",
      storageKey: { startsWith: "private/" },
    },
    select: { id: true, storageKey: true },
  });

  for (const assignment of rejectedWithFiles) {
    try {
      await storage.delete(assignment.storageKey);
      skipped++;
    } catch {
      // Non-critical
    }
  }

  const result = {
    success: true,
    processed: expiredAssignments.length,
    deleted,
    failed,
    orphansCleaned: skipped,
    timestamp: now.toISOString(),
  };

  console.log("[Cron] Cleanup complete:", result);

  return NextResponse.json(result);
}
