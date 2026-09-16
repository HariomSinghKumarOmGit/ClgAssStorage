import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
  if (!isAdmin) redirect("/");

  const [pendingCount, approvedCount, rejectedCount, expiredCount, accessRequests, totalUsers] =
    await Promise.all([
      db.assignment.count({ where: { status: "PENDING" } }),
      db.assignment.count({ where: { status: "APPROVED" } }),
      db.assignment.count({ where: { status: "REJECTED" } }),
      db.assignment.count({ where: { status: "EXPIRED" } }),
      db.accessRequest.count({ where: { status: "PENDING" } }),
      db.user.count(),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage submissions, folders, and user access
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {[
          { label: "Pending", count: pendingCount, color: "bg-yellow-50 border-yellow-200 text-yellow-700", href: "/admin/queue?status=PENDING" },
          { label: "Approved", count: approvedCount, color: "bg-green-50 border-green-200 text-green-700", href: "/admin/queue?status=APPROVED" },
          { label: "Rejected", count: rejectedCount, color: "bg-red-50 border-red-200 text-red-700", href: "/admin/queue?status=REJECTED" },
          { label: "Expired", count: expiredCount, color: "bg-gray-50 border-gray-200 text-gray-500", href: "/admin/queue?status=EXPIRED" },
          { label: "Access Requests", count: accessRequests, color: "bg-purple-50 border-purple-200 text-purple-700", href: "/admin/users" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`${s.color} border rounded-xl p-4 text-center hover:shadow-sm transition-all`}
          >
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/queue"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-700 transition-colors">
            Review Queue
          </h3>
          <p className="text-xs text-gray-500">
            {pendingCount} pending submissions awaiting review
          </p>
        </Link>

        <Link
          href="/admin/folders"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-700 transition-colors">
            Folder Manager
          </h3>
          <p className="text-xs text-gray-500">
            Create and organize category folders
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-700 transition-colors">
            User Management
          </h3>
          <p className="text-xs text-gray-500">
            {accessRequests} access request{accessRequests !== 1 ? "s" : ""} · {totalUsers} total users
          </p>
        </Link>
      </div>
    </div>
  );
}
