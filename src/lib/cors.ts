import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "chrome-extension://",  // any extension ID during dev
];

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin") || "";
  // Allow any chrome extension origin
  if (origin.startsWith("chrome-extension://")) return origin;
  // Allow localhost during dev
  if (origin.startsWith("http://localhost")) return origin;
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
