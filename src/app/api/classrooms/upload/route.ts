import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

// POST /api/classrooms/upload — upload a file for a classroom category
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classroomId = formData.get("classroomId") as string | null;
    const categoryId = formData.get("categoryId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!classroomId) return NextResponse.json({ error: "No classroom selected" }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: "No category selected" }, { status: 400 });
    const category = await db.category.findFirst({
      where: { id: categoryId, classroomId },
      include: { classroom: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid classroom or category selection" },
        { status: 400 }
      );
    }

    // Check file limit
    const currentFilesCount = await db.classroomFile.count({
      where: { categoryId },
    });
    
    if (currentFilesCount >= 6) {
      return NextResponse.json(
        { error: "Maximum file limit reached for this category (Max 6 files)." },
        { status: 400 }
      );
    }

    // Build storage path: classroom-slug/type/category-id/timestamp-filename
    const classroomSlug = category.classroom.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const typeFolder = category.type; // "lab" or "assignment"
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `classrooms/${classroomSlug}/${typeFolder}/${categoryId}/${timestamp}-${safeFilename}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    await storage.upload(storageKey, buffer, file.type || "application/octet-stream");

    // Save metadata to DB
    const classroomFile = await db.classroomFile.create({
      data: {
        categoryId,
        classroomId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        storageKey,
      },
    });

    return NextResponse.json({ success: true, file: classroomFile }, { status: 201 });
  } catch (err) {
    console.error("[Classroom Upload]", err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
