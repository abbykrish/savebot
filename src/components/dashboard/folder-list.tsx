"use client";

import { Folder, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, FolderIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface FolderListProps {
  folders: Folder[];
  allTags: Tag[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string, tagIds: string[]) => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderList({
  folders,
  allTags,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateFolder(newName.trim(), selectedTagIds);
      setNewName("");
      setSelectedTagIds([]);
      setIsAdding(false);
      setShowTagPicker(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getTagName = (tagId: string) =>
    allTags.find((t) => t.id === tagId)?.name;

  const getTagColor = (tagId: string) =>
    allTags.find((t) => t.id === tagId)?.color || "#6b7280";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Folders
        </span>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setNewName("");
            setSelectedTagIds([]);
            setShowTagPicker(false);
          }}
          className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      {isAdding && (
        <div className="mb-2 space-y-1.5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showTagPicker) handleCreate();
              if (e.key === "Escape") {
                setIsAdding(false);
                setShowTagPicker(false);
              }
            }}
            placeholder="Folder name"
            className="w-full text-xs px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showTagPicker ? "Hide tags" : "Add tags to auto-collect"}
          </button>
          {showTagPicker && allTags.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                      selectedTagIds.includes(tag.id)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-neutral-300 dark:border-neutral-600"
                    )}
                  >
                    {selectedTagIds.includes(tag.id) && (
                      <Check className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || "#6b7280" }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          {selectedTagIds.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedTagIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: getTagColor(id) + "20",
                    color: getTagColor(id),
                  }}
                >
                  {getTagName(id)}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="w-full text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create folder
          </button>
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
            <div className="flex-1 min-w-0">
              <span className="truncate block">{folder.name}</span>
              {folder.tag_ids && folder.tag_ids.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-0.5">
                  {folder.tag_ids.map((tagId) => (
                    <span
                      key={tagId}
                      className="inline-block px-1 py-0 rounded text-[9px] font-medium"
                      style={{
                        backgroundColor: getTagColor(tagId) + "20",
                        color: getTagColor(tagId),
                      }}
                    >
                      {getTagName(tagId)}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
