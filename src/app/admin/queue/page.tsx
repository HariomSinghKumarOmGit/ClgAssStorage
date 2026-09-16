import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AdminQueueTable } from "@/components/admin/AdminQueueTable";
import type { Metadata } from "next";
import type { AssignmentStatus } from "@prisma/client";
import Link from "next/link";

export const metadata: Metadata = { title: "Review Queue" };

const VALID_STATUSES: AssignmentStatus[] = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"];

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/");

  const statusFilter = VALID_STATUSES.includes(searchParams.status as AssignmentStatus)
    ? (searchParams.status as AssignmentStatus)
    : "PENDING";

  const assignments = await db.assignment.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: statusFilter === "PENDING" ? "asc" : "desc" },
    take: 50,
    select: {
      id: true, title: true, subject: true, college: true,
      fileName: true, fileSize: true, fileType: true,
      status: true, createdAt: true, expiresAt: true,
      uploadedBy: { select: { name: true, email: true } },
    },
  });

  const tabs: { status: AssignmentStatus; label: string }[] = [
    { status: "PENDING", label: "Pending" },
    { status: "APPROVED", label: "Approved" },
    { status: "REJECTED", label: "Rejected" },
    { status: "EXPIRED", label: "Expired" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-6">
        <nav className="text-sm text-gray-400 mb-2">
          <Link href="/admin" className="hover:text-gray-600">Admin</Link> / Review Queue
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/queue?status=${tab.status}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.status
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AdminQueueTable assignments={assignments as any} />
    </div>
  );
}
