"use client";

import { createClient } from "@/lib/supabase/client";
import { Save } from "@/lib/types";
import { useCallback, useState } from "react";

export function useSearch() {
  const [results, setResults] = useState<Save[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const supabase = createClient();

  const search = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("search_saves", {
        search_query: searchQuery,
        user_id_param: user.id,
      });

      if (error) {
        console.error("Search error:", error);
        setResults([]);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    },
    [supabase]
  );

  const clear = () => {
    setQuery("");
    setResults([]);
  };

  return { results, loading, query, search, clear };
}
