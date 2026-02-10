"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Tag } from "@/lib/types";
import {
  Archive,
  ExternalLink,
  Heart,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { NotesEditor } from "./notes-editor";
import { useState } from "react";

interface ReadingPaneProps {
  save: Save;
  onClose: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onUpdateNotes: (notes: string) => void;
  onProcessAi: () => void;
}

export function ReadingPane({
  save,
  onClose,
  onToggleFavorite,
  onToggleArchive,
  onUpdateNotes,
  onProcessAi,
}: ReadingPaneProps) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleProcessAi = async () => {
    setAiLoading(true);
    onProcessAi();
    // The parent will refetch; we just show loading state briefly
    setTimeout(() => setAiLoading(false), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Heart
              className={
                save.is_favorite
                  ? "h-4 w-4 fill-red-500 text-red-500"
                  : "h-4 w-4 text-neutral-400"
              }
            />
          </button>
          <button
            onClick={onToggleArchive}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Archive className="h-4 w-4 text-neutral-400" />
          </button>
          <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="h-4 w-4 text-neutral-400" />
          </a>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="h-4 w-4 text-neutral-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-2">{save.title}</h1>

        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          {save.site_name && <span>{save.site_name}</span>}
          {save.author && (
            <>
              <span>&middot;</span>
              <span>{save.author}</span>
            </>
          )}
          {save.word_count && (
            <>
              <span>&middot;</span>
              <span>{Math.ceil(save.word_count / 200)} min read</span>
            </>
          )}
        </div>

        {/* Tags */}
        {save.tags && save.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {save.tags.map((tag: Tag) => (
              <Badge key={tag.id} color={tag.color || undefined}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* AI Summary */}
        {save.summary && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Summary
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {save.summary}
            </p>
          </div>
        )}

        {/* Summarize button (only show when no summary yet) */}
        {!save.summary && save.ai_status !== "processing" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessAi}
            disabled={aiLoading}
            className="mb-4"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {aiLoading ? "Summarizing..." : "Summarize with AI"}
          </Button>
        )}

        {save.ai_status === "processing" && (
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is processing...
          </div>
        )}

        {/* Highlight */}
        {save.highlight && (
          <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-r-lg mb-4 italic text-sm">
            {save.highlight}
          </blockquote>
        )}

        {/* Article content */}
        {save.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {save.content}
          </div>
        )}

        {!save.content && !save.highlight && (
          <p className="text-sm text-neutral-400 italic">
            No content extracted. Visit the{" "}
            <a
              href={save.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              original page
            </a>
            .
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <NotesEditor
          notes={save.notes || ""}
          onSave={onUpdateNotes}
        />
      </div>
    </div>
  );
}
