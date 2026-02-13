"use client";

import { Plus, X, Loader2, Check } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface QuickSaveProps {
  onSaved: () => void;
}

export function QuickSave({ onSaved }: QuickSaveProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setUrl("");
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const handleOpen = () => {
    setOpen(true);
    reset();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setStatus("error");
      setErrorMsg("Invalid URL");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Save failed (${res.status})`);
      }

      setStatus("success");
      onSaved();
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        title="Save a URL"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="url"
          placeholder="Paste a URL..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setErrorMsg("");
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={status === "saving" || status === "success"}
          className={`w-64 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            status === "error"
              ? "border-red-400 dark:border-red-500"
              : "border-neutral-200 dark:border-neutral-800"
          }`}
        />
        {status === "saving" && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
        )}
        {status === "success" && (
          <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      {errorMsg && (
        <span className="text-xs text-red-500 whitespace-nowrap">{errorMsg}</span>
      )}
      <button
        onClick={handleClose}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title="Cancel"
      >
        <X className="h-4 w-4 text-neutral-400" />
      </button>
    </div>
  );
}
