import { createApiClient } from "@/lib/supabase/api";
import { extractArticle } from "@/lib/readability";
import { handleCorsOptions, jsonResponse } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleCorsOptions(request);
}

export async function POST(request: Request) {
  try {
    const auth = await createApiClient(request);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, request, 401);
    }
    const { supabase, user } = auth;

    const body = await request.json();
    const { url, title: providedTitle, highlight } = body;

    if (!url) {
      return jsonResponse({ error: "URL is required" }, request, 400);
    }

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    if (existing) {
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
          highlight,
          source_type: "highlight",
          ai_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
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

    return jsonResponse({ save }, request);
  } catch (err) {
    console.error("Save error:", err);
    return jsonResponse({ error: "Failed to save" }, request, 500);
  }
}
