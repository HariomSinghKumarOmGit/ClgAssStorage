"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { uploadAssignment } from "@/server/actions/upload";
import { ALLOWED_MIME_LIST } from "@/lib/validation/upload";
import { getUploadLimits } from "@/lib/auth/helpers";
import { formatBytes } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
}

interface UploadFormProps {
  folders: Folder[];
}

export function UploadForm({ folders }: UploadFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = (session?.user?.role ?? "USER") as "USER" | "NURD" | "MODERATOR" | "ADMIN";
  const limits = getUploadLimits(role);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !ALLOWED_MIME_LIST.includes(f.type)) {
      setError("File type not allowed. Use PDF, DOC, DOCX, PPT, PPTX, or TXT.");
    } else if (f && f.size > limits.maxFileSizeBytes) {
      setError(`File too large. Your limit is ${limits.maxFileSizeMB} MB.`);
    } else {
      setError("");
    }
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (tags.length >= 10) return;
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError("Please select a file");
    if (!agreed) return setError("You must agree to the upload terms");

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", (form.elements.namedItem("title") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    fd.append("subject", (form.elements.namedItem("subject") as HTMLInputElement).value);
    fd.append("course", (form.elements.namedItem("course") as HTMLInputElement).value);
    fd.append("semester", (form.elements.namedItem("semester") as HTMLInputElement).value);
    fd.append("college", (form.elements.namedItem("college") as HTMLInputElement).value);
    fd.append("university", (form.elements.namedItem("university") as HTMLInputElement).value);
    fd.append("folderId", (form.elements.namedItem("folderId") as HTMLSelectElement).value);
    fd.append("tags", JSON.stringify(tags));
    fd.append("agreedToTerms", "true");

    const result = await uploadAssignment(fd);

    if (result.success) {
      router.push("/dashboard?uploaded=1");
    } else {
      setError(result.error ?? "Upload failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role info banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-brand-700">
        Your limit: <strong>{limits.maxFileSizeMB} MB per file</strong> ·{" "}
        <strong>{limits.maxTotalFiles} total files</strong>
        {role === "NURD" && " ⚡ Nurd"}
      </div>

      {/* File drop zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment File <span className="text-red-500">*</span>
        </label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <svg className="h-10 w-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Click to choose a file</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, TXT · Max {limits.maxFileSizeMB} MB</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="e.g. DBMS Assignment Unit 3 – Normalization"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Brief description of what this assignment covers..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            name="subject"
            required
            placeholder="e.g. Database Management Systems"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <input
            name="course"
            placeholder="e.g. BTech CSE"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input
            name="semester"
            placeholder="e.g. 3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
          <input
            name="college"
            placeholder="e.g. IIT Bombay"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
          <input
            name="university"
            placeholder="e.g. Mumbai University"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category / Folder</label>
          <select
            name="folderId"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">None</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Admin will confirm the folder during review.</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="hover:text-brand-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Type tag and press Enter..."
            className="text-sm outline-none w-full"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Up to 10 tags. Press Enter or comma to add.</p>
      </div>

      {/* Terms agreement */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-amber-800">
            I confirm that I have the right to share this material and that it does not contain private,
            confidential, leaked exam answers, paid course content, or unauthorized copyrighted material.
            I understand that misuse may result in account suspension.
          </span>
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        disabled={!file || !agreed}
      >
        Submit for Review
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Your submission will be reviewed by a moderator before becoming public.
      </p>
    </form>
  );
}
