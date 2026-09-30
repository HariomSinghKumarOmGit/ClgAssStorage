import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/classrooms/[id]/categories — public, fetches categories for a classroom
// Optional query: ?type=lab or ?type=assignment to filter
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get("type");

    const where: { classroomId: string; type?: string } = { classroomId: id };
    if (typeFilter === "lab" || typeFilter === "assignment") {
      where.type = typeFilter;
    }

    const categories = await db.category.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, classroomId: true },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[Public categories API]", err);
    return NextResponse.json({ categories: [] });
  }
}
