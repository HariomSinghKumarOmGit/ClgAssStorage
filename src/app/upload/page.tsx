import { UploadForm } from "@/components/upload/UploadForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload File",
};

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload File</h1>
        <p className="text-sm text-gray-500">
          Select your classroom, type, and category to upload a file.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <UploadForm />
      </div>
    </div>
  );
}
