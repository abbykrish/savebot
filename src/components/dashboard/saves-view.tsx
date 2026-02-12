"use client";

import { ReadingPane } from "@/components/dashboard/reading-pane";
import { SavesGrid } from "@/components/dashboard/saves-grid";
import { SearchBar } from "@/components/dashboard/search-bar";
import { useSaves } from "@/hooks/use-saves";
import { useSearch } from "@/hooks/use-search";
import { useDashboardContext } from "@/app/dashboard/layout";
import { Save } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";

type ReadFilter = "all" | "read" | "unread";

interface SavesViewProps {
  folderId?: string | null;
  sourceType?: string | null;
  showArchived?: boolean;
  showFavorites?: boolean;
}

export function SavesView({
  folderId,
  sourceType,
  showArchived,
  showFavorites,
}: SavesViewProps) {
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const { selectedTagId, allTags, refetchTags, createTag, addTagToSave, removeTagFromSave, folders, selectedFolderId } = useDashboardContext();

  // Look up the selected folder's tag_ids for dynamic filtering
  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === (folderId ?? selectedFolderId)),
    [folders, folderId, selectedFolderId]
  );
  const folderTagIds = selectedFolder?.tag_ids;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const effectiveFolderId = folderId ?? selectedFolderId;

  const {
    saves,
    loading: savesLoading,
    refetch: refetchSaves,
    deleteSave,
    toggleFavorite,
    toggleArchive,
    toggleRead,
    updateNotes,
    setFolderId,
  } = useSaves({ folderId: effectiveFolderId, folderTagIds, tagId: selectedTagId, sourceType, showArchived, showFavorites });

  const {
    results: searchResults,
    loading: searchLoading,
    query: searchQuery,
    search,
    clear: clearSearch,
  } = useSearch();

  const filteredSaves = useMemo(() => {
    if (readFilter === "unread") return saves.filter((s) => !s.is_read);
    if (readFilter === "read") return saves.filter((s) => s.is_read);
    return saves;
  }, [saves, readFilter]);

  const readCount = useMemo(() => saves.filter((s) => s.is_read).length, [saves]);
  const unreadCount = useMemo(() => saves.filter((s) => !s.is_read).length, [saves]);

  const displayedSaves = searchQuery ? searchResults : filteredSaves;
  const isLoading = searchQuery ? searchLoading : savesLoading;

  const selectedSave = useMemo(
    () => displayedSaves.find((s: Save) => s.id === selectedSaveId) || null,
    [displayedSaves, selectedSaveId]
  );

  const handleProcessAi = useCallback(
    async (saveId: string) => {
      try {
        await fetch("/api/process-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ save_id: saveId }),
        });
        refetchSaves();
        refetchTags();
      } catch (err) {
        console.error("AI processing failed:", err);
      }
    },
    [refetchSaves, refetchTags]
  );

  const handleAddTag = useCallback(
    async (saveId: string, tagId: string) => {
      await addTagToSave(saveId, tagId);
      refetchSaves();
    },
    [addTagToSave, refetchSaves]
  );

  const handleRemoveTag = useCallback(
    async (saveId: string, tagId: string) => {
      await removeTagFromSave(saveId, tagId);
      refetchSaves();
      refetchTags();
    },
    [removeTagFromSave, refetchSaves, refetchTags]
  );

  const handleCreateAndAddTag = useCallback(
    async (saveId: string, name: string) => {
      const tag = await createTag(name);
      if (tag) {
        await addTagToSave(saveId, tag.id);
        refetchSaves();
      }
    },
    [createTag, addTagToSave, refetchSaves]
  );

  const handleDelete = async (id: string) => {
    if (selectedSaveId === id) setSelectedSaveId(null);
    await deleteSave(id);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex-1 max-w-md">
          <SearchBar onSearch={search} onClear={clearSearch} />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {readFilter === "all" ? "All" : readFilter === "read" ? "Read" : "Unread"}
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
              {([
                { value: "all" as ReadFilter, label: "All", count: saves.length },
                { value: "unread" as ReadFilter, label: "Unread", count: unreadCount },
                { value: "read" as ReadFilter, label: "Read", count: readCount },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setReadFilter(opt.value); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between first:rounded-t-lg last:rounded-b-lg ${
                    readFilter === opt.value
                      ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  {opt.label}
                  <span className="text-xs text-neutral-400">{opt.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto p-6 ${selectedSave ? "hidden lg:block" : ""}`}
        >
          <SavesGrid
            saves={displayedSaves}
            loading={isLoading}
            selectedId={selectedSaveId}
            onSelect={setSelectedSaveId}
            onToggleFavorite={toggleFavorite}
            onToggleArchive={toggleArchive}
            onToggleRead={toggleRead}
            onDelete={handleDelete}
          />
        </div>

        {selectedSave && (
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
            <ReadingPane
              save={selectedSave}
              allTags={allTags}
              folders={folders}
              onClose={() => setSelectedSaveId(null)}
              onToggleFavorite={() => toggleFavorite(selectedSave.id)}
              onToggleArchive={() => toggleArchive(selectedSave.id)}
              onToggleRead={() => toggleRead(selectedSave.id)}
              onUpdateNotes={(notes) => updateNotes(selectedSave.id, notes)}
              onProcessAi={() => handleProcessAi(selectedSave.id)}
              onAddTag={(tagId) => handleAddTag(selectedSave.id, tagId)}
              onRemoveTag={(tagId) => handleRemoveTag(selectedSave.id, tagId)}
              onCreateAndAddTag={(name) => handleCreateAndAddTag(selectedSave.id, name)}
              onSetFolder={(fId) => setFolderId(selectedSave.id, fId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
