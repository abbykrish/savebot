import { SupabaseClient } from "@supabase/supabase-js";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#14b8a6",
];

export async function ensureTagsExist(
  supabase: SupabaseClient,
  userId: string,
  tagNames: string[]
): Promise<string[]> {
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const normalized = name.toLowerCase().trim();
    if (!normalized) continue;

    // Check if tag already exists
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .eq("name", normalized)
      .single();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      // Create new tag
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const { data: created } = await supabase
        .from("tags")
        .insert({ user_id: userId, name: normalized, color, is_auto: true })
        .select("id")
        .single();

      if (created) {
        tagIds.push(created.id);
      }
    }
  }

  return tagIds;
}

export async function linkTagsToSave(
  supabase: SupabaseClient,
  saveId: string,
  tagIds: string[]
) {
  if (tagIds.length === 0) return;

  const rows = tagIds.map((tagId) => ({ save_id: saveId, tag_id: tagId }));
  await supabase.from("save_tags").upsert(rows, {
    onConflict: "save_id,tag_id",
  });
}
