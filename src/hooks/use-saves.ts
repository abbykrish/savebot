"use client";

import { createClient } from "@/lib/supabase/client";
import { Save } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

interface UseSavesOptions {
  folderId?: string | null;
  tagId?: string | null;
  sourceType?: string | null;
  showArchived?: boolean;
  showFavorites?: boolean;
}

export function useSaves(options: UseSavesOptions = {}) {
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSaves = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("saves")
      .select("*, save_tags(tag_id, tags(*))")
      .order("created_at", { ascending: false });

    if (options.folderId) {
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
      // If filtering by tag, do it client-side (junction table filtering)
      let results = data || [];
      if (options.tagId) {
        results = results.filter((save: Record<string, unknown>) =>
          (save.save_tags as { tag_id: string }[])?.some(
            (st) => st.tag_id === options.tagId
          )
        );
      }

      // Map tags onto saves
      const mapped = results.map((save: Record<string, unknown>) => ({
        ...save,
        tags: (save.save_tags as { tags: unknown }[])?.map((st) => st.tags).filter(Boolean) || [],
      })) as Save[];

      setSaves(mapped);
    }

    setLoading(false);
  }, [
    supabase,
    options.folderId,
    options.tagId,
    options.sourceType,
    options.showArchived,
    options.showFavorites,
  ]);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const deleteSave = async (id: string) => {
    await supabase.from("saves").delete().eq("id", id);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    const save = saves.find((s) => s.id === id);
    if (!save) return;
    const newVal = !save.is_favorite;
    await supabase.from("saves").update({ is_favorite: newVal }).eq("id", id);
    setSaves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: newVal } : s))
    );
  };

  const toggleArchive = async (id: string) => {
    const save = saves.find((s) => s.id === id);
    if (!save) return;
    const newVal = !save.is_archived;
    await supabase.from("saves").update({ is_archived: newVal }).eq("id", id);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  };

  const updateNotes = async (id: string, notes: string) => {
    await supabase.from("saves").update({ notes }).eq("id", id);
    setSaves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notes } : s))
    );
  };

  return {
    saves,
    loading,
    refetch: fetchSaves,
    deleteSave,
    toggleFavorite,
    toggleArchive,
    updateNotes,
  };
}
