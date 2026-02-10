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
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to fetch folders:", error);
    } else {
      setFolders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string, color?: string) => {
    const { data, error } = await supabase
      .from("folders")
      .insert({ name, color: color || null, is_auto: false })
      .select()
      .single();

    if (error) {
      console.error("Failed to create folder:", error);
      return null;
    }
    setFolders((prev) => [...prev, data]);
    return data;
  };

  const deleteFolder = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return { folders, loading, refetch: fetchFolders, createFolder, deleteFolder };
}
