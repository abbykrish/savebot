"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NotesEditorProps {
  notes: string;
  onSave: (notes: string) => void;
}

export function NotesEditor({ notes, onSave }: NotesEditorProps) {
  const [value, setValue] = useState(notes);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  const debouncedSave = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave(text);
      }, 800);
    },
    [onSave]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
        Notes
      </label>
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
