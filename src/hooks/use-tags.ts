"use client";

import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to fetch tags:", error);
    } else {
      setTags(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string, color?: string) => {
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: name.toLowerCase().trim(), color: color || "#6b7280", is_auto: false })
      .select()
      .single();

    if (error) {
      console.error("Failed to create tag:", error);
      return null;
    }
    setTags((prev) => [...prev, data]);
    return data;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete tag:", error);
      return;
    }
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const addTagToSave = async (saveId: string, tagId: string) => {
    const { error } = await supabase.from("save_tags").upsert({ save_id: saveId, tag_id: tagId });
    if (error) {
      console.error("Failed to add tag to save:", error);
    }
  };

  const removeTagFromSave = async (saveId: string, tagId: string) => {
    const { error } = await supabase
      .from("save_tags")
      .delete()
      .eq("save_id", saveId)
      .eq("tag_id", tagId);
    if (error) {
      console.error("Failed to remove tag from save:", error);
    }
  };

  return { tags, loading, refetch: fetchTags, createTag, deleteTag, addTagToSave, removeTagFromSave };
}
