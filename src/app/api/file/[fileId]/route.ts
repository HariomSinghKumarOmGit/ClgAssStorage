import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    
    const file = await db.classroomFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return new NextResponse("File not found.", { status: 404 });
    }

    const storage = getStorage();
    const publicUrl = storage.getPublicUrl(file.storageKey);

    return NextResponse.redirect(publicUrl);
  } catch (error) {
    console.error("Error opening file:", error);
    return new NextResponse("Failed to open file", { status: 500 });
  }
}
