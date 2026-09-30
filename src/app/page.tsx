import Link from "next/link";
import { db } from "@/lib/db";
import { ClassroomDisplay } from "@/components/ClassroomDisplay";

async function getClassroomsWithCategories() {
  try {
    const classrooms = await db.classroom.findMany({
      orderBy: { name: "asc" },
      include: {
        categories: {
          orderBy: [{ type: "asc" }, { name: "asc" }],
          include: {
            files: {
              orderBy: { uploadedAt: "asc" },
              select: { id: true, fileName: true },
            },
          },
        },
      },
    });
    return { classrooms, error: false };
  } catch (err) {
    console.warn("[HomePage] Could not fetch classrooms:", err);
    return { classrooms: [], error: true };
  }
}

export default async function HomePage() {
  const { classrooms, error } = await getClassroomsWithCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Academic Resource Hub
          </h1>
          <p className="text-brand-100 mt-2 max-w-xl text-sm leading-relaxed">
            Browse lab experiments and class assignments by classroom. Upload your files to the correct classroom and category.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <span>➕</span> Upload File
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <span>
            <strong>Database Notice:</strong> Could not connect to database. Ensure your
            <code className="mx-1 bg-amber-100 px-1 rounded">.env</code>
            is configured and run <code className="mx-1 bg-amber-100 px-1 rounded">npm run db:push</code>.
          </span>
        </div>
      )}

      {/* Classrooms Grid */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🏫</span> Classrooms
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a classroom to browse its labs and assignments
            </p>
          </div>
          <Link
            href="/upload"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Upload File →
          </Link>
        </div>

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">🏫</p>
            <p className="font-semibold text-gray-700">No classrooms created yet.</p>
            <p className="text-sm mt-1">
              Please sign in to access management controls.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {classrooms.map((classroom) => (
              <ClassroomDisplay key={classroom.id} classroom={classroom as any} />
            ))}
          </div>
        )}
      </section>

      {/* Quick links to existing features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/assignments"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-400 hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">📂</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-600">Browse All Files</h3>
          <p className="text-xs text-gray-500 mt-1">View all uploaded assignments</p>
        </Link>
        <Link
          href="/upload"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-400 hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">⬆️</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-600">Upload File</h3>
          <p className="text-xs text-gray-500 mt-1">Add a file to a classroom category</p>
        </Link>
      </section>
    </div>
  );
}
