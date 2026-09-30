"use client";

import { useState } from "react";

type Category = {
  id: string;
  name: string;
  type: string;
  files?: { id: string; fileName: string }[];
  _count?: { files: number };
};

type Classroom = {
  id: string;
  name: string;
  categories: Category[];
};

export function ClassroomDisplay({ classroom }: { classroom: Classroom }) {
  const [view, setView] = useState<"none" | "lab" | "assignment">("none");

  const labs = classroom.categories.filter((c) => c.type === "lab");
  const assignments = classroom.categories.filter((c) => c.type === "assignment");

  const renderCategoryItem = (item: Category) => {
    const hasFiles = item.files && item.files.length > 0;
    
    return (
      <div
        key={item.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all gap-3"
      >
        <span className="text-sm font-bold text-gray-900">
          {item.name}
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          {!hasFiles ? (
            <span className="text-[10px] text-gray-400">Empty</span>
          ) : (
            item.files!.map((file, idx) => (
              <a
                key={file.id}
                href={`/api/file/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold transition-colors ${
                  item.type === "lab"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
                title={file.fileName}
              >
                PDF {idx + 1}
              </a>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
            🏫
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{classroom.name}</h3>
            <p className="text-xs text-gray-500">
              {labs.length} labs · {assignments.length} assignments
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setView(view === "lab" ? "none" : "lab")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              view === "lab" 
                ? "bg-amber-100 text-amber-900 border-2 border-amber-300" 
                : "bg-amber-50 text-amber-700 border-2 border-transparent hover:bg-amber-100"
            }`}
          >
            🧪 Labs
          </button>
          <button
            onClick={() => setView(view === "assignment" ? "none" : "assignment")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              view === "assignment" 
                ? "bg-blue-100 text-blue-900 border-2 border-blue-300" 
                : "bg-blue-50 text-blue-700 border-2 border-transparent hover:bg-blue-100"
            }`}
          >
            📘 Assignments
          </button>
        </div>
      </div>

      {/* Content */}
      {view !== "none" && (
        <div className="p-5 animate-fade-in">
          {view === "lab" && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                🧪 Lab Experiments
              </h4>
              {labs.length === 0 ? (
                <p className="text-xs text-amber-700/60 italic">No lab experiments added yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {labs.map(renderCategoryItem)}
                </div>
              )}
            </div>
          )}

          {view === "assignment" && (
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1.5">
                📘 Class Assignments
              </h4>
              {assignments.length === 0 ? (
                <p className="text-xs text-blue-700/60 italic">No assignments added yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {assignments.map(renderCategoryItem)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
