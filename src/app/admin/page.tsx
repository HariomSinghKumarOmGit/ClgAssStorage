import { db } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const [pendingCount, approvedCount, totalUploads, totalUsers, allAssignments] =
    await Promise.all([
      db.assignment.count({ where: { status: "PENDING" } }),
      db.assignment.count({ where: { status: "APPROVED" } }),
      db.assignment.count(),
      db.user.count(),
      db.assignment.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          subject: true,
          course: true,
          fileSize: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const defaultSubjects = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Electrical Engineering",
  ];

  const dbSubjects = Array.from(
    new Set(allAssignments.map((a) => a.subject).filter(Boolean))
  );

  const subjects = Array.from(new Set([...defaultSubjects, ...dbSubjects]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Panel</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage subject lab experiments, class assignments, and upload limits (5MB Max).
          </p>
        </div>
      </div>

      <AdminDashboardClient
        stats={{
          totalPending: pendingCount,
          totalUploads: totalUploads,
          totalApproved: approvedCount,
          totalUsers: totalUsers || 1,
        }}
        subjects={subjects}
        initialAssignments={allAssignments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
