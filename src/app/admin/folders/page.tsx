import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getFolderTree } from "@/server/actions/folders";
import { FolderManager } from "@/components/admin/FolderManager";
import Link from "next/link";
import type { Metadata } from "next";
import { canCreateFolders } from "@/lib/auth/helpers";
import type { UserRole } from "@prisma/client";

export const metadata: Metadata = { title: "Folder Manager" };

export default async function AdminFoldersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // SENIOR_MODERATOR and ADMIN can access folders
  if (!canCreateFolders(session.user.role as UserRole)) redirect("/admin");

  const folders = await getFolderTree();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-6">
        <nav className="text-sm text-gray-400 mb-2">
          <Link href="/admin" className="hover:text-gray-600">Admin</Link> / Folder Manager
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Folder Manager</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create categories and subcategories. Users pick a folder when uploading — you confirm during review.
        </p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <FolderManager folders={folders as any} />
    </div>
  );
}
