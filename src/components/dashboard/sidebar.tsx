"use client";

import { Folder, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Archive,
  BookOpen,
  FileText,
  Heart,
  Highlighter,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderList } from "./folder-list";
import { TagManager } from "./tag-manager";

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
  onCreateTag: (name: string) => void;
  onDeleteTag: (id: string) => void;
  onSignOut: () => void;
}

const navItems = [
  { href: "/dashboard", label: "All Saves", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/dashboard/favorites", label: "Favorites", icon: <Heart className="h-4 w-4" /> },
  { href: "/dashboard/archived", label: "Archived", icon: <Archive className="h-4 w-4" /> },
  { href: "/dashboard/articles", label: "Articles", icon: <FileText className="h-4 w-4" /> },
  { href: "/dashboard/pdfs", label: "PDFs", icon: <FileText className="h-4 w-4 text-red-500" /> },
  { href: "/dashboard/highlights", label: "Highlights", icon: <Highlighter className="h-4 w-4 text-yellow-500" /> },
];

export function Sidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  tags,
  selectedTagId,
  onSelectTag,
  onCreateTag,
  onDeleteTag,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (selectedFolderId || selectedTagId) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href;
  };

  return (
    <aside className="w-60 h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-4 pb-2">
        <h1 className="text-lg font-bold">SaveBot</h1>
      </div>

      <nav className="px-2 space-y-0.5">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => {
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(href)
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-6">
        <FolderList
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onDeleteFolder={onDeleteFolder}
        />
      </div>

      <div className="px-4 mt-6">
        <TagManager
          tags={tags}
          selectedTagId={selectedTagId}
          onSelectTag={onSelectTag}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
        />
      </div>

      <div className="flex-1" />

      <div className="p-4">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
