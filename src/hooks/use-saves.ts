"use client";

import { createClient } from "@/lib/supabase/client";
import { Save } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

interface UseSavesOptions {
  folderId?: string | null;
  folderTagIds?: string[];
  tagId?: string | null;
  sourceType?: string | null;
  hasHighlights?: boolean;
  showArchived?: boolean;
  showFavorites?: boolean;
}

export function useSaves(options: UseSavesOptions = {}) {
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const folderTagIdsKey = options.folderTagIds?.join(",") || "";

  const fetchSaves = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("saves")
      .select("*, save_tags(tag_id, tags(*)), highlights(*)")
      .order("created_at", { ascending: false });

    // Only use DB-level folder_id filter when there are no folder tags
    // (pure one-off folder). When there are folder tags, we fetch all
    // non-archived saves and filter client-side.
    const hasFolderTags = options.folderTagIds && options.folderTagIds.length > 0;

    if (options.folderId && !hasFolderTags) {
      query = query.eq("folder_id", options.folderId);
    }

    if (options.sourceType) {
      query = query.eq("source_type", options.sourceType);
    }

    if (options.showArchived) {
      query = query.eq("is_archived", true);
    } else {
      query = query.eq("is_archived", false);
    }

    if (options.showFavorites) {
      query = query.eq("is_favorite", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch saves:", error);
      setSaves([]);
    } else {
      let results = data || [];

      // Tag-based filtering for selected tag in sidebar
      if (options.tagId) {
        results = results.filter((save: Record<string, unknown>) =>
          (save.save_tags as { tag_id: string }[])?.some(
            (st) => st.tag_id === options.tagId
          )
        );
      }

      // Map tags onto saves
      let mapped = results.map((save: Record<string, unknown>) => ({
        ...save,
        tags: (save.save_tags as { tags: unknown }[])?.map((st) => st.tags).filter(Boolean) || [],
        highlights: (save.highlights as Record<string, unknown>[]) || [],
      })) as unknown as Save[];

      // Filter to only saves with highlights
      if (options.hasHighlights) {
        mapped = mapped.filter((save) => (save.highlights?.length ?? 0) > 0);
      }

      // Client-side folder filtering: include saves that either
      // have folder_id matching this folder, or have any of the folder's tags
      if (options.folderId && hasFolderTags) {
        const folderTagSet = new Set(options.folderTagIds);
        mapped = mapped.filter((save) => {
          if (save.folder_id === options.folderId) return true;
          const saveTagIds = save.tags?.map((t) => t.id) || [];
          return saveTagIds.some((id) => folderTagSet.has(id));
        });
      }

      setSaves(mapped);
    }

    setLoading(false);
  }, [
    supabase,
    options.folderId,
    folderTagIdsKey,
    options.tagId,
    options.sourceType,
    options.hasHighlights,
    options.showArchived,
    options.showFavorites,
  ]);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const deleteSave = async (id: string) => {
    const { error } = await supabase.from("saves").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete save:", error);
      return;
    }
    setSaves((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    const save = saves.find((s) => s.id === id);
    if (!save) return;
    const newVal = !save.is_favorite;
    // Optimistically update UI
    setSaves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: newVal } : s))
    );
    const { error } = await supabase.from("saves").update({ is_favorite: newVal }).eq("id", id);
    if (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert on failure
      setSaves((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_favorite: !newVal } : s))
      );
    }
  };

  const toggleArchive = async (id: string) => {
    const save = saves.find((s) => s.id === id);
    if (!save) return;
    const newVal = !save.is_archived;
    setSaves((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("saves").update({ is_archived: newVal }).eq("id", id);
    if (error) {
      console.error("Failed to toggle archive:", error);
      // Revert: add it back
      setSaves((prev) => [...prev, save]);
    }
  };

  const toggleRead = async (id: string) => {
    const save = saves.find((s) => s.id === id);
    if (!save) return;
    const newVal = !save.is_read;
    setSaves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_read: newVal } : s))
    );
    const { error } = await supabase.from("saves").update({ is_read: newVal }).eq("id", id);
    if (error) {
      console.error("Failed to toggle read:", error);
      setSaves((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_read: !newVal } : s))
      );
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from("saves").update({ notes }).eq("id", id);
    if (error) {
      console.error("Failed to update notes:", error);
      return;
    }
    setSaves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notes } : s))
    );
  };

  const setFolderId = async (saveId: string, folderId: string | null) => {
    const { error } = await supabase.from("saves").update({ folder_id: folderId }).eq("id", saveId);
    if (error) {
      console.error("Failed to set folder:", error);
      return;
    }
    setSaves((prev) =>
      prev.map((s) => (s.id === saveId ? { ...s, folder_id: folderId } : s))
    );
  };

  return {
    saves,
    loading,
    refetch: fetchSaves,
    deleteSave,
    toggleFavorite,
    toggleArchive,
    toggleRead,
    updateNotes,
    setFolderId,
  };
}
