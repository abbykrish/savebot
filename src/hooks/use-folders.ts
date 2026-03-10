"use client";

import { createClient } from "@/lib/supabase/client";
import { Folder } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("folders")
      .select("*, folder_tags(tag_id)")
      .order("name");

    if (error) {
      console.error("Failed to fetch folders:", error);
    } else {
      const mapped = (data || []).map((f) => {
        const { folder_tags, ...rest } = f as Record<string, unknown> & { folder_tags?: { tag_id: string }[] };
        return {
          ...rest,
          tag_ids: (folder_tags || []).map((ft) => ft.tag_id),
        } as Folder;
      });
      setFolders(mapped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string, color?: string, tagIds?: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("folders")
      .insert({ name, color: color || null, is_auto: false, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Failed to create folder:", error);
      return null;
    }

    if (tagIds && tagIds.length > 0) {
      const rows = tagIds.map((tag_id) => ({ folder_id: data.id, tag_id }));
      const { error: tagError } = await supabase.from("folder_tags").insert(rows);
      if (tagError) {
        console.error("Failed to insert folder_tags:", tagError);
      }
    }

    const newFolder: Folder = { ...data, tag_ids: tagIds || [] };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete folder:", error);
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const addTagToFolder = async (folderId: string, tagId: string) => {
    await supabase.from("folder_tags").upsert({ folder_id: folderId, tag_id: tagId });
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, tag_ids: [...(f.tag_ids || []), tagId] }
          : f
      )
    );
  };

  const removeTagFromFolder = async (folderId: string, tagId: string) => {
    await supabase
      .from("folder_tags")
      .delete()
      .eq("folder_id", folderId)
      .eq("tag_id", tagId);
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, tag_ids: (f.tag_ids || []).filter((id) => id !== tagId) }
          : f
      )
    );
  };

  return {
    folders,
    loading,
    refetch: fetchFolders,
    createFolder,
    deleteFolder,
    addTagToFolder,
    removeTagFromFolder,
  };
}
