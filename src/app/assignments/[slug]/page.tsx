import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBytes, formatDate, getMimeLabel } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export default async function AssignmentDetailPage({ params }: Props) {
  const assignment = await db.assignment.findUnique({
    where: { slug: params.slug },
    include: {
      uploadedBy: { select: { name: true, image: true } },
      folder: { select: { name: true, slug: true } },
    },
  });

  if (!assignment) {
    notFound();
  }

  // Fetch all submissions for the same subject/assignment
  const submissions = await db.assignment.findMany({
    where: {
      subject: assignment.subject,
      status: "APPROVED",
    },
    include: {
      uploadedBy: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ─── Header Breadcrumb (Matching Wireframe 1: HOME > Subject - Classroom - Ass 1) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-900 font-medium">HOME</Link>
          <span>›</span>
          <Link
            href={`/subjects/${encodeURIComponent(assignment.subject || "General")}`}
            className="hover:text-gray-900 font-medium"
          >
            {assignment.subject} - Classroom
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-bold truncate">{assignment.title}</span>
        </nav>

        {/* Upload Button on page (Matching Wireframe 1: [Upload]) */}
        <Link
          href={`/upload?subject=${encodeURIComponent(assignment.subject)}&title=${encodeURIComponent(assignment.title)}`}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <span>➕</span> Upload Submission (5MB Limit)
        </Link>
      </div>

      {/* Main Assignment Overview Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
              {assignment.subject}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {assignment.title}
            </h1>
          </div>
          <span className="shrink-0 text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-xl">
            {getMimeLabel(assignment.fileType)}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">
          {assignment.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block">Original File</span>
            <span className="font-bold text-gray-900 truncate block">{assignment.fileName}</span>
          </div>
          <div>
            <span className="text-gray-400 block">File Size</span>
            <span className="font-bold text-gray-900 block">{formatBytes(assignment.fileSize)}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Uploaded On</span>
            <span className="font-bold text-gray-900 block">{formatDate(assignment.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Restriction</span>
            <span className="font-bold text-red-600 block">Strict 5MB Max</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={`/api/download/${assignment.id}`}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>📥</span> Download This Assignment
          </a>
        </div>
      </div>

      {/* ─── Student Submissions Section (Matching Wireframe 1: Ass 1 by A | Ass 1 by B | Ass 1 by C) ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Student Submissions ({submissions.length})
          </h2>
          <span className="text-xs font-semibold text-gray-400">
            All files restricted to 5MB max
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {submissions.map((sub, idx) => {
            const studentLetter = String.fromCharCode(65 + (idx % 26)); // A, B, C...
            const studentName = sub.uploadedBy?.name || `Student ${studentLetter}`;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                        {studentLetter}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Ass 1 by {studentName}
                        </p>
                        <p className="text-[11px] text-gray-400">{formatDate(sub.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{sub.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{formatBytes(sub.fileSize)}</p>
                </div>

                <a
                  href={`/api/download/${sub.id}`}
                  className="mt-4 w-full bg-gray-100 hover:bg-brand-600 hover:text-white text-gray-800 text-xs font-bold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>⬇️</span> Download ({studentLetter})
                </a>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
