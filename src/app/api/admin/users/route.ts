import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

type Action = "approve_request" | "reject_request" | "approve_upload" | "revoke_upload" | "set_role";

interface RequestBody {
  action: Action;
  userId: string;
  requestId?: string;
  role?: UserRole;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    }

    const body = await req.json() as RequestBody;
    const { action, userId, requestId, role } = body;

    switch (action) {
      case "approve_request": {
        if (!requestId) return NextResponse.json({ success: false, error: "requestId required" });
        // Mark request approved + give user upload access
        await db.$transaction([
          db.accessRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED", reviewedAt: new Date() },
          }),
          db.user.update({
            where: { id: userId },
            data: { isApproved: true },
          }),
        ]);
        console.log(`[Admin] Approved upload access for user ${userId}`);
        break;
      }

      case "reject_request": {
        if (!requestId) return NextResponse.json({ success: false, error: "requestId required" });
        await db.accessRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED", reviewedAt: new Date() },
        });
        break;
      }

      case "approve_upload": {
        await db.user.update({ where: { id: userId }, data: { isApproved: true } });
        break;
      }

      case "revoke_upload": {
        await db.user.update({ where: { id: userId }, data: { isApproved: false } });
        break;
      }

      case "set_role": {
        if (!role || !["USER", "NURD", "MODERATOR", "SENIOR_MODERATOR", "ADMIN"].includes(role)) {
          return NextResponse.json({ success: false, error: "Invalid role" });
        }
        // When upgrading to NURD or higher uploader roles, also approve upload access.
        // MODERATOR and SENIOR_MODERATOR are NOT uploaders — don't auto-approve.
        const shouldApprove = role === "NURD" || role === "ADMIN";
        await db.user.update({
          where: { id: userId },
          data: {
            role,
            ...(shouldApprove ? { isApproved: true } : {}),
            // Revoke upload access for mod roles (they don't upload)
            ...(role === "MODERATOR" || role === "SENIOR_MODERATOR" ? { isApproved: false } : {}),
          },
        });
        console.log(`[Admin] Set user ${userId} role to ${role}`);
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminUsers] Error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
