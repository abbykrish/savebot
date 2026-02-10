"use client";

import { Folder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FolderIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface FolderListProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateFolder(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Folders
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-1 mb-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsAdding(false);
            }}
            placeholder="Folder name"
            className="flex-1 text-xs px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="space-y-0.5">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={cn(
              "group flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors",
              selectedFolderId === folder.id
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            )}
            onClick={() =>
              onSelectFolder(
                selectedFolderId === folder.id ? null : folder.id
              )
            }
          >
            <FolderIcon
              className="h-4 w-4 shrink-0"
              style={folder.color ? { color: folder.color } : undefined}
            />
            <span className="truncate flex-1">{folder.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <Trash2 className="h-3 w-3 text-neutral-400" />
            </button>
          </div>
        ))}
        {folders.length === 0 && !isAdding && (
          <span className="text-xs text-neutral-400 px-2">No folders</span>
        )}
      </div>
    </div>
  );
}
