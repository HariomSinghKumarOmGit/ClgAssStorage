import Link from "next/link";
import { db } from "@/lib/db";
import { formatBytes } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export default async function SubjectClassroomPage({ params }: Props) {
  const subjectName = decodeURIComponent(params.slug);

  const assignments = await db.assignment.findMany({
    where: {
      subject: { equals: subjectName, mode: "insensitive" },
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Breadcrumb Header (Matching Wireframe 1: Subject - Classroom) */}
      <nav className="text-sm text-gray-500 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-900 font-medium">Home</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{subjectName} - Classroom</span>
      </nav>

      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
            Subject Classroom
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{subjectName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse all lab experiments and class assignments for {subjectName}.
          </p>
        </div>

        <Link
          href={`/upload?subject=${encodeURIComponent(subjectName)}`}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <span>➕</span> Upload Assignment (5MB Limit)
        </Link>
      </div>

      {/* Assignment Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          All Assignments & Experiments ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 font-medium">No assignments uploaded for {subjectName} yet.</p>
            <Link
              href={`/upload?subject=${encodeURIComponent(subjectName)}`}
              className="inline-block mt-4 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
            >
              Upload First File (5MB Limit)
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((item) => (
              <Link
                key={item.id}
                href={`/assignments/${item.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                      {item.course || "Classroom"}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-600">5MB max</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>👤 {item.uploadedBy?.name || "Student"}</span>
                  <span className="font-semibold text-gray-700">{formatBytes(item.fileSize)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
