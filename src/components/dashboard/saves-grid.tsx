"use client";

import { Save } from "@/lib/types";
import { SaveCard } from "./save-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";

interface SavesGridProps {
  saves: Save[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavesGrid({
  saves,
  loading,
  selectedId,
  onSelect,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onDelete,
}: SavesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (saves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Inbox className="h-12 w-12 mb-3" />
        <p className="text-sm font-medium">No saves yet</p>
        <p className="text-xs mt-1">
          Use the browser extension to save articles
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {saves.map((save) => (
        <SaveCard
          key={save.id}
          save={save}
          isSelected={selectedId === save.id}
          onSelect={() => onSelect(save.id)}
          onToggleFavorite={() => onToggleFavorite(save.id)}
          onToggleArchive={() => onToggleArchive(save.id)}
          onToggleRead={() => onToggleRead(save.id)}
          onDelete={() => onDelete(save.id)}
        />
      ))}
    </div>
  );
}
