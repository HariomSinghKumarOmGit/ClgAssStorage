"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createFolder, renameFolder, deleteFolder } from "@/server/actions/folders";

type FolderNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  _count: { assignments: number };
};

interface FolderManagerProps {
  folders: FolderNode[];
}

export function FolderManager({ folders }: FolderManagerProps) {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null); // null = top-level, parentId = subfolder
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  async function handleCreate(parentId?: string) {
    if (!newName.trim()) return;
    setLoading(true);
    const result = await createFolder(newName.trim(), parentId);
    if (result.success) {
      setCreating(null);
      setNewName("");
      router.refresh();
    } else {
      setError(result.error ?? "Failed");
    }
    setLoading(false);
  }

  async function handleRename(id: string) {
    if (!renameVal.trim()) return;
    setLoading(true);
    const result = await renameFolder(id, renameVal.trim());
    if (result.success) {
      setRenaming(null);
      router.refresh();
    } else {
      setError(result.error ?? "Failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete folder "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    const result = await deleteFolder(id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed");
    }
    setLoading(false);
  }

  function FolderItem({ folder, depth = 0 }: { folder: FolderNode; depth?: number }) {
    return (
      <div className={depth > 0 ? "ml-6 border-l-2 border-gray-100 pl-4" : ""}>
        <div className="flex items-center justify-between py-2.5 group">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📁</span>
            {renaming === folder.id ? (
              <div className="flex gap-2 items-center">
                <input
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(folder.id)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <Button size="sm" variant="primary" loading={loading} onClick={() => handleRename(folder.id)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-800">{folder.name}</span>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {folder._count.assignments} files
            </span>
          </div>

          {renaming !== folder.id && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setCreating(folder.id); setNewName(""); }}
                title="Add subfolder"
              >
                + Sub
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setRenaming(folder.id); setRenameVal(folder.name); }}
              >
                Rename
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(folder.id, folder.name)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* New subfolder input */}
        {creating === folder.id && (
          <div className="ml-6 mb-2 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate(folder.id)}
              placeholder="Subfolder name..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
            <Button size="sm" variant="primary" loading={loading} onClick={() => handleCreate(folder.id)}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(null)}>Cancel</Button>
          </div>
        )}

        {/* Children */}
        {folder.children.map((child) => (
          <FolderItem key={child.id} folder={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Folders</h2>
        {creating === null ? (
          <Button variant="primary" size="sm" onClick={() => { setCreating("root"); setNewName(""); }}>
            + New Category
          </Button>
        ) : creating === "root" && (
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Category name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
            <Button size="sm" variant="primary" loading={loading} onClick={() => handleCreate()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(null)}>Cancel</Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400">×</button>
        </div>
      )}

      {folders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No folders yet. Create your first category above.
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {folders.map((f) => (
            <FolderItem key={f.id} folder={f} />
          ))}
        </div>
      )}
    </div>
  );
}
