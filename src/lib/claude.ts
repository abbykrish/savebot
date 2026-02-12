import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Strip markdown code fences from Claude responses before parsing
function stripCodeFences(text: string): string {
  const match = text.match(/^\s*```(?:json)?\s*\n?([\s\S]*?)\n?\s*```\s*$/);
  return match ? match[1] : text;
}

interface SummarizeResult {
  summary: string;
  tags: string[];
}

export async function summarizeAndTag(
  title: string,
  content: string,
  existingTags: string[] = []
): Promise<SummarizeResult> {
  // Truncate content to ~8k chars to stay within reasonable token limits
  const truncated = content.slice(0, 8000);
  const tagList = existingTags.length > 0
    ? `\nExisting tags in the user's library: [${existingTags.map(t => `"${t}"`).join(", ")}]\nReuse an existing tag when it genuinely fits the article's topic. Do NOT force an existing tag if it's not relevant — create a new one instead.`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this article and return a JSON object with two fields:
- "summary": A 2-3 sentence summary of the key points.
- "tags": An array of 2-5 short, lowercase tags that accurately describe the article's topics.${tagList}

Article title: ${title}

Article content:
${truncated}

Return ONLY valid JSON, no markdown fences or other text.`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";
  const text = stripCodeFences(raw);

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    // If JSON parsing fails, use the raw text as summary
    return { summary: raw.slice(0, 500), tags: [] };
  }
}

// Lightweight tag-only function for auto-tagging on save
export async function autoTag(
  title: string,
  content: string,
  existingTags: string[] = []
): Promise<string[]> {
  const truncated = content.slice(0, 4000);
  const tagList = existingTags.length > 0
    ? `\n\nExisting tags in the user's library: [${existingTags.map(t => `"${t}"`).join(", ")}]\nReuse an existing tag when it genuinely fits the article's topic. Do NOT force an existing tag if it's not relevant — create a new one instead.`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `Return a JSON array of 2-5 short, lowercase tags for this article. Use existing tags when they fit, but create new ones when the article covers topics not represented by existing tags.${tagList}

Title: ${title}

Content:
${truncated}

Return ONLY a valid JSON array, nothing else.`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";
  const text = stripCodeFences(raw);

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}
