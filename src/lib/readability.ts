import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { safeFetch } from "@/lib/url";

export interface ExtractedArticle {
  title: string;
  content: string;
  excerpt: string;
  siteName: string | null;
  byline: string | null;
  length: number;
}

export async function extractArticle(
  url: string
): Promise<ExtractedArticle | null> {
  const response = await safeFetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  // Fallback: grab <title> and og:title even if Readability can't parse the article
  const docTitle = dom.window.document.querySelector("title")?.textContent?.trim() || "";
  const ogTitle = dom.window.document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() || "";
  const ogDescription = dom.window.document.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() || "";
  const ogSiteName = dom.window.document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")?.trim() || null;

  if (!article) {
    if (!docTitle && !ogTitle) return null;
    return {
      title: ogTitle || docTitle,
      content: "",
      excerpt: ogDescription,
      siteName: ogSiteName,
      byline: null,
      length: 0,
    };
  }

  return {
    title: article.title || ogTitle || docTitle,
    content: article.textContent || "",
    excerpt: article.excerpt || ogDescription || "",
    siteName: article.siteName || ogSiteName,
    byline: article.byline || null,
    length: article.length || 0,
  };
}
