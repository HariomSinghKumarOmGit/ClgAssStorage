import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { UploadForm } from "@/components/upload/UploadForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Assignment",
};

export default async function UploadPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const canUpload =
    user.isApproved || user.role === "MODERATOR" || user.role === "ADMIN";

  if (!canUpload) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Upload Access Required</h1>
        <p className="text-gray-500 text-sm mb-6">
          You need admin approval before you can upload assignments. Request
          access below.
        </p>
        <a
          href="/request-access"
          className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Request Upload Access
        </a>
      </div>
    );
  }

  // Get available folders for the folder picker
  const folders = await db.folder.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Assignment</h1>
        <p className="text-sm text-gray-500">
          Fill in the details below. Your file will be reviewed before it
          becomes public.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <UploadForm folders={folders} />
      </div>
    </div>
  );
}
