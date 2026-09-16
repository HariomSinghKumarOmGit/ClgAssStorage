import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBytes, formatDate, getMimeLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const assignment = await db.assignment.findUnique({
    where: { slug: params.slug, status: "APPROVED" },
    select: { title: true, description: true, subject: true },
  });

  if (!assignment) return { title: "Not Found" };

  return {
    title: assignment.title,
    description: assignment.description.slice(0, 160),
    openGraph: {
      title: assignment.title,
      description: assignment.description.slice(0, 160),
      type: "article",
    },
  };
}

export default async function AssignmentDetailPage({ params }: Props) {
  const assignment = await db.assignment.findUnique({
    where: { slug: params.slug },
    include: {
      uploadedBy: { select: { name: true, image: true } },
      folder: { select: { name: true, slug: true } },
    },
  });

  // Only show approved assignments publicly
  if (!assignment || assignment.status !== "APPROVED") {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <a href="/assignments" className="hover:text-gray-600">Assignments</a>
        {assignment.folder && (
          <>
            {" / "}
            <a href={`/folders/${assignment.folder.slug}`} className="hover:text-gray-600">
              {assignment.folder.name}
            </a>
          </>
        )}
        {" / "}
        <span className="text-gray-600 truncate">{assignment.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {assignment.title}
          </h1>
          <span className="shrink-0 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-lg">
            {getMimeLabel(assignment.fileType)}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {assignment.subject && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Subject</p>
              <p className="text-sm font-medium">{assignment.subject}</p>
            </div>
          )}
          {assignment.course && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Course</p>
              <p className="text-sm font-medium">{assignment.course}</p>
            </div>
          )}
          {assignment.semester && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Semester</p>
              <p className="text-sm font-medium">{assignment.semester}</p>
            </div>
          )}
          {assignment.college && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">College</p>
              <p className="text-sm font-medium">{assignment.college}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {assignment.description}
          </p>
        </div>

        {/* Tags */}
        {assignment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {assignment.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Download button */}
        <a
          href={`/api/download/${assignment.id}`}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Assignment
        </a>
      </div>

      {/* File info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">File Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">File name</p>
            <p className="font-medium truncate">{assignment.fileName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">File size</p>
            <p className="font-medium">{formatBytes(assignment.fileSize)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Uploaded</p>
            <p className="font-medium">{formatDate(assignment.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Downloads</p>
            <p className="font-medium">{assignment.downloadCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Uploader */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          {assignment.uploadedBy.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assignment.uploadedBy.image}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-xs text-gray-500">
            Uploaded by{" "}
            <span className="font-medium text-gray-700">
              {assignment.uploadedBy.name ?? "Anonymous"}
            </span>
          </span>
        </div>
      </div>

      {/* Report link */}
      <div className="text-center mt-6">
        <a
          href={`/api/report?assignmentId=${assignment.id}`}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          🚩 Report this file
        </a>
      </div>
    </div>
  );
}
