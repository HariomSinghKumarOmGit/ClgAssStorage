import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

interface StatusBadgeProps {
  status: AssignmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  USER: { label: "User", className: "bg-blue-100 text-blue-800" },
  NURD: { label: "⚡ Nurd", className: "bg-purple-100 text-purple-800" },
  MODERATOR: { label: "Moderator", className: "bg-orange-100 text-orange-800" },
  ADMIN: { label: "Admin", className: "bg-red-100 text-red-800" },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? { label: role, className: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
