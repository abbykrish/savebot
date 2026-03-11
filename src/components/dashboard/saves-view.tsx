"use client";

import { QuickSave } from "@/components/dashboard/quick-save";
import { ReadingPane } from "@/components/dashboard/reading-pane";
import { SavesGrid } from "@/components/dashboard/saves-grid";
import { SearchBar } from "@/components/dashboard/search-bar";
import { useConfirm } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSaves } from "@/hooks/use-saves";
import { useSearch } from "@/hooks/use-search";
import { useDashboardContext } from "@/app/dashboard/layout";
import { Save } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FilterDropdown } from "./filter-dropdown";
import { ArrowDownUp, Highlighter, Menu } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type ReadFilter = "all" | "read" | "unread";
type SortOption = "newest" | "oldest" | "title-asc" | "title-desc" | "site";

interface SavesViewProps {
  folderId?: string | null;
  sourceType?: string | null;
  showArchived?: boolean;
  showFavorites?: boolean;
  emptyMessage?: string;
}

export function SavesView({
  folderId,
  sourceType,
  showArchived,
  showFavorites,
  emptyMessage,
}: SavesViewProps) {
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [highlightFilter, setHighlightFilter] = useState(false);
  const { selectedTagId, allTags, refetchTags, createTag, addTagToSave, removeTagFromSave, folders, selectedFolderId, toggleSidebar } = useDashboardContext();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // Look up the selected folder's tag_ids for dynamic filtering
  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === (folderId ?? selectedFolderId)),
    [folders, folderId, selectedFolderId]
  );
  const folderTagIds = selectedFolder?.tag_ids;

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
  } = useSaves({ folderId: effectiveFolderId, folderTagIds, tagId: selectedTagId, sourceType, hasHighlights: highlightFilter, showArchived, showFavorites });

  const {
    results: searchResults,
    loading: searchLoading,
    query: searchQuery,
    search,
    clear: clearSearch,
  } = useSearch();

  const filteredSaves = useMemo(() => {
    let result = saves;
    if (readFilter === "unread") result = result.filter((s) => !s.is_read);
    if (readFilter === "read") result = result.filter((s) => s.is_read);

    if (sortBy !== "newest") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "site":
            return (a.site_name || "").localeCompare(b.site_name || "");
          default:
            return 0;
        }
      });
    }

    return result;
  }, [saves, readFilter, sortBy]);

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
        const res = await fetch("/api/process-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ save_id: saveId }),
        });
        if (!res.ok) throw new Error("AI processing failed");
        toast("AI summary generated");
        refetchSaves();
        refetchTags();
      } catch (err) {
        console.error("AI processing failed:", err);
        toast("AI processing failed. Try again.", "error");
        refetchSaves();
      }
    },
    [refetchSaves, refetchTags, toast]
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
    const ok = await confirm({
      title: "Delete save",
      message: "This save will be permanently deleted. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    if (selectedSaveId === id) setSelectedSaveId(null);
    await deleteSave(id);
    toast("Save deleted");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="flex flex-wrap items-center gap-3 px-3 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-[180px] max-w-md">
          <SearchBar onSearch={search} onClear={clearSearch} />
        </div>
        <QuickSave onSaved={() => { refetchSaves(); refetchTags(); }} />
        <FilterDropdown
          value={readFilter}
          onChange={setReadFilter}
          options={[
            { value: "all", label: "All", count: saves.length },
            { value: "unread", label: "Unread", count: unreadCount },
            { value: "read", label: "Read", count: readCount },
          ]}
        />
        <button
          onClick={() => setHighlightFilter(!highlightFilter)}
          title={highlightFilter ? "Show all saves" : "Show only highlighted"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors",
            highlightFilter
              ? "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-600"
              : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          )}
        >
          <Highlighter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Highlights</span>
        </button>
        <FilterDropdown
          value={sortBy}
          onChange={setSortBy}
          icon={<ArrowDownUp className="h-3.5 w-3.5 text-neutral-400" />}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "title-asc", label: "Title A–Z" },
            { value: "title-desc", label: "Title Z–A" },
            { value: "site", label: "Site" },
          ]}
        />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto p-3 sm:p-6 ${selectedSave ? "hidden lg:block" : ""}`}
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
            emptyMessage={
              searchQuery
                ? `No results for "${searchQuery}"`
                : readFilter !== "all"
                  ? `No ${readFilter} saves`
                  : emptyMessage
            }
          />
        </div>

        {selectedSave && (
          <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
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
