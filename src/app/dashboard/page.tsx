import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { uploaded?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const assignments = await db.assignment.findMany({
    where: { uploadedById: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, status: true,
      subject: true, fileName: true, fileSize: true, fileType: true,
      createdAt: true, approvedAt: true, rejectedAt: true,
      rejectionReason: true, expiresAt: true, downloadCount: true,
    },
  });

  const counts = {
    pending: assignments.filter((a) => a.status === "PENDING").length,
    approved: assignments.filter((a) => a.status === "APPROVED").length,
    rejected: assignments.filter((a) => a.status === "REJECTED").length,
    expired: assignments.filter((a) => a.status === "EXPIRED").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Uploads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your submissions and their review status
          </p>
        </div>
        <a
          href="/upload"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Upload
        </a>
      </div>

      {/* Upload success banner */}
      {searchParams.uploaded && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Your file was uploaded successfully and is pending moderation!
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending", count: counts.pending, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
          { label: "Approved", count: counts.approved, color: "text-green-600 bg-green-50 border-green-200" },
          { label: "Rejected", count: counts.rejected, color: "text-red-600 bg-red-50 border-red-200" },
          { label: "Expired", count: counts.expired, color: "text-gray-500 bg-gray-50 border-gray-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">You haven&apos;t uploaded anything yet.</p>
          <a
            href="/upload"
            className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Upload your first assignment →
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {assignments.map((a) => (
            <div key={a.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-gray-400">{a.subject}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Uploaded {formatRelativeDate(a.createdAt)}
                    {a.approvedAt && ` · Approved ${formatDate(a.approvedAt)}`}
                    {a.rejectedAt && ` · Rejected ${formatDate(a.rejectedAt)}`}
                  </p>

                  {/* Rejection reason */}
                  {a.status === "REJECTED" && a.rejectionReason && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 mt-2 inline-block">
                      Reason: {a.rejectionReason}
                    </p>
                  )}

                  {/* Expiry warning */}
                  {a.status === "PENDING" && (
                    <p className="text-xs text-amber-600 mt-1">
                      Expires {formatDate(a.expiresAt)} if not reviewed
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {a.status === "APPROVED" && (
                    <a
                      href={`/assignments/${a.slug}`}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      View →
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {a.downloadCount} downloads
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
