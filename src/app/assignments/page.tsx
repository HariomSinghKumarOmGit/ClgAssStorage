import { db } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse All Files",
  description: "Browse all uploaded files across all classrooms.",
};

export default async function BrowseFilesPage() {
  const files = await db.classroomFile.findMany({
    orderBy: { uploadedAt: "desc" },
    include: {
      category: {
        include: {
          classroom: true,
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Browse All Files</h1>
        <p className="text-sm text-gray-500">
          Showing all {files.length} file{files.length !== 1 ? "s" : ""} uploaded across all classrooms.
        </p>
      </div>

      {files.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-semibold text-gray-700">No files uploaded yet.</p>
          <p className="text-sm mt-1">Files uploaded to any classroom will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {files.map((file) => (
              <li key={file.id} className="hover:bg-gray-50 transition-colors">
                <a
                  href={`/api/file/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-brand-100 transition-colors">
                      📄
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {file.fileName}
                      </h4>
                      <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-gray-500 font-medium">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {file.category.classroom.name}
                        </span>
                        <span className="text-gray-300">›</span>
                        <span className={`px-2 py-0.5 rounded-md ${
                          file.category.type === "lab" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {file.category.name}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{formatBytes(file.fileSize)}</span>
                        <span className="text-gray-300">·</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-bold text-brand-600 shrink-0 group-hover:translate-x-1 transition-transform">
                    Open PDF →
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
