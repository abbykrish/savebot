const DEFAULT_API_BASE = "https://savebot.app";
const DEFAULT_SUPABASE_URL = "https://coirzeiwdjawjcyotdjj.supabase.co";

async function getConfig() {
  const stored = await chrome.storage.local.get(["apiBase", "accessToken", "email"]);
  return {
    apiBase: stored.apiBase || DEFAULT_API_BASE,
    accessToken: stored.accessToken || null,
    email: stored.email || null,
  };
}

async function getAnonKey(apiBase) {
  const stored = await chrome.storage.local.get("anonKey");
  if (stored.anonKey) return stored.anonKey;

  try {
    const res = await fetch(`${apiBase}/api/config`);
    const data = await res.json();
    if (data.anonKey) {
      await chrome.storage.local.set({ anonKey: data.anonKey });
      return data.anonKey;
    }
  } catch {
    // fallback
  }
  return "";
}

async function getSupabaseUrl() {
  const stored = await chrome.storage.local.get("supabaseUrl");
  return stored.supabaseUrl || DEFAULT_SUPABASE_URL;
}

// Refresh the access token using the stored refresh token.
// Returns the new token on success, null on failure.
async function refreshAccessToken() {
  const stored = await chrome.storage.local.get(["refreshToken", "apiBase"]);
  if (!stored.refreshToken) return null;

  const apiBase = stored.apiBase || DEFAULT_API_BASE;
  const anonKey = await getAnonKey(apiBase);
  if (!anonKey) return null;

  const supabaseUrl = await getSupabaseUrl();

  try {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ refresh_token: stored.refreshToken }),
      }
    );
    const data = await res.json();

    if (data.access_token) {
      await chrome.storage.local.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return data.access_token;
    }
  } catch {
    // refresh failed
  }
  return null;
}
