/** Return the URL only if it uses a safe protocol, otherwise "#". */
export function safeHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch {
    // invalid URL
  }
  return "#";
}

/** Safely extract hostname from a URL, returning the raw URL on failure. */
export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
