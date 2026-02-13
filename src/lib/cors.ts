import { NextResponse } from "next/server";

// Pin to your specific extension IDs once published.
// For now, use env var or accept any extension origin in development only.
const CHROME_EXTENSION_ID = process.env.CHROME_EXTENSION_ID;
const FIREFOX_EXTENSION_ID = process.env.FIREFOX_EXTENSION_ID;

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin") || "";

  // Production: pin to specific extension IDs
  if (CHROME_EXTENSION_ID && origin === `chrome-extension://${CHROME_EXTENSION_ID}`) {
    return origin;
  }
  if (FIREFOX_EXTENSION_ID && origin === `moz-extension://${FIREFOX_EXTENSION_ID}`) {
    return origin;
  }

  // Allow any extension origin if IDs aren't pinned yet, or in development
  if (!CHROME_EXTENSION_ID && origin.startsWith("chrome-extension://")) return origin;
  if (!FIREFOX_EXTENSION_ID && origin.startsWith("moz-extension://")) return origin;

  // Localhost in development only
  if (process.env.NODE_ENV === "development") {
    if (origin === "http://localhost:3000") return origin;
  }

  // Allow the production web app origin
  if (origin === "https://savebot.app") return origin;

  return null;
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = getAllowedOrigin(request);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function handleCorsOptions(request: Request): NextResponse {
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export function jsonResponse(
  data: unknown,
  request: Request,
  status = 200
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(request),
  });
}
