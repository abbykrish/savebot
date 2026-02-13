import { isIP } from "net";

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some((r) => r.test(ip));
}

/**
 * Validate that a URL is safe to fetch server-side.
 * Rejects non-http(s), private IPs, and excessively long URLs.
 */
export async function validateFetchUrl(url: string): Promise<void> {
  if (url.length > 2048) {
    throw new Error("URL too long");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname;

  // Check if hostname is a raw IP
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("Private/internal URLs are not allowed");
    }
    return;
  }

  // Resolve hostname and check for private IPs
  const { resolve4, resolve6 } = await import("dns/promises");
  try {
    const [ipv4, ipv6] = await Promise.allSettled([
      resolve4(hostname),
      resolve6(hostname),
    ]);

    const ips: string[] = [];
    if (ipv4.status === "fulfilled") ips.push(...ipv4.value);
    if (ipv6.status === "fulfilled") ips.push(...ipv6.value);

    if (ips.length === 0) {
      throw new Error("Could not resolve hostname");
    }

    if (ips.some(isPrivateIP)) {
      throw new Error("Private/internal URLs are not allowed");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("not allowed")) throw err;
    throw new Error("Could not resolve hostname");
  }
}

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT = 30_000; // 30s

/**
 * Fetch a URL with SSRF protection, size limits, and timeout.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  await validateFetchUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
    });

    // Check content-length header if available
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error("Response too large");
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
