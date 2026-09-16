import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;

    // Only signed-in users can request
    const body = await req.json() as { reason?: string };

    // Check for existing request
    const existing = await db.accessRequest.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json({ success: false, error: "You already have upload access." });
      }
      if (existing.status === "PENDING") {
        return NextResponse.json({ success: false, error: "Your request is already pending review." });
      }
      // REJECTED — allow re-request by updating
      await db.accessRequest.update({
        where: { userId: user.id },
        data: { status: "PENDING", reason: body.reason?.trim() || null, reviewedAt: null },
      });
    } else {
      await db.accessRequest.create({
        data: {
          userId: user.id,
          reason: body.reason?.trim() || null,
          status: "PENDING",
        },
      });
    }

    console.log(`[AccessRequest] User ${user.id} (${user.email}) requested upload access`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AccessRequest] Error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
