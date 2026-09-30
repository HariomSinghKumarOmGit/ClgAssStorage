import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ClassroomManager } from "@/components/admin/ClassroomManager";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

// Force dynamic rendering (reads cookies)
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  // Fetch initial data server-side
  const classrooms = await db.classroom.findMany({
    orderBy: { name: "asc" },
    include: {
      categories: {
        orderBy: [{ type: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { files: true } },
        },
      },
    },
  });

  const stats = {
    totalClassrooms: classrooms.length,
    totalCategories: classrooms.reduce((sum, c) => sum + c.categories.length, 0),
    totalLabs: classrooms.reduce(
      (sum, c) => sum + c.categories.filter((cat) => cat.type === "lab").length,
      0
    ),
    totalAssignments: classrooms.reduce(
      (sum, c) => sum + c.categories.filter((cat) => cat.type === "assignment").length,
      0
    ),
  };

  // Serialize for client component (dates to strings)
  const serializedClassrooms = classrooms.map((classroom) => ({
    ...classroom,
    createdAt: classroom.createdAt.toISOString(),
    updatedAt: classroom.updatedAt.toISOString(),
    categories: classroom.categories.map((cat) => ({
      ...cat,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage classrooms, labs, and assignments. Changes are immediately reflected on the main site.
          </p>
        </div>
        <AdminSignOutButton />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Classrooms</p>
          <p className="text-3xl font-extrabold text-brand-900 mt-1">{stats.totalClassrooms}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Lab Categories</p>
          <p className="text-3xl font-extrabold text-amber-900 mt-1">{stats.totalLabs}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Assignment Categories</p>
          <p className="text-3xl font-extrabold text-blue-900 mt-1">{stats.totalAssignments}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700">Total Categories</p>
          <p className="text-3xl font-extrabold text-green-900 mt-1">{stats.totalCategories}</p>
        </div>
      </div>

      {/* Classroom Manager */}
      <ClassroomManager initialClassrooms={serializedClassrooms} />
    </div>
  );
}
