"use client";

import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/modal";
import { Tag } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface TagManagerProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
  onCreateTag: (name: string) => void;
  onDeleteTag: (id: string) => void;
}

export function TagManager({
  tags,
  selectedTagId,
  onSelectTag,
  onCreateTag,
  onDeleteTag,
}: TagManagerProps) {
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim());
      setNewTagName("");
      setIsAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Tags
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-1 mb-2">
          <input
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsAdding(false);
            }}
            placeholder="Tag name"
            className="flex-1 text-xs px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() =>
              onSelectTag(selectedTagId === tag.id ? null : tag.id)
            }
            className="group relative"
          >
            <Badge
              color={tag.color || undefined}
              className={
                selectedTagId === tag.id
                  ? "ring-2 ring-blue-500 ring-offset-1"
                  : ""
              }
            >
              {tag.name}
              <span
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await confirm({
                    title: `Delete "${tag.name}"`,
                    message: "This tag will be removed from all saves.",
                    confirmLabel: "Delete",
                    variant: "danger",
                  });
                  if (ok) onDeleteTag(tag.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                role="button"
                aria-label={`Delete ${tag.name} tag`}
              >
                <X className="h-2.5 w-2.5 inline" />
              </span>
            </Badge>
          </button>
        ))}
        {tags.length === 0 && !isAdding && (
          <span className="text-xs text-neutral-400">No tags yet</span>
        )}
      </div>
    </div>
  );
}
