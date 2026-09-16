import Link from "next/link";
import { db } from "@/lib/db";
import { AssignmentGrid } from "@/components/assignments/AssignmentGrid";

async function getHomepageData() {
  const [recentAssignments, folders, stats] = await Promise.all([
    db.assignment.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
      take: 8,
      select: {
        id: true, title: true, slug: true, description: true,
        subject: true, course: true, semester: true, college: true,
        university: true, tags: true, fileName: true, fileSize: true,
        fileType: true, status: true, downloadCount: true,
        createdAt: true, approvedAt: true, rejectionReason: true, expiresAt: true,
        uploadedBy: { select: { id: true, name: true, image: true } },
        folder: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.folder.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { assignments: { where: { status: "APPROVED" } } } } },
    }),
    db.assignment.aggregate({
      where: { status: "APPROVED" },
      _count: { id: true },
      _sum: { downloadCount: true },
    }),
  ]);

  return { recentAssignments, folders, stats };
}

const FOLDER_ICONS: Record<string, string> = {
  default: "📁",
  "computer science": "💻",
  "mathematics": "📐",
  "physics": "⚛️",
  "chemistry": "🧪",
  "economics": "📈",
  "english": "📝",
  "history": "🏛️",
  "engineering": "⚙️",
};

function getFolderIcon(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(FOLDER_ICONS)) {
    if (key.includes(k)) return v;
  }
  return FOLDER_ICONS.default;
}

export default async function HomePage() {
  const { recentAssignments, folders, stats } = await getHomepageData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedAssignments = recentAssignments as any[];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Share Knowledge,
            <br />
            <span className="text-brand-200">Ace Together</span>
          </h1>
          <p className="text-lg text-brand-100 mb-8 max-w-xl mx-auto">
            A curated library of academic assignments and resources — reviewed
            and approved for quality.
          </p>

          {/* Search bar */}
          <form action="/assignments" method="GET" className="max-w-xl mx-auto">
            <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-lg">
              <input
                name="q"
                type="text"
                placeholder="Search DBMS, Computer Networks, Engineering Maths..."
                className="flex-1 px-4 py-2 text-gray-900 bg-transparent outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats._count.id}</div>
              <div className="text-brand-200 text-xs">Assignments</div>
            </div>
            <div className="w-px h-8 bg-brand-500" />
            <div className="text-center">
              <div className="text-2xl font-bold">{stats._sum.downloadCount ?? 0}</div>
              <div className="text-brand-200 text-xs">Downloads</div>
            </div>
            <div className="w-px h-8 bg-brand-500" />
            <div className="text-center">
              <div className="text-2xl font-bold">{folders.length}</div>
              <div className="text-brand-200 text-xs">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      {folders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
            <Link href="/assignments" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folders/${folder.slug}`}
                className="group flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 text-center"
              >
                <span className="text-3xl mb-2">{getFolderIcon(folder.name)}</span>
                <span className="text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors leading-tight">
                  {folder.name}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {folder._count.assignments} files
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Assignments */}
      {typedAssignments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recently Added</h2>
            <Link href="/assignments" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Browse all →
            </Link>
          </div>
          <AssignmentGrid assignments={typedAssignments} />
        </section>
      )}

      {/* CTA */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Have great assignments to share?
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Request upload access and contribute to the community library. All
            submissions are reviewed for quality.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/request-access"
              className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              Request Upload Access
            </Link>
            <Link
              href="/assignments"
              className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Browse Library
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
