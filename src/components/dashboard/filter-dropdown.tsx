"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  icon?: ReactNode;
}

export function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
  icon,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        {icon}
        {selected?.label}
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between first:rounded-t-lg last:rounded-b-lg ${
                value === opt.value
                  ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className="text-xs text-neutral-400">{opt.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
