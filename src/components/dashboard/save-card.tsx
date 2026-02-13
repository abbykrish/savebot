"use client";

import { Badge } from "@/components/ui/badge";
import { Save, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { safeHref, safeHostname } from "@/lib/safe-url";
import {
  Archive,
  Circle,
  CircleCheck,
  ExternalLink,
  FileText,
  Heart,
  Highlighter,
  Sparkles,
  Trash2,
} from "lucide-react";

interface SaveCardProps {
  save: Save;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
}

export function SaveCard({
  save,
  isSelected,
  onSelect,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onDelete,
}: SaveCardProps) {
  const sourceIcon = {
    article: <FileText className="h-3.5 w-3.5" />,
    pdf: <FileText className="h-3.5 w-3.5 text-red-500" />,
    highlight: <Highlighter className="h-3.5 w-3.5 text-yellow-500" />,
  }[save.source_type];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group p-4 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {!save.is_read && (
            <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
          <h3 className={cn(
            "text-sm leading-snug line-clamp-2",
            save.is_read ? "font-normal text-neutral-600 dark:text-neutral-400" : "font-medium"
          )}>
            {save.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                save.is_favorite
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-400"
              )}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleArchive();
            }}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Archive className="h-3.5 w-3.5 text-neutral-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead();
            }}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={save.is_read ? "Mark as unread" : "Mark as read"}
          >
            {save.is_read ? (
              <CircleCheck className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-neutral-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {save.excerpt && (
        <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
          {save.excerpt}
        </p>
      )}


      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-neutral-400">
          {sourceIcon}
          {save.site_name || safeHostname(save.url)}
        </span>

        {save.ai_status === "done" && (
          <Sparkles className="h-3 w-3 text-blue-500" />
        )}

        {save.tags?.map((tag: Tag) => (
          <Badge key={tag.id} color={tag.color || undefined}>
            {tag.name}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        <time className="text-[11px] text-neutral-400">
          {new Date(save.created_at).toLocaleDateString()}
        </time>
        <a
          href={safeHref(save.url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-neutral-400 hover:text-blue-500 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
