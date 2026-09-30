import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/classrooms/[id]/categories — list categories for classroom
export async function GET(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const categories = await db.category.findMany({
    where: { classroomId: id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { _count: { select: { files: true } } },
  });

  return NextResponse.json({ categories });
}

// POST /api/admin/classrooms/[id]/categories — create a category
export async function POST(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: classroomId } = await params;
  const body = await request.json();
  const { name, type } = body as { name?: string; type?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (type !== "lab" && type !== "assignment") {
    return NextResponse.json(
      { error: "Type must be 'lab' or 'assignment'" },
      { status: 400 }
    );
  }

  // Verify classroom exists
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const category = await db.category.create({
    data: { name: name.trim(), type, classroomId },
    include: { _count: { select: { files: true } } },
  });

  return NextResponse.json({ category }, { status: 201 });
}
