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

// GET /api/admin/classrooms — list all classrooms with their categories
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classrooms = await db.classroom.findMany({
    orderBy: { name: "asc" },
    include: {
      categories: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { files: true } },
        },
      },
    },
  });

  return NextResponse.json({ classrooms });
}

// POST /api/admin/classrooms — create a new classroom
export async function POST(request: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = toSlug(name);

  // Ensure unique slug
  const existing = await db.classroom.findFirst({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const classroom = await db.classroom.create({
    data: { name: name.trim(), slug: finalSlug },
    include: { categories: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ classroom }, { status: 201 });
}
