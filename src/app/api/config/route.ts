import { handleCorsOptions } from "@/lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS(request: Request) {
  return handleCorsOptions(request);
}

export async function GET() {
  return NextResponse.json({
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
