"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, Highlight, Save, Tag } from "@/lib/types";
import { safeHref } from "@/lib/safe-url";
import {
  Archive,
  Circle,
  CircleCheck,
  ExternalLink,
  FolderIcon,
  Heart,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { NotesEditor } from "./notes-editor";
import { useMemo, useRef, useState } from "react";

interface ReadingPaneProps {
  save: Save;
  allTags: Tag[];
  folders: Folder[];
  onClose: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onToggleRead: () => void;
  onUpdateNotes: (notes: string) => void;
  onProcessAi: () => void;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateAndAddTag: (name: string) => void;
  onSetFolder: (folderId: string | null) => void;
}

export function ReadingPane({
  save,
  allTags,
  folders,
  onClose,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onUpdateNotes,
  onProcessAi,
  onAddTag,
  onRemoveTag,
  onCreateAndAddTag,
  onSetFolder,
}: ReadingPaneProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleProcessAi = async () => {
    setAiLoading(true);
    onProcessAi();
    setTimeout(() => setAiLoading(false), 3000);
  };

  // Tags not already on this save, filtered by search
  const availableTags = useMemo(() => {
    const currentTagIds = new Set(save.tags?.map((t: Tag) => t.id) || []);
    return allTags
      .filter((t) => !currentTagIds.has(t.id))
      .filter((t) => t.name.includes(tagSearch.toLowerCase().trim()));
  }, [allTags, save.tags, tagSearch]);

  const trimmedSearch = tagSearch.toLowerCase().trim();
  const exactMatch = allTags.some((t) => t.name === trimmedSearch);

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === save.folder_id),
    [folders, save.folder_id]
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Heart
              className={
                save.is_favorite
                  ? "h-4 w-4 fill-red-500 text-red-500"
                  : "h-4 w-4 text-neutral-400"
              }
            />
          </button>
          <button
            onClick={onToggleArchive}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Archive className="h-4 w-4 text-neutral-400" />
          </button>
          <button
            onClick={onToggleRead}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={save.is_read ? "Mark as unread" : "Mark as read"}
          >
            {save.is_read ? (
              <CircleCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-neutral-400" />
            )}
          </button>
          <a
            href={safeHref(save.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="h-4 w-4 text-neutral-400" />
          </a>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="h-4 w-4 text-neutral-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-2">{save.title}</h1>

        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          {save.site_name && <span>{save.site_name}</span>}
          {save.author && (
            <>
              <span>&middot;</span>
              <span>{save.author}</span>
            </>
          )}
          {save.word_count && (
            <>
              <span>&middot;</span>
              <span>{Math.ceil(save.word_count / 200)} min read</span>
            </>
          )}
        </div>

        {/* Folder picker */}
        <div className="mb-4 relative">
          <button
            onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <FolderIcon className="h-3.5 w-3.5 text-neutral-400" />
            {currentFolder ? currentFolder.name : "Add to folder"}
          </button>
          {folderDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
              {currentFolder && (
                <button
                  onClick={() => {
                    onSetFolder(null);
                    setFolderDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500 border-b border-neutral-100 dark:border-neutral-800"
                >
                  Remove from {currentFolder.name}
                </button>
              )}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    if (save.folder_id === folder.id) {
                      onSetFolder(null);
                    } else {
                      onSetFolder(folder.id);
                    }
                    setFolderDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    save.folder_id === folder.id ? "font-medium text-blue-600" : ""
                  }`}
                >
                  <FolderIcon
                    className="h-3.5 w-3.5 shrink-0"
                    style={folder.color ? { color: folder.color } : undefined}
                  />
                  {folder.name}
                  {save.folder_id === folder.id && (
                    <span className="ml-auto text-blue-500">&#10003;</span>
                  )}
                </button>
              ))}
              {folders.length === 0 && (
                <p className="px-3 py-2 text-xs text-neutral-400">No folders</p>
              )}
            </div>
          )}
        </div>

        {/* Tags — editable */}
        <div className="mb-4">
          <div className="flex gap-1.5 flex-wrap items-center">
            {save.tags?.map((tag: Tag) => (
              <Badge key={tag.id} color={tag.color || undefined}>
                {tag.name}
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <div className="relative">
              <button
                onClick={() => {
                  setTagDropdownOpen(!tagDropdownOpen);
                  setTagSearch("");
                  setTimeout(() => tagInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add tag
              </button>
              {tagDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && trimmedSearch) {
                          if (!exactMatch) {
                            onCreateAndAddTag(trimmedSearch);
                          } else {
                            const existing = availableTags.find(
                              (t) => t.name === trimmedSearch
                            );
                            if (existing) onAddTag(existing.id);
                          }
                          setTagSearch("");
                          setTagDropdownOpen(false);
                        }
                        if (e.key === "Escape") setTagDropdownOpen(false);
                      }}
                      placeholder="Search or create..."
                      className="w-full px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onAddTag(tag.id);
                          setTagDropdownOpen(false);
                          setTagSearch("");
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        {tag.name}
                      </button>
                    ))}
                    {trimmedSearch && !exactMatch && (
                      <button
                        onClick={() => {
                          onCreateAndAddTag(trimmedSearch);
                          setTagDropdownOpen(false);
                          setTagSearch("");
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-blue-600"
                      >
                        Create &ldquo;{trimmedSearch}&rdquo;
                      </button>
                    )}
                    {availableTags.length === 0 && !trimmedSearch && (
                      <p className="px-3 py-1.5 text-xs text-neutral-400">
                        No more tags
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {save.summary && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Summary
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {save.summary}
            </p>
          </div>
        )}

        {/* Summarize button */}
        {!save.summary && save.ai_status !== "processing" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessAi}
            disabled={aiLoading}
            className="mb-4"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {aiLoading ? "Summarizing..." : "Summarize with AI"}
          </Button>
        )}

        {save.ai_status === "processing" && (
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is processing...
          </div>
        )}

        {/* Highlights */}
        {save.highlights && save.highlights.length > 0 && (
          <div className="space-y-3 mb-4">
            {save.highlights.map((hl: Highlight) => (
              <blockquote key={hl.id} className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-r-lg italic text-sm">
                <p>{hl.text}</p>
                <time className="block mt-2 text-[11px] text-neutral-400 not-italic">
                  {new Date(hl.created_at).toLocaleDateString()}
                </time>
              </blockquote>
            ))}
          </div>
        )}

        {/* Link card */}
        <a
          href={safeHref(save.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors mb-4"
        >
          <ExternalLink className="h-5 w-5 text-neutral-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{save.title}</p>
            <p className="text-xs text-neutral-400 truncate">
              {save.url}
            </p>
          </div>
        </a>
      </div>

      {/* Notes */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <NotesEditor
          notes={save.notes || ""}
          onSave={onUpdateNotes}
        />
      </div>
    </div>
  );
}
