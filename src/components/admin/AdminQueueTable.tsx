"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatBytes, getMimeLabel } from "@/lib/utils";
import { approveAssignment, rejectAssignment, getPreviewUrl } from "@/server/actions/moderation";
import { REJECTION_REASON_LABELS } from "@/types";
import type { RejectionReason } from "@/types";

type Assignment = {
  id: string;
  title: string;
  subject: string;
  college: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: Date;
  expiresAt: Date;
  uploadedBy: { name: string | null; email: string | null };
};

interface AdminQueueTableProps {
  assignments: Assignment[];
}

export function AdminQueueTable({ assignments }: AdminQueueTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<RejectionReason>("OTHER");
  const [rejectNotes, setRejectNotes] = useState("");
  const [error, setError] = useState("");

  async function handleApprove(id: string) {
    setLoading(id + "-approve");
    const result = await approveAssignment(id);
    if (!result.success) setError(result.error ?? "Failed");
    setLoading(null);
    router.refresh();
  }

  async function handleReject() {
    if (!rejectModalId) return;
    setLoading(rejectModalId + "-reject");
    const result = await rejectAssignment(rejectModalId, rejectReason, rejectNotes);
    if (!result.success) setError(result.error ?? "Failed");
    setRejectModalId(null);
    setRejectNotes("");
    setLoading(null);
    router.refresh();
  }

  async function handlePreview(id: string) {
    setLoading(id + "-preview");
    const { url, error: err } = await getPreviewUrl(id);
    if (url) {
      window.open(url, "_blank");
    } else {
      setError(err ?? "Could not get preview URL");
    }
    setLoading(null);
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <p className="text-gray-400 text-sm">No assignments in this queue.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assignment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Uploader</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">File</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 max-w-xs truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.subject}</p>
                      {a.college && <p className="text-xs text-gray-400">{a.college}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-700">{a.uploadedBy.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{a.uploadedBy.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {getMimeLabel(a.fileType)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatBytes(a.fileSize)}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(a.expiresAt)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={loading === a.id + "-preview"}
                        onClick={() => handlePreview(a.id)}
                      >
                        Preview
                      </Button>
                      {a.status === "PENDING" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={loading === a.id + "-approve"}
                            onClick={() => handleApprove(a.id)}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectModalId(a.id)}
                          >
                            ✗ Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModalId}
        onClose={() => { setRejectModalId(null); setRejectNotes(""); }}
        title="Reject Submission"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for rejection
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(REJECTION_REASON_LABELS) as [RejectionReason, string][]).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    rejectReason === key
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={rejectReason === key}
                    onChange={() => setRejectReason(key)}
                    className="text-red-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes (optional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              placeholder="Specific feedback for the uploader..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              loading={loading === rejectModalId + "-reject"}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setRejectModalId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
