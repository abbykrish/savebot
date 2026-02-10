"use client";

import { ReadingPane } from "@/components/dashboard/reading-pane";
import { SavesGrid } from "@/components/dashboard/saves-grid";
import { SearchBar } from "@/components/dashboard/search-bar";
import { useSaves } from "@/hooks/use-saves";
import { useSearch } from "@/hooks/use-search";
import { Save } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";

interface SavesViewProps {
  folderId?: string | null;
  tagId?: string | null;
  sourceType?: string | null;
  showArchived?: boolean;
  showFavorites?: boolean;
}

export function SavesView({
  folderId,
  tagId,
  sourceType,
  showArchived,
  showFavorites,
}: SavesViewProps) {
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);

  const {
    saves,
    loading: savesLoading,
    refetch: refetchSaves,
    deleteSave,
    toggleFavorite,
    toggleArchive,
    updateNotes,
  } = useSaves({ folderId, tagId, sourceType, showArchived, showFavorites });

  const {
    results: searchResults,
    loading: searchLoading,
    query: searchQuery,
    search,
    clear: clearSearch,
  } = useSearch();

  const displayedSaves = searchQuery ? searchResults : saves;
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
      } catch (err) {
        console.error("AI processing failed:", err);
      }
    },
    [refetchSaves]
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
        <span className="text-sm text-neutral-400">
          {displayedSaves.length} save{displayedSaves.length !== 1 ? "s" : ""}
        </span>
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
            onDelete={handleDelete}
          />
        </div>

        {selectedSave && (
          <div className="w-full lg:w-[480px] xl:w-[560px] shrink-0">
            <ReadingPane
              save={selectedSave}
              onClose={() => setSelectedSaveId(null)}
              onToggleFavorite={() => toggleFavorite(selectedSave.id)}
              onToggleArchive={() => toggleArchive(selectedSave.id)}
              onUpdateNotes={(notes) => updateNotes(selectedSave.id, notes)}
              onProcessAi={() => handleProcessAi(selectedSave.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
