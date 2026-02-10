import { createClient, createClientWithToken } from "./server";
import { SupabaseClient } from "@supabase/supabase-js";

// Resolve auth for API routes: Bearer token (extension) or cookies (dashboard)
export async function createApiClient(
  request: Request
): Promise<{ supabase: SupabaseClient; user: { id: string } } | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createClientWithToken(token);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (user) return { supabase, user };
    return null;
  }

  // Fall back to cookie-based auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { supabase, user };
  return null;
}
