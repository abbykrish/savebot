"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

interface NotesEditorProps {
  notes: string;
  onSave: (notes: string) => void;
}

export function NotesEditor({ notes, onSave }: NotesEditorProps) {
  const [value, setValue] = useState(notes);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const savedTimerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  const debouncedSave = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave(text);
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      }, 800);
    },
    [onSave]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-neutral-500">
          Notes
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          debouncedSave(e.target.value);
        }}
        placeholder="Add your notes..."
        rows={3}
        className="w-full text-sm p-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
