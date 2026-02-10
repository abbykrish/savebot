"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { useFolders } from "@/hooks/use-folders";
import { useTags } from "@/hooks/use-tags";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const { tags, createTag, deleteTag } = useTags();
  const { folders, createFolder, deleteFolder } = useFolders();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={(name) => createFolder(name)}
        onDeleteFolder={(id) => deleteFolder(id)}
        tags={tags}
        selectedTagId={selectedTagId}
        onSelectTag={setSelectedTagId}
        onCreateTag={(name) => createTag(name)}
        onDeleteTag={(id) => deleteTag(id)}
        onSignOut={handleSignOut}
      />
      {children}
    </div>
  );
}
