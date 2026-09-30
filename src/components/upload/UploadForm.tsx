"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Classroom {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  classroomId: string;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step < current
                ? "bg-brand-600 text-white"
                : step === current
                ? "bg-brand-600 text-white ring-2 ring-brand-300 ring-offset-1"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {step < current ? "✓" : step}
          </div>
          {step < total && (
            <div
              className={`h-0.5 w-6 rounded-full transition-colors ${
                step < current ? "bg-brand-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Upload Form ─────────────────────────────────────────────────────────

export function UploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  // Hierarchy state
  const [step, setStep] = useState(1); // 1=classroom, 2=type, 3=item, 4=file
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [selectedType, setSelectedType] = useState<"lab" | "assignment" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // File state
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load classrooms on mount
  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((data) => setClassrooms(data.classrooms ?? []))
      .catch(() => setClassrooms([]))
      .finally(() => setLoadingClassrooms(false));
  }, []);

  // Load categories when classroom + type are selected
  useEffect(() => {
    if (!selectedClassroom || !selectedType) {
      setCategories([]);
      return;
    }
    setLoadingCategories(true);
    fetch(`/api/classrooms/${selectedClassroom.id}/categories?type=${selectedType}`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [selectedClassroom, selectedType]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const oversizedFiles = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`⚠️ File "${oversizedFiles[0].name}" exceeds the 5MB size limit. Please choose a smaller file.`);
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFiles(selected.slice(0, 6)); // max 6 files
    setError("");
  }

  function selectClassroom(classroom: Classroom) {
    setSelectedClassroom(classroom);
    setSelectedType(null);
    setSelectedCategory(null);
    setCategories([]);
    setStep(2);
  }

  function selectType(type: "lab" | "assignment") {
    setSelectedType(type);
    setSelectedCategory(null);
    setStep(3);
  }

  function selectCategory(cat: Category) {
    setSelectedCategory(cat);
    setStep(4);
  }

  function goBack(toStep: number) {
    setStep(toStep);
    if (toStep <= 1) {
      setSelectedClassroom(null);
      setSelectedType(null);
      setSelectedCategory(null);
    } else if (toStep <= 2) {
      setSelectedType(null);
      setSelectedCategory(null);
    } else if (toStep <= 3) {
      setSelectedCategory(null);
    }
    setFiles([]);
    setError("");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !selectedClassroom || !selectedType || !selectedCategory) {
      setError("Please complete all steps before uploading.");
      return;
    }

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`⚠️ File "${oversized.name}" exceeds the 5MB size limit (${formatBytes(oversized.size)}).`);
      return;
    }

    setLoading(true);
    setError("");

    let hasError = false;

    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("classroomId", selectedClassroom.id);
      fd.append("categoryId", selectedCategory.id);

      try {
        const res = await fetch("/api/classrooms/upload", {
          method: "POST",
          body: fd,
        });

        if (res.status === 413) {
          setError(`File size is too large for the server (HTTP 413). Max file size is 5MB.`);
          hasError = true;
          break;
        }

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Upload failed for some files.");
          hasError = true;
          break;
        }
      } catch {
        setError("Network error. Please try again.");
        hasError = true;
        break;
      }
    }

    setLoading(false);

    if (!hasError) {
      setSuccess(
        `✅ Files uploaded successfully to ${selectedClassroom.name} → ${selectedType === "lab" ? "Lab" : "Assignment"} → ${selectedCategory.name}`
      );
      setFiles([]);
      setSelectedClassroom(null);
      setSelectedType(null);
      setSelectedCategory(null);
      setStep(1);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <StepIndicator current={step} total={4} />

      {/* Breadcrumb */}
      {(selectedClassroom || selectedType || selectedCategory) && (
        <div className="flex items-center flex-wrap gap-1 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
          <button
            type="button"
            onClick={() => goBack(1)}
            className="hover:text-brand-600 font-medium"
          >
            Choose Classroom
          </button>
          {selectedClassroom && (
            <>
              <span>›</span>
              <button
                type="button"
                onClick={() => goBack(2)}
                className="hover:text-brand-600 font-semibold text-gray-700"
              >
                {selectedClassroom.name}
              </button>
            </>
          )}
          {selectedType && (
            <>
              <span>›</span>
              <button
                type="button"
                onClick={() => goBack(3)}
                className="hover:text-brand-600 font-semibold text-gray-700 capitalize"
              >
                {selectedType === "lab" ? "Lab" : "Assignment"}
              </button>
            </>
          )}
          {selectedCategory && (
            <>
              <span>›</span>
              <span className="font-semibold text-brand-700">{selectedCategory.name}</span>
            </>
          )}
        </div>
      )}

      {/* ─── Step 1: Choose Classroom ─── */}
      {step === 1 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">1</span>
            Choose Classroom
          </h3>

          {loadingClassrooms ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading classrooms...</div>
          ) : classrooms.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-amber-50 rounded-2xl border border-dashed border-amber-200">
              <p className="font-semibold">No classrooms available yet.</p>
              <p className="text-xs mt-1">An admin must create classrooms before you can upload.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classrooms.map((classroom) => (
                <button
                  key={classroom.id}
                  type="button"
                  onClick={() => selectClassroom(classroom)}
                  className="group border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 rounded-2xl p-4 text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                      🏫
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                      {classroom.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Choose Type ─── */}
      {step === 2 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">2</span>
            Choose Type
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => selectType("lab")}
              className="group border-2 border-amber-200 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50 rounded-2xl p-6 text-center transition-all"
            >
              <div className="text-3xl mb-2">🧪</div>
              <div className="font-bold text-amber-900">LAB</div>
              <div className="text-xs text-amber-700 mt-0.5">Lab Experiments</div>
            </button>
            <button
              type="button"
              onClick={() => selectType("assignment")}
              className="group border-2 border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all"
            >
              <div className="text-3xl mb-2">📘</div>
              <div className="font-bold text-blue-900">ASSIGNMENT</div>
              <div className="text-xs text-blue-700 mt-0.5">Class Assignments</div>
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Choose Item ─── */}
      {step === 3 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">3</span>
            {selectedType === "lab" ? "Choose Experiment" : "Choose Assignment"}
          </h3>

          {loadingCategories ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="font-semibold">
                No {selectedType === "lab" ? "lab experiments" : "assignments"} available for {selectedClassroom?.name}.
              </p>
              <p className="text-xs mt-1">An admin must add items to this classroom first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={`group border-2 rounded-xl px-4 py-3 text-left font-semibold text-sm transition-all ${
                    selectedType === "lab"
                      ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 text-amber-900"
                      : "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-900"
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Step 4: Upload File ─── */}
      {step === 4 && (
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">4</span>
            Upload File
          </h3>

          {/* Summary */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-brand-800 mb-1.5">📋 Upload Destination</p>
            <div className="space-y-0.5 text-brand-700 text-xs">
              <p>🏫 <strong>Classroom:</strong> {selectedClassroom?.name}</p>
              <p>{selectedType === "lab" ? "🧪" : "📘"} <strong>Type:</strong> {selectedType === "lab" ? "Lab Experiment" : "Assignment"}</p>
              <p>📁 <strong>Item:</strong> {selectedCategory?.name}</p>
            </div>
          </div>

          {/* File dropzone */}
          <div>
            <div
              className="border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50/50 hover:bg-brand-50/30 rounded-2xl p-8 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {files.length > 0 ? (
                <div>
                  <div className="text-3xl mb-1">📄</div>
                  <p className="font-semibold text-gray-900">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                  <p className="text-xs text-brand-600 font-medium mt-0.5">
                    {files.map(f => f.name).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles([]);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="mt-3 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    Clear Files
                  </button>
                </div>
              ) : (
                <>
                  <svg className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">Click to choose files (Max 6, up to 5MB each)</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, TXT</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            loading={loading}
            disabled={files.length === 0}
          >
            Upload File{files.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Error for non-step-4 */}
      {error && step !== 4 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">
          {error}
        </div>
      )}
    </form>
  );
}
