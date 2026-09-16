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

  if (mode === "request") {
    return (
      <div className="flex gap-2 items-center">
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

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      {error && <span className="text-xs text-red-500">{error}</span>}

      {!isApproved && (
        <Button size="sm" variant="outline" loading={loading} onClick={() => callApi("approve_upload", {})}>
          Allow Upload
        </Button>
      )}
      {isApproved && (
        <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("revoke_upload", {})}>
          Revoke Upload
        </Button>
      )}

      {currentRole === "USER" && (
        <Button size="sm" variant="secondary" loading={loading} onClick={() => callApi("set_role", { role: "NURD" })}>
          ⚡ Make Nurd
        </Button>
      )}
      {currentRole === "NURD" && (
        <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "USER" })}>
          Demote to User
        </Button>
      )}
      {(currentRole === "USER" || currentRole === "NURD") && (
        <Button size="sm" variant="ghost" loading={loading} onClick={() => callApi("set_role", { role: "MODERATOR" })}>
          Make Mod
        </Button>
      )}
    </div>
  );
}
