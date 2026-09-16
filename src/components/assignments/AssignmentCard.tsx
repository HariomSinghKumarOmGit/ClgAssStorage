import Link from "next/link";
import { formatBytes, formatRelativeDate, getMimeLabel } from "@/lib/utils";
import type { AssignmentWithUploader } from "@/types";

interface AssignmentCardProps {
  assignment: AssignmentWithUploader;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const mimeLabel = getMimeLabel(assignment.fileType);

  const mimeColors: Record<string, string> = {
    PDF: "bg-red-100 text-red-700",
    DOC: "bg-blue-100 text-blue-700",
    DOCX: "bg-blue-100 text-blue-700",
    PPT: "bg-orange-100 text-orange-700",
    PPTX: "bg-orange-100 text-orange-700",
    TXT: "bg-gray-100 text-gray-700",
  };

  const mimeColor = mimeColors[mimeLabel] ?? "bg-gray-100 text-gray-700";

  return (
    <Link
      href={`/assignments/${assignment.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Top stripe color by subject */}
      <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-300" />

      <div className="p-5">
        {/* File type badge + folder */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${mimeColor}`}
          >
            {mimeLabel}
          </span>
          {assignment.folder && (
            <span className="text-xs text-gray-400 truncate max-w-[120px]">
              📁 {assignment.folder.name}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
          {assignment.title}
        </h3>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {assignment.subject && (
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              {assignment.subject}
            </span>
          )}
          {assignment.semester && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              Sem {assignment.semester}
            </span>
          )}
          {assignment.course && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[100px]">
              {assignment.course}
            </span>
          )}
        </div>

        {/* Tags */}
        {assignment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {assignment.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {assignment.downloadCount.toLocaleString()}
          </div>
          <span className="text-xs text-gray-400">
            {formatRelativeDate(assignment.createdAt)}
          </span>
          <span className="text-xs text-gray-400">
            {formatBytes(assignment.fileSize)}
          </span>
        </div>
      </div>
    </Link>
  );
}
