"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type Category = {
  id: string;
  name: string;
  type: string;
  files?: { id: string; fileName: string }[];
  _count?: { files: number };
};

export type Classroom = {
  id: string;
  name: string;
  categories: Category[];
};

export interface ClassroomDisplayProps {
  classroom: Classroom;
  activeView?: "none" | "lab" | "assignment";
  onToggleView?: (view: "lab" | "assignment") => void;
  onToggleDefault?: () => void;
}

export function ClassroomDisplay({
  classroom,
  activeView: controlledView,
  onToggleView: controlledOnToggleView,
  onToggleDefault: controlledOnToggleDefault,
}: ClassroomDisplayProps) {
  const [internalView, setInternalView] = useState<"none" | "lab" | "assignment">("none");

  const isControlled = controlledView !== undefined;
  const view = isControlled ? controlledView : internalView;

  const labs = classroom.categories.filter((c) => c.type === "lab");
  const assignments = classroom.categories.filter((c) => c.type === "assignment");

  const handleToggle = (newView: "lab" | "assignment") => {
    if (isControlled && controlledOnToggleView) {
      controlledOnToggleView(newView);
    } else {
      setInternalView((prev) => (prev === newView ? "none" : newView));
    }
  };

  const handleToggleDefault = () => {
    if (isControlled && controlledOnToggleDefault) {
      controlledOnToggleDefault();
    } else {
      setInternalView((prev) => {
        if (prev !== "none") return "none";
        return labs.length > 0 ? "lab" : "assignment";
      });
    }
  };

  const isOpen = view !== "none";

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
    <div
      className={`bg-white rounded-3xl border ${
        isOpen ? "border-brand-200 shadow-md ring-1 ring-brand-100/50" : "border-gray-200 shadow-sm"
      } overflow-hidden mb-6 transition-all duration-200`}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Title area (clickable to toggle open/close) */}
        <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
          <div
            onClick={handleToggleDefault}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0 flex-1"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggleDefault();
              }
            }}
            aria-expanded={isOpen}
            aria-label={`${classroom.name} classroom, ${isOpen ? "click to collapse" : "click to expand"}`}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              🏫
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors truncate">
                {classroom.name}
              </h3>
              <p className="text-xs text-gray-500">
                {labs.length} labs · {assignments.length} assignments
              </p>
            </div>
          </div>

          {/* Mobile Arrow Button */}
          <button
            type="button"
            onClick={handleToggleDefault}
            className="sm:hidden p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200 transition-all shrink-0"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse classroom" : "Expand classroom"}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-brand-600" : ""
              }`}
            />
          </button>
        </div>

        {/* Buttons (Labs, Assignments, PC Arrow button) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleToggle("lab")}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              view === "lab"
                ? "bg-amber-100 text-amber-900 border-2 border-amber-300 shadow-xs"
                : "bg-amber-50 text-amber-700 border-2 border-transparent hover:bg-amber-100"
            }`}
          >
            <span>🧪 Labs</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                view === "lab" ? "rotate-180" : "opacity-60"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => handleToggle("assignment")}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              view === "assignment"
                ? "bg-blue-100 text-blue-900 border-2 border-blue-300 shadow-xs"
                : "bg-blue-50 text-blue-700 border-2 border-transparent hover:bg-blue-100"
            }`}
          >
            <span>📘 Assignments</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                view === "assignment" ? "rotate-180" : "opacity-60"
              }`}
            />
          </button>

          {/* PC Arrow Button */}
          <button
            type="button"
            onClick={handleToggleDefault}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse classroom" : "Expand classroom"}
            title={isOpen ? "Collapse classroom" : "Expand classroom"}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-brand-600" : ""
              }`}
            />
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

export function ClassroomList({ classrooms }: { classrooms: Classroom[] }) {
  const [activeState, setActiveState] = useState<{
    id: string;
    view: "lab" | "assignment";
  } | null>(null);

  const handleToggleView = (classroomId: string, view: "lab" | "assignment") => {
    setActiveState((prev) => {
      // If clicking the same active tab on the same classroom, collapse it
      if (prev?.id === classroomId && prev?.view === view) {
        return null;
      }
      // Otherwise, open this classroom and tab (automatically collapsing any previously open classroom)
      return { id: classroomId, view };
    });
  };

  const handleToggleDefault = (classroom: Classroom) => {
    setActiveState((prev) => {
      // If this classroom is already open, collapse it
      if (prev?.id === classroom.id) {
        return null;
      }
      // Otherwise open default: labs if available, else assignments
      const hasLabs = classroom.categories.some((c) => c.type === "lab");
      const defaultView = hasLabs ? "lab" : "assignment";
      return { id: classroom.id, view: defaultView };
    });
  };

  return (
    <div className="space-y-6">
      {classrooms.map((classroom) => {
        const isCurrentActive = activeState?.id === classroom.id;
        const currentView = isCurrentActive ? activeState.view : "none";

        return (
          <ClassroomDisplay
            key={classroom.id}
            classroom={classroom}
            activeView={currentView}
            onToggleView={(view) => handleToggleView(classroom.id, view)}
            onToggleDefault={() => handleToggleDefault(classroom)}
          />
        );
      })}
    </div>
  );
}
