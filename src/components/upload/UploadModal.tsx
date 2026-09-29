"use client";

import { useState, useRef } from "react";
import { uploadAssignment } from "@/server/actions/upload";
import { formatBytes } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  defaultTitle?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  defaultSubject = "",
  defaultTitle = "",
}: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [subject, setSubject] = useState(defaultSubject);
  const [categoryType, setCategoryType] = useState<"Class Assignment" | "Lab Experiment">("Class Assignment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    const MAX_5MB = 5 * 1024 * 1024; // 5MB limit
    if (f && f.size > MAX_5MB) {
      setFile(null);
      setError("⚠️ File size exceeds 5MB restriction. Please upload a file under 5MB.");
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setFile(f);
      setError("");
      if (f && !title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("⚠️ File size exceeds 5MB restriction.");
      return;
    }

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title || file.name);
    fd.append("description", `${categoryType} submission for ${subject || "Academic Course"}`);
    fd.append("subject", subject || "General");
    fd.append("course", categoryType);
    fd.append("tags", JSON.stringify([categoryType.toLowerCase().replace(" ", "-"), subject.toLowerCase()]));

    const res = await uploadAssignment(fd);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        window.location.reload();
      }, 1200);
    } else {
      setError(res.error || "Upload failed. Please check file size under 5MB.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold text-lg">
            📤
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Assignment</h2>
            <p className="text-xs text-gray-500">Maximum file size restricted to 5 MB</p>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center my-4">
            <p className="font-semibold text-lg">✅ Upload Successful!</p>
            <p className="text-xs text-green-600 mt-1">Your submission has been published.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select File (Max 5MB) <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50 hover:bg-brand-50/30 rounded-xl p-5 text-center cursor-pointer transition-colors"
              >
                {file ? (
                  <div>
                    <span className="text-2xl">📄</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{file.name}</p>
                    <p className="text-xs text-brand-600 font-medium">{formatBytes(file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl text-gray-400">📂</span>
                    <p className="text-sm font-medium text-gray-700 mt-1">Click to select file</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, PPTX, TXT, ZIP, Images</p>
                    <span className="inline-block mt-2 text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      Strict 5MB Limit
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
            </div>

            {/* Title & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Experiment 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Submission Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryType("Class Assignment")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    categoryType === "Class Assignment"
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  📘 Class Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryType("Lab Experiment")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    categoryType === "Lab Experiment"
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🧪 Lab Experiment
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
