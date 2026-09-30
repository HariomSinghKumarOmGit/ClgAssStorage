import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/classrooms/[id] — rename classroom
export async function PATCH(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = toSlug(name);
  const classroom = await db.classroom.update({
    where: { id },
    data: { name: name.trim(), slug },
    include: { categories: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ classroom });
}

// DELETE /api/admin/classrooms/[id] — delete classroom (cascades to categories)
export async function DELETE(request: Request, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if any files exist under this classroom
  const fileCount = await db.classroomFile.count({ where: { classroomId: id } });
  if (fileCount > 0) {
    return NextResponse.json(
      {
        error: `This classroom has ${fileCount} uploaded file(s). Delete all files first before deleting the classroom.`,
        fileCount,
      },
      { status: 409 }
    );
  }

  await db.classroom.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
