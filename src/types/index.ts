import type { UserRole, AssignmentStatus } from "@prisma/client";

// ─── Session augmentation ─────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isApproved: boolean;
    };
  }
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Assignment types ─────────────────────────────────────────────────────────

export interface AssignmentWithUploader {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  course: string | null;
  semester: string | null;
  college: string | null;
  university: string | null;
  tags: string[];
  fileName: string;
  fileSize: number;
  fileType: string;
  status: AssignmentStatus;
  downloadCount: number;
  createdAt: Date;
  approvedAt: Date | null;
  rejectionReason: string | null;
  expiresAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ─── Folder types ─────────────────────────────────────────────────────────────

export interface FolderWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  children: FolderWithChildren[];
  _count: { assignments: number };
}

// ─── Upload form ──────────────────────────────────────────────────────────────

export interface UploadFormData {
  title: string;
  description: string;
  subject: string;
  course?: string;
  semester?: string;
  college?: string;
  university?: string;
  tags: string[];
  folderId?: string;
  file: File;
  agreedToTerms: boolean;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export type RejectionReason =
  | "DUPLICATE"
  | "WRONG_CATEGORY"
  | "INAPPROPRIATE"
  | "INVALID_FILE"
  | "LOW_QUALITY"
  | "NOT_ASSIGNMENT"
  | "COPYRIGHT"
  | "OTHER";

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  DUPLICATE: "Duplicate submission",
  WRONG_CATEGORY: "Wrong category / folder",
  INAPPROPRIATE: "Inappropriate content",
  INVALID_FILE: "Invalid or corrupt file",
  LOW_QUALITY: "Low quality content",
  NOT_ASSIGNMENT: "Not an assignment or resource",
  COPYRIGHT: "Possible copyright violation",
  OTHER: "Other (specify in notes)",
};

// ─── Search / Filters ─────────────────────────────────────────────────────────

export interface SearchFilters {
  q?: string;
  subject?: string;
  course?: string;
  semester?: string;
  college?: string;
  fileType?: string;
  folderId?: string;
  sortBy?: "newest" | "downloads" | "relevance";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
