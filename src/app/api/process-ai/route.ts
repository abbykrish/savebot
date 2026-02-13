import { createApiClient } from "@/lib/supabase/api";
import { summarizeAndTag } from "@/lib/claude";
import { ensureTagsExist, linkTagsToSave } from "@/lib/tags";
import { handleCorsOptions, jsonResponse } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod/v4";

const processAiSchema = z.object({
  save_id: z.uuid(),
});

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

    // Rate limit: 20 AI summarizations per hour per user
    const rl = checkRateLimit(`ai:${user.id}`, 20, 3600_000);
    if (!rl.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded. Try again later." },
        request,
        429
      );
    }

    const body = await request.json();
    const parsed = processAiSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input", details: parsed.error.issues }, request, 400);
    }
    const { save_id } = parsed.data;

    // Fetch the save with highlights
    const { data: save, error: fetchError } = await supabase
      .from("saves")
      .select("*, highlights(*)")
      .eq("id", save_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !save) {
      return jsonResponse({ error: "Save not found" }, request, 404);
    }

    const highlightText = save.highlights?.length
      ? save.highlights.map((h: { text: string }) => h.text).join("\n\n")
      : null;
    const textContent =
      save.content || highlightText || save.excerpt || save.title;
    if (!textContent) {
      return jsonResponse({ error: "No content to summarize" }, request, 400);
    }

    // Mark as processing
    await supabase
      .from("saves")
      .update({ ai_status: "processing" })
      .eq("id", save_id);

    // Fetch existing tags so Claude can reuse them
    const { data: userTags } = await supabase
      .from("tags")
      .select("name")
      .eq("user_id", user.id);
    const existingTagNames = (userTags || []).map((t: { name: string }) => t.name);

    // Call Claude
    const result = await summarizeAndTag(save.title, textContent, existingTagNames);

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
