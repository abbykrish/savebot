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
  isArticle: boolean;
  rejectReason: string | null;
}

const ARTICLE_JSONLD_TYPES = new Set([
  "article",
  "newsarticle",
  "blogposting",
  "backgroundnewsarticle",
  "reportagenewsarticle",
  "scholarlyarticle",
  "techarticle",
  "opinionnewsarticle",
  "analysisnewsarticle",
]);

const NON_ARTICLE_OG_TYPES = new Set([
  "product",
  "product.item",
  "product.group",
  "book",
  "restaurant",
  "restaurant.restaurant",
  "place",
  "profile",
  "business.business",
  "music.song",
  "music.album",
  "music.playlist",
  "video.movie",
  "video.tv_show",
  "video.episode",
]);

const NON_ARTICLE_JSONLD_TYPES = new Set([
  "product",
  "webapplication",
  "softwareapplication",
  "mobileapplication",
  "organization",
  "localbusiness",
  "restaurant",
  "lodgingbusiness",
  "hotel",
  "store",
  "place",
  "tourdestination",
  "trip",
  "flightreservation",
  "lodgingreservation",
  "reservation",
  "medicalclinic",
  "physician",
  "person",
  "searchresultspage",
  "checkoutpage",
  "itempage",
]);

const MIN_ARTICLE_WORD_COUNT = 150;

function collectJsonLdTypes(document: Document): string[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const types: string[] = [];
  for (const script of Array.from(scripts)) {
    const text = script.textContent;
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      collectTypesFromNode(parsed, types);
    } catch {
      // Ignore malformed JSON-LD
    }
  }
  return types.map((t) => t.toLowerCase());
}

function collectTypesFromNode(node: unknown, out: string[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypesFromNode(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const t = obj["@type"];
  if (typeof t === "string") out.push(t);
  else if (Array.isArray(t)) for (const v of t) if (typeof v === "string") out.push(v);
  // Recurse into @graph and other nested entities
  const graph = obj["@graph"];
  if (graph) collectTypesFromNode(graph, out);
}

function classify(opts: {
  ogType: string;
  jsonLdTypes: string[];
  wordCount: number;
  hasReadabilityContent: boolean;
}): { isArticle: boolean; reason: string | null } {
  const { ogType, jsonLdTypes, wordCount, hasReadabilityContent } = opts;

  // Strong positive signals win first
  if (ogType === "article") return { isArticle: true, reason: null };
  if (jsonLdTypes.some((t) => ARTICLE_JSONLD_TYPES.has(t))) {
    return { isArticle: true, reason: null };
  }

  // Strong negative signals
  if (NON_ARTICLE_OG_TYPES.has(ogType)) {
    return { isArticle: false, reason: `og:type=${ogType}` };
  }
  const negativeJsonLd = jsonLdTypes.find((t) => NON_ARTICLE_JSONLD_TYPES.has(t));
  if (negativeJsonLd) {
    return { isArticle: false, reason: `jsonld:${negativeJsonLd}` };
  }

  // Fallback: word-count floor. If Readability couldn't extract a body or the
  // body is too short, the page is probably an app/transactional surface.
  if (!hasReadabilityContent) {
    return { isArticle: false, reason: "no-readable-content" };
  }
  if (wordCount < MIN_ARTICLE_WORD_COUNT) {
    return { isArticle: false, reason: `short:${wordCount}w` };
  }

  return { isArticle: true, reason: null };
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

  const doc = dom.window.document;
  const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() || "";
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() || "";
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content")?.trim() || null;
  const ogType = (doc.querySelector('meta[property="og:type"]')?.getAttribute("content") || "")
    .trim()
    .toLowerCase();
  const jsonLdTypes = collectJsonLdTypes(doc as unknown as Document);

  const wordCount = article?.length
    ? Math.round(article.length / 5) // Readability `length` is char count; ~5 chars/word
    : 0;

  const { isArticle, reason } = classify({
    ogType,
    jsonLdTypes,
    wordCount,
    hasReadabilityContent: !!(article && article.textContent && article.textContent.trim().length > 0),
  });

  if (!article) {
    if (!docTitle && !ogTitle) return null;
    return {
      title: ogTitle || docTitle,
      content: "",
      excerpt: ogDescription,
      siteName: ogSiteName,
      byline: null,
      length: 0,
      isArticle,
      rejectReason: reason,
    };
  }

  return {
    title: article.title || ogTitle || docTitle,
    content: article.textContent || "",
    excerpt: article.excerpt || ogDescription || "",
    siteName: article.siteName || ogSiteName,
    byline: article.byline || null,
    length: article.length || 0,
    isArticle,
    rejectReason: reason,
  };
}
