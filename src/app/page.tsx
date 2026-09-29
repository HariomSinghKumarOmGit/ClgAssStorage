import Link from "next/link";
import { db } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/utils";

async function getHomepageData() {
  const [recentAssignments, allAssignments] = await Promise.all([
    db.assignment.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { uploadedBy: { select: { name: true, image: true } } },
    }),
    db.assignment.findMany({
      where: { status: "APPROVED" },
      orderBy: { title: "asc" },
      include: { uploadedBy: { select: { name: true } } },
    }),
  ]);

  // Group assignments by Subject -> Lab Experiments vs Class Assignments
  const subjectMap: Record<
    string,
    { labs: typeof allAssignments; assignments: typeof allAssignments }
  > = {};

  const defaultSubjects = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Electrical Engineering",
  ];

  defaultSubjects.forEach((sub) => {
    subjectMap[sub] = { labs: [], assignments: [] };
  });

  allAssignments.forEach((item) => {
    const sub = item.subject || "General";
    if (!subjectMap[sub]) {
      subjectMap[sub] = { labs: [], assignments: [] };
    }
    const isLab =
      item.course?.toLowerCase().includes("lab") ||
      item.title.toLowerCase().includes("exp") ||
      item.title.toLowerCase().includes("lab");
    if (isLab) {
      subjectMap[sub].labs.push(item);
    } else {
      subjectMap[sub].assignments.push(item);
    }
  });

  return { recentAssignments, subjectMap };
}

export default async function HomePage() {
  const { recentAssignments, subjectMap } = await getHomepageData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Top Header / Hero banner (Matching Wireframe 1: HOME) */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Academic Resource Hub
          </h1>
          <p className="text-brand-100 mt-2 max-w-xl text-sm leading-relaxed">
            Browse lab experiments and class assignments by subject. Upload your own file (Max 5MB restriction).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <span>➕</span> Upload Assignment (5MB Limit)
          </Link>
        </div>
      </div>

      {/* ─── 1. Recently Uploaded (Matching Wireframe 1: Top Row) ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🕒</span> Recently Uploaded
          </h2>
          <Link
            href="/assignments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View all →
          </Link>
        </div>

        {recentAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No assignments uploaded yet. Be the first to upload!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAssignments.map((item) => (
              <Link
                key={item.id}
                href={`/assignments/${item.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg border border-brand-200">
                      {item.subject}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      5MB max
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>👤 {item.uploadedBy?.name || "Student"}</span>
                  <span className="font-semibold text-gray-700">{formatBytes(item.fileSize)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── 2. Subject Table Layout (Matching Wireframe 1: Subject / Lab Experiments / Class Assignment) ─── */}
      <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Subjects & Courses</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a subject to view lab experiments and class assignments
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {Object.entries(subjectMap).map(([subjectName, data]) => (
            <div key={subjectName} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subject Name Column */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                      📚
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{subjectName}</h3>
                      <Link
                        href={`/subjects/${encodeURIComponent(subjectName)}`}
                        className="text-xs text-brand-600 font-semibold hover:underline mt-0.5 inline-block"
                      >
                        Open Classroom →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Columns: Lab Experiments & Class Assignments */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lab Experiments Box */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        🧪 Lab Experiments ({data.labs.length})
                      </span>
                    </div>

                    {data.labs.length === 0 ? (
                      <p className="text-xs text-amber-700/60 italic">No lab experiments added yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.labs.slice(0, 3).map((lab) => (
                          <li key={lab.id}>
                            <Link
                              href={`/assignments/${lab.slug}`}
                              className="text-xs font-medium text-amber-900 hover:text-brand-700 hover:underline truncate block"
                            >
                              • {lab.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Class Assignments Box */}
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                        📘 Class Assignments ({data.assignments.length})
                      </span>
                    </div>

                    {data.assignments.length === 0 ? (
                      <p className="text-xs text-blue-700/60 italic">No class assignments added yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.assignments.slice(0, 3).map((ass) => (
                          <li key={ass.id}>
                            <Link
                              href={`/assignments/${ass.slug}`}
                              className="text-xs font-medium text-blue-900 hover:text-brand-700 hover:underline truncate block"
                            >
                              • {ass.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
