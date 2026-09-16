import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { assignmentId, reason, details } = await req.json() as {
      assignmentId: string;
      reason: string;
      details?: string;
    };

    if (!assignmentId || !reason) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const session = await auth();

    // Verify the assignment exists and is approved (only approved can be reported publicly)
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId, status: "APPROVED" },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    await db.report.create({
      data: {
        assignmentId,
        reportedById: session?.user?.id ?? null,
        reason: reason.slice(0, 100),
        details: details?.slice(0, 1000),
        status: "OPEN",
      },
    });

    console.log(`[Report] Assignment ${assignmentId} reported: ${reason}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Report] Error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
