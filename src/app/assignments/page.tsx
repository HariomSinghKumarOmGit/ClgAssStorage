import { Suspense } from "react";
import { db } from "@/lib/db";
import { AssignmentGrid } from "@/components/assignments/AssignmentGrid";
import { LoadingState } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Modal";
import type { Metadata } from "next";
import type { SearchFilters } from "@/types";

export const metadata: Metadata = {
  title: "Browse Assignments",
  description: "Browse approved academic assignments and resources.",
};

interface PageProps {
  searchParams: {
    q?: string;
    subject?: string;
    course?: string;
    semester?: string;
    college?: string;
    fileType?: string;
    folderId?: string;
    sortBy?: string;
    page?: string;
  };
}

const PAGE_SIZE = 12;

async function AssignmentResults({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "APPROVED",
    ...(searchParams.subject && {
      subject: { contains: searchParams.subject, mode: "insensitive" },
    }),
    ...(searchParams.course && {
      course: { contains: searchParams.course, mode: "insensitive" },
    }),
    ...(searchParams.semester && { semester: searchParams.semester }),
    ...(searchParams.college && {
      college: { contains: searchParams.college, mode: "insensitive" },
    }),
    ...(searchParams.fileType && {
      fileType: { contains: searchParams.fileType, mode: "insensitive" },
    }),
    ...(searchParams.folderId && { folderId: searchParams.folderId }),
    ...(searchParams.q && {
      OR: [
        { title: { contains: searchParams.q, mode: "insensitive" } },
        { description: { contains: searchParams.q, mode: "insensitive" } },
        { subject: { contains: searchParams.q, mode: "insensitive" } },
        { course: { contains: searchParams.q, mode: "insensitive" } },
        { college: { contains: searchParams.q, mode: "insensitive" } },
        { tags: { hasSome: [searchParams.q] } },
      ],
    }),
  };

  const orderBy =
    searchParams.sortBy === "downloads"
      ? { downloadCount: "desc" as const }
      : { createdAt: "desc" as const };

  const [assignments, total, filterOptions] = await Promise.all([
    db.assignment.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, slug: true, description: true,
        subject: true, course: true, semester: true, college: true,
        university: true, tags: true, fileName: true, fileSize: true,
        fileType: true, status: true, downloadCount: true,
        createdAt: true, approvedAt: true, rejectionReason: true, expiresAt: true,
        uploadedBy: { select: { id: true, name: true, image: true } },
        folder: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.assignment.count({ where }),
    db.assignment.findMany({
      where: { status: "APPROVED" },
      select: { subject: true, semester: true },
      distinct: ["subject"],
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total} assignment{total !== 1 ? "s" : ""} found
        </p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AssignmentGrid assignments={assignments as any} />
      <Pagination page={page} totalPages={totalPages} onPage={() => {}} />
    </div>
  );
}

export default function AssignmentsPage({ searchParams }: PageProps) {
  const hasQuery = Object.values(searchParams).some(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {searchParams.q ? `Results for "${searchParams.q}"` : "All Assignments"}
        </h1>
        <p className="text-gray-500 text-sm">
          Only approved, quality-reviewed assignments are shown here.
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search..."
            className="col-span-2 sm:col-span-3 lg:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            name="subject"
            defaultValue={searchParams.subject}
            placeholder="Subject"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            name="semester"
            defaultValue={searchParams.semester}
            placeholder="Semester"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            name="sortBy"
            defaultValue={searchParams.sortBy}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="newest">Newest</option>
            <option value="downloads">Most downloaded</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Search
            </button>
            {hasQuery && (
              <a
                href="/assignments"
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors"
              >
                ✕
              </a>
            )}
          </div>
        </div>
      </form>

      {/* Results */}
      <Suspense fallback={<LoadingState message="Loading assignments..." />}>
        <AssignmentResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
