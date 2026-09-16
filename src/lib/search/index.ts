import { db } from "@/lib/db";
import type { SearchFilters, PaginatedResult, AssignmentWithUploader } from "@/types";

const DEFAULT_PAGE_SIZE = 12;

/**
 * Search assignments using PostgreSQL full-text search + ILIKE fallback
 */
export async function searchAssignments(
  filters: SearchFilters
): Promise<PaginatedResult<AssignmentWithUploader>> {
  const {
    q,
    subject,
    course,
    semester,
    college,
    fileType,
    folderId,
    sortBy = "newest",
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause — only APPROVED assignments shown publicly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "APPROVED",
    ...(subject && { subject: { contains: subject, mode: "insensitive" } }),
    ...(course && { course: { contains: course, mode: "insensitive" } }),
    ...(semester && { semester }),
    ...(college && { college: { contains: college, mode: "insensitive" } }),
    ...(fileType && { fileType: { contains: fileType, mode: "insensitive" } }),
    ...(folderId && { folderId }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { course: { contains: q, mode: "insensitive" } },
        { college: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q] } },
      ],
    }),
  };

  const orderBy =
    sortBy === "downloads"
      ? { downloadCount: "desc" as const }
      : sortBy === "relevance" && q
      ? { downloadCount: "desc" as const } // Simple relevance proxy
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    db.assignment.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        subject: true,
        course: true,
        semester: true,
        college: true,
        university: true,
        tags: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        status: true,
        downloadCount: true,
        createdAt: true,
        approvedAt: true,
        rejectionReason: true,
        expiresAt: true,
        uploadedBy: {
          select: { id: true, name: true, image: true },
        },
        folder: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    db.assignment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items: items as AssignmentWithUploader[],
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get unique filter values for the filter panel (only from APPROVED assignments)
 */
export async function getFilterOptions() {
  const [subjects, courses, semesters, colleges] = await Promise.all([
    db.assignment.findMany({
      where: { status: "APPROVED" },
      select: { subject: true },
      distinct: ["subject"],
      orderBy: { subject: "asc" },
    }),
    db.assignment.findMany({
      where: { status: "APPROVED", course: { not: null } },
      select: { course: true },
      distinct: ["course"],
      orderBy: { course: "asc" },
    }),
    db.assignment.findMany({
      where: { status: "APPROVED", semester: { not: null } },
      select: { semester: true },
      distinct: ["semester"],
      orderBy: { semester: "asc" },
    }),
    db.assignment.findMany({
      where: { status: "APPROVED", college: { not: null } },
      select: { college: true },
      distinct: ["college"],
      orderBy: { college: "asc" },
    }),
  ]);

  return {
    subjects: subjects.map((s) => s.subject),
    courses: courses.map((c) => c.course!),
    semesters: semesters.map((s) => s.semester!),
    colleges: colleges.map((c) => c.college!),
  };
}
