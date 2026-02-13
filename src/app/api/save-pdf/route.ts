import { createApiClient } from "@/lib/supabase/api";
import { extractPdfText } from "@/lib/pdf";
import { handleCorsOptions, jsonResponse } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod/v4";

const savePdfSchema = z.object({
  url: z.url().max(2048),
  title: z.string().max(500).optional(),
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

    // Rate limit: 60 saves per hour per user (shared with /api/save)
    const rl = checkRateLimit(`save:${user.id}`, 60, 3600_000);
    if (!rl.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded. Try again later." },
        request,
        429
      );
    }

    const body = await request.json();
    const parsed = savePdfSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input", details: parsed.error.issues }, request, 400);
    }
    const { url, title: providedTitle } = parsed.data;

    // Check for duplicate
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

    // Extract PDF text
    let pdfData;
    try {
      pdfData = await extractPdfText(url);
    } catch {
      const { data: save, error } = await supabase
        .from("saves")
        .insert({
          user_id: user.id,
          url,
          title: providedTitle || url,
          source_type: "pdf",
          ai_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse({ save, extraction_failed: true }, request);
    }

    const title =
      providedTitle || url.split("/").pop()?.replace(".pdf", "") || url;

    const { data: save, error } = await supabase
      .from("saves")
      .insert({
        user_id: user.id,
        url,
        title,
        content: pdfData.text,
        word_count: pdfData.text.split(/\s+/).length,
        source_type: "pdf",
        ai_status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return jsonResponse({ save }, request);
  } catch (err) {
    console.error("Save PDF error:", err);
    return jsonResponse({ error: "Failed to save PDF" }, request, 500);
  }
}
