import { createApiClient } from "@/lib/supabase/api";
import { summarizeAndTag } from "@/lib/claude";
import { ensureTagsExist, linkTagsToSave } from "@/lib/tags";
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
    const { save_id } = body;

    if (!save_id) {
      return jsonResponse({ error: "save_id is required" }, request, 400);
    }

    // Fetch the save
    const { data: save, error: fetchError } = await supabase
      .from("saves")
      .select("*")
      .eq("id", save_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !save) {
      return jsonResponse({ error: "Save not found" }, request, 404);
    }

    const textContent =
      save.content || save.highlight || save.excerpt || save.title;
    if (!textContent) {
      return jsonResponse({ error: "No content to summarize" }, request, 400);
    }

    // Mark as processing
    await supabase
      .from("saves")
      .update({ ai_status: "processing" })
      .eq("id", save_id);

    // Call Claude
    const result = await summarizeAndTag(save.title, textContent);

    // Update save with summary
    await supabase
      .from("saves")
      .update({
        summary: result.summary,
        ai_status: "done",
      })
      .eq("id", save_id);

    // Create tags and link them
    if (result.tags.length > 0) {
      const tagIds = await ensureTagsExist(supabase, user.id, result.tags);
      await linkTagsToSave(supabase, save_id, tagIds);
    }

    return jsonResponse({
      summary: result.summary,
      tags: result.tags,
    }, request);
  } catch (err) {
    console.error("Process AI error:", err);
    return jsonResponse({ error: "AI processing failed" }, request, 500);
  }
}
