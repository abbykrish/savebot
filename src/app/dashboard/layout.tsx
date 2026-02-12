"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { useFolders } from "@/hooks/use-folders";
import { useTags } from "@/hooks/use-tags";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { Folder, Tag } from "@/lib/types";

// Context so child components can access tag state + management
interface DashboardContextValue {
  selectedTagId: string | null;
  allTags: Tag[];
  refetchTags: () => void;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  addTagToSave: (saveId: string, tagId: string) => Promise<void>;
  removeTagFromSave: (saveId: string, tagId: string) => Promise<void>;
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  refetchFolders: () => void;
}
const DashboardContext = createContext<DashboardContextValue>({
  selectedTagId: null,
  allTags: [],
  refetchTags: () => {},
  createTag: async () => null,
  addTagToSave: async () => {},
  removeTagFromSave: async () => {},
  folders: [],
  selectedFolderId: null,
  setSelectedFolderId: () => {},
  refetchFolders: () => {},
});
export function useDashboardContext() {
  return useContext(DashboardContext);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Client-side auth check — redirect to login if session is invalid
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        router.refresh();
      } else {
        setAuthChecked(true);
      }
    });
  }, [supabase, router]);

  const { tags, refetch: refetchTags, createTag, deleteTag, addTagToSave, removeTagFromSave } = useTags();
  const { folders, createFolder, deleteFolder, refetch: refetchFolders } = useFolders();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={(name, tagIds) => createFolder(name, undefined, tagIds)}
        onDeleteFolder={(id) => deleteFolder(id)}
        tags={tags}
        selectedTagId={selectedTagId}
        onSelectTag={setSelectedTagId}
        onCreateTag={(name) => createTag(name)}
        onDeleteTag={(id) => deleteTag(id)}
        onSignOut={handleSignOut}
      />
      <DashboardContext.Provider value={{
        selectedTagId,
        allTags: tags,
        refetchTags,
        createTag,
        addTagToSave,
        removeTagFromSave,
        folders,
        selectedFolderId,
        setSelectedFolderId,
        refetchFolders,
      }}>
        {children}
      </DashboardContext.Provider>
    </div>
  );
}
