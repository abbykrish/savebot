import { after } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import { extractArticle } from "@/lib/readability";
import { autoTag } from "@/lib/claude";
import { ensureTagsExist, linkTagsToSave } from "@/lib/tags";
import { handleCorsOptions, jsonResponse } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod/v4";

const saveSchema = z.object({
  url: z.url().max(2048),
  title: z.string().max(500).optional(),
  highlight: z.string().max(10000).optional(),
});

export async function OPTIONS(request: Request) {
  return handleCorsOptions(request);
}

// Schedule auto-tagging to run after the response is sent.
// Uses next/server `after()` so the serverless function stays alive.
function triggerAutoTag(
  supabase: SupabaseClient,
  userId: string,
  saveId: string,
  title: string,
  content: string
) {
  after(async () => {
    try {
      // Fetch existing tags so Claude can reuse them
      const { data: userTags } = await supabase
        .from("tags")
        .select("name")
        .eq("user_id", userId);
      const existingTagNames = (userTags || []).map((t: { name: string }) => t.name);

      const tags = await autoTag(title, content, existingTagNames);
      if (tags.length > 0) {
        const tagIds = await ensureTagsExist(supabase, userId, tags);
        await linkTagsToSave(supabase, saveId, tagIds);
      }
    } catch (err) {
      console.error("Auto-tag failed:", err);
    }
  });
}

export async function POST(request: Request) {
  try {
    const auth = await createApiClient(request);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, request, 401);
    }
    const { supabase, user } = auth;

    // Rate limit: 60 saves per hour per user
    const rl = checkRateLimit(`save:${user.id}`, 60, 3600_000);
    if (!rl.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded. Try again later." },
        request,
        429
      );
    }

    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input", details: parsed.error.issues }, request, 400);
    }
    const { url, title: providedTitle, highlight } = parsed.data;

    // Reject non-http(s) URLs
    const scheme = new URL(url).protocol;
    if (scheme !== "http:" && scheme !== "https:") {
      return jsonResponse({ error: "Only http/https URLs are allowed" }, request, 400);
    }

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    if (existing) {
      // If this is a highlight on an already-saved URL, add a new highlight row
      if (highlight) {
        const { error: hlError } = await supabase
          .from("highlights")
          .insert({ save_id: existing.id, text: highlight });

        if (hlError) throw hlError;

        const { data: updated, error } = await supabase
          .from("saves")
          .select("*, highlights(*)")
          .eq("id", existing.id)
          .single();

        if (error) throw error;
        return jsonResponse({ save: updated }, request);
      }

      return jsonResponse(
        { error: "Already saved", id: existing.id },
        request,
        409
      );
    }

    // If it's a highlight-only save, skip extraction
    if (highlight) {
      const { data: save, error } = await supabase
        .from("saves")
        .insert({
          user_id: user.id,
          url,
          title: providedTitle || url,
          source_type: "highlight",
          ai_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Insert the highlight row
      await supabase
        .from("highlights")
        .insert({ save_id: save.id, text: highlight });

      triggerAutoTag(supabase, user.id, save.id, save.title, highlight);
      return jsonResponse({ save }, request);
    }

    // Extract article content
    let extracted;
    try {
      extracted = await extractArticle(url);
    } catch {
      // If extraction fails, save with just the URL
      const { data: save, error } = await supabase
        .from("saves")
        .insert({
          user_id: user.id,
          url,
          title: providedTitle || url,
          source_type: "article",
          ai_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      triggerAutoTag(supabase, user.id, save.id, save.title, save.title);
      return jsonResponse({ save, extraction_failed: true }, request);
    }

    const title = providedTitle || extracted?.title || url;
    const { data: save, error } = await supabase
      .from("saves")
      .insert({
        user_id: user.id,
        url,
        title,
        content: extracted?.content || null,
        excerpt: extracted?.excerpt || null,
        site_name: extracted?.siteName || null,
        author: extracted?.byline || null,
        word_count: extracted?.length || null,
        source_type: "article",
        ai_status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    triggerAutoTag(
      supabase, user.id, save.id, title,
      extracted?.content || extracted?.excerpt || title
    );
    return jsonResponse({ save }, request);
  } catch (err) {
    console.error("Save error:", err);
    return jsonResponse({ error: "Failed to save" }, request, 500);
  }
}
