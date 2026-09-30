import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/classrooms — public, used by main page + upload form
export async function GET() {
  try {
    const classrooms = await db.classroom.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return NextResponse.json({ classrooms });
  } catch (err) {
    console.error("[Public classrooms API]", err);
    return NextResponse.json({ classrooms: [] });
  }
}
