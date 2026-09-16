import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AssignmentGrid } from "@/components/assignments/AssignmentGrid";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const folder = await db.folder.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!folder) return { title: "Not Found" };
  return { title: folder.name, description: folder.description ?? undefined };
}

export default async function FolderPage({ params }: Props) {
  const folder = await db.folder.findUnique({
    where: { slug: params.slug },
    include: {
      children: { orderBy: { name: "asc" } },
      assignments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, slug: true, description: true,
          subject: true, course: true, semester: true, college: true,
          university: true, tags: true, fileName: true, fileSize: true,
          fileType: true, status: true, downloadCount: true,
          createdAt: true, approvedAt: true, rejectionReason: true, expiresAt: true,
          uploadedBy: { select: { id: true, name: true, image: true } },
          folder: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!folder) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <nav className="text-sm text-gray-400 mb-3">
          <a href="/" className="hover:text-gray-600">Home</a>
          {" / "}
          <span className="text-gray-700 font-medium">{folder.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">📁 {folder.name}</h1>
        {folder.description && (
          <p className="text-gray-500 mt-1 text-sm">{folder.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {folder.assignments.length} approved assignment{folder.assignments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Subfolders */}
      {folder.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Subfolders</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {folder.children.map((child) => (
              <a
                key={child.id}
                href={`/folders/${child.slug}`}
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-brand-700"
              >
                📁 {child.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AssignmentGrid
        assignments={folder.assignments as any}
        emptyMessage="No approved assignments in this folder yet."
      />
    </div>
  );
}
