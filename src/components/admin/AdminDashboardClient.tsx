"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

interface AssignmentItem {
  id: string;
  title: string;
  subject: string;
  course?: string | null;
  fileSize: number;
  status: string;
  createdAt: Date | string;
}

interface AdminDashboardClientProps {
  stats: {
    totalPending: number;
    totalUploads: number;
    totalApproved: number;
    totalUsers: number;
  };
  subjects: string[];
  initialAssignments: AssignmentItem[];
}

export function AdminDashboardClient({
  stats,
  subjects: initialSubjects,
  initialAssignments,
}: AdminDashboardClientProps) {
  const [selectedSubject, setSelectedSubject] = useState(initialSubjects[0] || "Computer Science");
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [showAddModal, setShowAddModal] = useState<"Lab" | "Assignment" | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const subjectLabs = assignments.filter(
    (a) =>
      a.subject.toLowerCase() === selectedSubject.toLowerCase() &&
      (a.course?.toLowerCase().includes("lab") ||
        a.title.toLowerCase().includes("exp") ||
        a.title.toLowerCase().includes("lab"))
  );

  const subjectAssignments = assignments.filter(
    (a) =>
      a.subject.toLowerCase() === selectedSubject.toLowerCase() &&
      !(
        a.course?.toLowerCase().includes("lab") ||
        a.title.toLowerCase().includes("exp") ||
        a.title.toLowerCase().includes("lab")
      )
  );

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: AssignmentItem = {
      id: "temp-" + Date.now(),
      title: newTitle,
      subject: selectedSubject,
      course: showAddModal === "Lab" ? "Lab Experiment" : "Class Assignment",
      fileSize: 1024 * 500, // 500KB demo
      status: "APPROVED",
      createdAt: new Date().toISOString(),
    };

    setAssignments((prev) => [newItem, ...prev]);
    setNewTitle("");
    setShowAddModal(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Top Header & Stats Grid (Matching Wireframe 2 Top Half) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Total Pending</p>
          <p className="text-3xl font-extrabold mt-1">{stats.totalPending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-900">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Uploads</p>
          <p className="text-3xl font-extrabold mt-1">{stats.totalUploads}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-green-900">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700">Total Approved</p>
          <p className="text-3xl font-extrabold mt-1">{stats.totalApproved}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-purple-900">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Total Users</p>
          <p className="text-3xl font-extrabold mt-1">{stats.totalUsers}</p>
        </div>
      </div>

      {/* ─── Bottom Layout: Subject Sidebar + Lab & Assignment Columns (Matching Wireframe 2) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Admin Subject List (Subj 1, Subj 2, Subj 3...) */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
            Admin Subjects
          </h2>
          <div className="space-y-1">
            {initialSubjects.map((subj, idx) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                  selectedSubject === subj
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>Subj {idx + 1}: {subj}</span>
                <span className="text-xs opacity-75">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Lab Column & Assignment Column (Matching Wireframe 2 Bottom Half) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lab Section */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  <h3 className="font-bold text-gray-900">Lab Experiments</h3>
                </div>
                <button
                  onClick={() => setShowAddModal("Lab")}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                >
                  <span>+</span> Add Lab
                </button>
              </div>

              {subjectLabs.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No lab experiments added for {selectedSubject}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subjectLabs.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs font-semibold text-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded text-brand-600 h-4 w-4" />
                        <span>Exp {idx + 1}: {exp.title}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatBytes(exp.fileSize)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📘</span>
                  <h3 className="font-bold text-gray-900">Class Assignments</h3>
                </div>
                <button
                  onClick={() => setShowAddModal("Assignment")}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                >
                  <span>+</span> Add Assignment
                </button>
              </div>

              {subjectAssignments.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No class assignments added for {selectedSubject}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subjectAssignments.map((ass, idx) => (
                    <div
                      key={ass.id}
                      className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl text-xs font-semibold text-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded text-brand-600 h-4 w-4" />
                        <span>Ass {idx + 1}: {ass.title}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatBytes(ass.fileSize)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add Lab / Add Assignment */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Add New {showAddModal} to {selectedSubject}
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`e.g. ${showAddModal} 1`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                >
                  Save {showAddModal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
