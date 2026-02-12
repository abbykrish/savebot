export type SourceType = "article" | "pdf" | "highlight";
export type AiStatus = "pending" | "processing" | "done" | "failed";

export interface Save {
  id: string;
  user_id: string;
  url: string;
  title: string;
  content: string | null;
  content_markdown: string | null;
  excerpt: string | null;
  highlight: string | null;
  summary: string | null;
  notes: string | null;
  site_name: string | null;
  author: string | null;
  image_url: string | null;
  word_count: number | null;
  source_type: SourceType;
  ai_status: AiStatus;
  folder_id: string | null;
  is_archived: boolean;
  is_favorite: boolean;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  is_auto: boolean;
  created_at: string;
}

export interface SaveTag {
  save_id: string;
  tag_id: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  is_auto: boolean;
  source_tag_id: string | null;
  created_at: string;
  tag_ids?: string[];
}

export interface SaveWithTags extends Save {
  save_tags: { tag: Tag }[];
}
