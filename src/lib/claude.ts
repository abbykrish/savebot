import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SummarizeResult {
  summary: string;
  tags: string[];
}

export async function summarizeAndTag(
  title: string,
  content: string
): Promise<SummarizeResult> {
  // Truncate content to ~8k chars to stay within reasonable token limits
  const truncated = content.slice(0, 8000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this article and return a JSON object with two fields:
- "summary": A 2-3 sentence summary of the key points.
- "tags": An array of 2-5 short, lowercase tags (e.g. "javascript", "machine-learning", "design").

Article title: ${title}

Article content:
${truncated}

Return ONLY valid JSON, no markdown fences or other text.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    // If JSON parsing fails, use the raw text as summary
    return { summary: text.slice(0, 500), tags: [] };
  }
}
