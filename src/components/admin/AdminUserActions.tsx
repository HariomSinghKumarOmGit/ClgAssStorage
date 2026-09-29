"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@prisma/client";

interface Props {
  userId: string;
  mode: "request" | "user";
  requestId?: string;
  currentRole?: UserRole;
  isApproved?: boolean;
}

export function AdminUserActions({ userId, mode, requestId, currentRole, isApproved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function callApi(action: string, body: object) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, requestId, ...body }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error ?? "Failed");
      else router.refresh();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  // ─── Access request mode ───────────────────────────────────────────────────
  if (mode === "request") {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <Button
          size="sm"
          variant="primary"
          loading={loading}
          onClick={() => callApi("approve_request", {})}
        >
          ✓ Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          loading={loading}
          onClick={() => callApi("reject_request", {})}
        >
          ✗ Reject
        </Button>
      </div>
    );
  }

  // ─── User row mode ─────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {error && <span className="text-xs text-red-500 mr-1">{error}</span>}

      {/* Upload access toggle */}
      {!isApproved && currentRole !== "MODERATOR" && currentRole !== "SENIOR_MODERATOR" && (
        <Button size="sm" variant="outline" loading={loading} onClick={() => callApi("approve_upload", {})}>
          Allow Upload
        </Button>
      )}
      {isApproved && currentRole !== "MODERATOR" && currentRole !== "SENIOR_MODERATOR" && (
        <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("revoke_upload", {})}>
          Revoke Upload
        </Button>
      )}

      {/* Role upgrade path: USER → NURD → SENIOR_MODERATOR chain, or sideways to MODERATOR */}
      {currentRole === "USER" && (
        <>
          <Button size="sm" variant="secondary" loading={loading} onClick={() => callApi("set_role", { role: "NURD" })}>
            ⚡ Nurd
          </Button>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "MODERATOR" })}>
            Moderator
          </Button>
        </>
      )}

      {currentRole === "NURD" && (
        <>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "USER" })}>
            ↓ User
          </Button>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "MODERATOR" })}>
            Moderator
          </Button>
        </>
      )}

      {currentRole === "MODERATOR" && (
        <>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "USER" })}>
            ↓ User
          </Button>
          <Button size="sm" variant="secondary" loading={loading} onClick={() => callApi("set_role", { role: "SENIOR_MODERATOR" })}>
            ↑ Sr. Mod
          </Button>
        </>
      )}

      {currentRole === "SENIOR_MODERATOR" && (
        <>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "MODERATOR" })}>
            ↓ Moderator
          </Button>
          <Button size="sm" variant="secondary" loading={loading} onClick={() => callApi("set_role", { role: "ADMIN" })}>
            ↑ Admin
          </Button>
        </>
      )}

      {currentRole === "ADMIN" && (
        <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "SENIOR_MODERATOR" })}>
          ↓ Sr. Mod
        </Button>
      )}
    </div>
  );
}
