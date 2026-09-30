"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryData {
  id: string;
  name: string;
  type: string;
  classroomId: string;
  createdAt: string;
  updatedAt: string;
  _count: { files: number };
}

interface ClassroomData {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  categories: CategoryData[];
}

interface ClassroomManagerProps {
  initialClassrooms: ClassroomData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassroomManager({ initialClassrooms }: ClassroomManagerProps) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomData[]>(initialClassrooms);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    initialClassrooms[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [modal, setModal] = useState<{
    type: "add-classroom" | "rename-classroom" | "add-category" | "rename-category" | "delete-confirm" | null;
    target?: ClassroomData | CategoryData;
    categoryType?: "lab" | "assignment";
  }>({ type: null });
  const [inputValue, setInputValue] = useState("");
  const [deleteForce, setDeleteForce] = useState(false);

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId) ?? null;
  const labs = selectedClassroom?.categories.filter((c) => c.type === "lab") ?? [];
  const assignments = selectedClassroom?.categories.filter((c) => c.type === "assignment") ?? [];

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }

  function openModal(
    type: typeof modal.type,
    target?: ClassroomData | CategoryData,
    categoryType?: "lab" | "assignment"
  ) {
    setModal({ type, target, categoryType });
    setInputValue(
      type === "rename-classroom"
        ? (target as ClassroomData)?.name ?? ""
        : type === "rename-category"
        ? (target as CategoryData)?.name ?? ""
        : ""
    );
    setDeleteForce(false);
    setError("");
  }

  function closeModal() {
    setModal({ type: null });
    setInputValue("");
    setDeleteForce(false);
  }

  // ─── Classroom CRUD ────────────────────────────────────────────────────────

  async function handleAddClassroom() {
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ classroom: ClassroomData }>("/api/admin/classrooms", {
        method: "POST",
        body: JSON.stringify({ name: inputValue.trim() }),
      });
      setClassrooms((prev) => [...prev, data.classroom].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedClassroomId(data.classroom.id);
      showSuccess(`Classroom "${data.classroom.name}" created!`);
      closeModal();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRenameClassroom() {
    const target = modal.target as ClassroomData;
    if (!inputValue.trim() || !target) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ classroom: ClassroomData }>(`/api/admin/classrooms/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: inputValue.trim() }),
      });
      setClassrooms((prev) =>
        prev.map((c) => (c.id === target.id ? { ...data.classroom, categories: c.categories } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      showSuccess(`Renamed to "${data.classroom.name}"`);
      closeModal();
      router.refresh();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClassroom(classroom: ClassroomData) {
    setLoading(true);
    try {
      await apiFetch(`/api/admin/classrooms/${classroom.id}`, { method: "DELETE" });
      setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
      if (selectedClassroomId === classroom.id) {
        setSelectedClassroomId(classrooms.find((c) => c.id !== classroom.id)?.id ?? null);
      }
      showSuccess(`Classroom "${classroom.name}" deleted.`);
      closeModal();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  async function handleAddCategory() {
    if (!inputValue.trim() || !selectedClassroomId || !modal.categoryType) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ category: CategoryData }>(
        `/api/admin/classrooms/${selectedClassroomId}/categories`,
        {
          method: "POST",
          body: JSON.stringify({ name: inputValue.trim(), type: modal.categoryType }),
        }
      );
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === selectedClassroomId
            ? {
                ...c,
                categories: [...c.categories, data.category].sort((a, b) => {
                  if (a.type !== b.type) return a.type.localeCompare(b.type);
                  return a.name.localeCompare(b.name);
                }),
              }
            : c
        )
      );
      showSuccess(`"${data.category.name}" added!`);
      closeModal();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRenameCategory() {
    const target = modal.target as CategoryData;
    if (!inputValue.trim() || !target) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ category: CategoryData }>(
        `/api/admin/classrooms/${target.classroomId}/categories/${target.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: inputValue.trim() }),
        }
      );
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === target.classroomId
            ? {
                ...c,
                categories: c.categories.map((cat) =>
                  cat.id === target.id ? { ...cat, name: data.category.name } : cat
                ),
              }
            : c
        )
      );
      showSuccess(`Renamed to "${data.category.name}"`);
      closeModal();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(cat: CategoryData) {
    setLoading(true);
    try {
      const url = `/api/admin/classrooms/${cat.classroomId}/categories/${cat.id}${deleteForce ? "?force=true" : ""}`;
      await apiFetch(url, { method: "DELETE" });
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === cat.classroomId
            ? { ...c, categories: c.categories.filter((x) => x.id !== cat.id) }
            : c
        )
      );
      showSuccess(`"${cat.name}" deleted.`);
      closeModal();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("file") && !deleteForce) {
        // Offer force delete
        setError(msg + " Enable 'Force delete' below to proceed.");
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Global success/error toasts */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3 font-medium">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3 font-medium">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ─── Left: Classroom List ─────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Classrooms
            </h2>
            <button
              onClick={() => openModal("add-classroom")}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              + Add
            </button>
          </div>

          {classrooms.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">
              No classrooms yet. Add one!
            </p>
          ) : (
            <div className="space-y-1">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className={`group w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    selectedClassroomId === classroom.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedClassroomId(classroom.id)}
                >
                  <span className="truncate">{classroom.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("rename-classroom", classroom);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        selectedClassroomId === classroom.id
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("delete-confirm", classroom);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        selectedClassroomId === classroom.id
                          ? "bg-white/20 hover:bg-red-400/80 text-white"
                          : "bg-gray-200 hover:bg-red-100 text-red-600"
                      }`}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right: Category Manager ──────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedClassroom ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
              <p className="text-4xl mb-2">🏫</p>
              <p className="font-semibold">Select a classroom to manage its labs and assignments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Labs Column */}
              <CategoryColumn
                title="Lab Experiments"
                icon="🧪"
                type="lab"
                items={labs}
                colorClass="amber"
                onAdd={() => openModal("add-category", undefined, "lab")}
                onRename={(cat) => openModal("rename-category", cat)}
                onDelete={(cat) => openModal("delete-confirm", cat)}
              />

              {/* Assignments Column */}
              <CategoryColumn
                title="Class Assignments"
                icon="📘"
                type="assignment"
                items={assignments}
                colorClass="blue"
                onAdd={() => openModal("add-category", undefined, "assignment")}
                onRename={(cat) => openModal("rename-category", cat)}
                onDelete={(cat) => openModal("delete-confirm", cat)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal ─────────────────────────────────────────────── */}
      {modal.type && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* ADD CLASSROOM */}
            {modal.type === "add-classroom" && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Add Classroom</h3>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Classroom 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                  onKeyDown={(e) => e.key === "Enter" && handleAddClassroom()}
                />
                <ModalButtons
                  onCancel={closeModal}
                  onConfirm={handleAddClassroom}
                  loading={loading}
                  confirmText="Create Classroom"
                />
              </>
            )}

            {/* RENAME CLASSROOM */}
            {modal.type === "rename-classroom" && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ Rename Classroom</h3>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="New classroom name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                  onKeyDown={(e) => e.key === "Enter" && handleRenameClassroom()}
                />
                <ModalButtons
                  onCancel={closeModal}
                  onConfirm={handleRenameClassroom}
                  loading={loading}
                  confirmText="Save"
                />
              </>
            )}

            {/* ADD CATEGORY */}
            {modal.type === "add-category" && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ➕ Add {modal.categoryType === "lab" ? "Lab Experiment" : "Assignment"}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  For: <strong>{selectedClassroom?.name}</strong>
                </p>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    modal.categoryType === "lab"
                      ? "e.g. Experiment 4"
                      : "e.g. Assignment 2"
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <ModalButtons
                  onCancel={closeModal}
                  onConfirm={handleAddCategory}
                  loading={loading}
                  confirmText="Add"
                />
              </>
            )}

            {/* RENAME CATEGORY */}
            {modal.type === "rename-category" && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ Rename Item</h3>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="New name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                  onKeyDown={(e) => e.key === "Enter" && handleRenameCategory()}
                />
                <ModalButtons
                  onCancel={closeModal}
                  onConfirm={handleRenameCategory}
                  loading={loading}
                  confirmText="Rename"
                />
              </>
            )}

            {/* DELETE CONFIRM */}
            {modal.type === "delete-confirm" && modal.target && (
              <DeleteConfirmModal
                target={modal.target}
                isClassroom={"categories" in modal.target}
                deleteForce={deleteForce}
                setDeleteForce={setDeleteForce}
                loading={loading}
                error={error}
                onCancel={closeModal}
                onConfirm={() => {
                  if ("categories" in modal.target!) {
                    handleDeleteClassroom(modal.target as ClassroomData);
                  } else {
                    handleDeleteCategory(modal.target as CategoryData);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Column ─────────────────────────────────────────────────────────

function CategoryColumn({
  title,
  icon,
  type,
  items,
  colorClass,
  onAdd,
  onRename,
  onDelete,
}: {
  title: string;
  icon: string;
  type: string;
  items: CategoryData[];
  colorClass: "amber" | "blue";
  onAdd: () => void;
  onRename: (cat: CategoryData) => void;
  onDelete: (cat: CategoryData) => void;
}) {
  const bg = colorClass === "amber" ? "bg-amber-50/50 border-amber-200/60" : "bg-blue-50/50 border-blue-200/60";
  const headerColor = colorClass === "amber" ? "text-amber-900" : "text-blue-900";

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
        <button
          onClick={onAdd}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
        >
          + Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400">
          No {type === "lab" ? "lab experiments" : "assignments"} added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center justify-between p-3 border rounded-xl text-sm font-semibold text-gray-800 ${bg}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400">•</span>
                <span className="truncate">{item.name}</span>
                {item._count.files > 0 && (
                  <span className="text-[10px] text-gray-400 shrink-0">
                    ({item._count.files} file{item._count.files !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <button
                  onClick={() => onRename(item)}
                  className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Buttons ────────────────────────────────────────────────────────────

function ModalButtons({
  onCancel,
  onConfirm,
  loading,
  confirmText = "Confirm",
  danger = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmText?: string;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
          danger
            ? "bg-red-600 hover:bg-red-700"
            : "bg-brand-600 hover:bg-brand-700"
        } disabled:opacity-60`}
      >
        {loading ? "..." : confirmText}
      </button>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  target,
  isClassroom,
  deleteForce,
  setDeleteForce,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  target: ClassroomData | CategoryData;
  isClassroom: boolean;
  deleteForce: boolean;
  setDeleteForce: (v: boolean) => void;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fileCount = isClassroom
    ? (target as ClassroomData).categories.reduce((s, c) => s + c._count.files, 0)
    : (target as CategoryData)._count.files;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">
          🗑️
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-gray-900">
          {isClassroom ? "🏫 Classroom" : "📁 Category"}:{" "}
          <span className="text-brand-700">{target.name}</span>
        </p>
        {fileCount > 0 && (
          <p className="text-sm text-amber-700 mt-2 font-medium">
            ⚠️ Warning: This {isClassroom ? "classroom" : "category"} has{" "}
            <strong>{fileCount}</strong> uploaded file(s) in Supabase Storage.
          </p>
        )}
      </div>

      {fileCount > 0 && !isClassroom && (
        <label className="flex items-center gap-2 text-sm text-red-700 font-medium mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteForce}
            onChange={(e) => setDeleteForce(e.target.checked)}
            className="rounded border-gray-300 text-red-600 h-4 w-4"
          />
          Force delete — also delete all {fileCount} file(s) from Supabase Storage
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-3">{error}</p>
      )}

      <ModalButtons
        onCancel={onCancel}
        onConfirm={onConfirm}
        loading={loading}
        confirmText={fileCount > 0 && !isClassroom && !deleteForce ? "Cannot delete (files exist)" : "Delete"}
        danger
      />
    </>
  );
}
