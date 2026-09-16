import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { RoleBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

export const metadata: Metadata = { title: "User Management" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin");

  const [accessRequests, users] = await Promise.all([
    db.accessRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true, image: true, role: true } } },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, image: true,
        role: true, isApproved: true, createdAt: true,
        _count: { select: { assignments: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-6">
        <nav className="text-sm text-gray-400 mb-2">
          <Link href="/admin" className="hover:text-gray-600">Admin</Link> / User Management
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Pending Access Requests */}
      {accessRequests.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⏳ Pending Access Requests ({accessRequests.length})
          </h2>
          <div className="bg-white rounded-2xl border border-yellow-200 divide-y divide-gray-100 overflow-hidden">
            {accessRequests.map((req) => (
              <div key={req.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {req.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={req.user.image} alt="" className="w-9 h-9 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{req.user.name}</p>
                    <p className="text-sm text-gray-500">{req.user.email}</p>
                    {req.reason && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{req.reason}"</p>
                    )}
                  </div>
                </div>
                <AdminUserActions requestId={req.id} userId={req.userId} mode="request" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users ({users.length})</h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Upload Access</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Files</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {user.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isApproved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {user.isApproved ? "Approved" : "Not approved"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{user._count.assignments}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <AdminUserActions userId={user.id} currentRole={user.role} isApproved={user.isApproved} mode="user" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
