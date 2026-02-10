// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "save") {
    savePage(message.data).then(sendResponse);
    return true;
  }
  if (message.action === "saveHighlight") {
    saveHighlight(message.data).then(sendResponse);
    return true;
  }
});

async function getConfig() {
  const stored = await chrome.storage.local.get(["apiBase", "accessToken"]);
  return {
    apiBase: stored.apiBase || "http://localhost:3000",
    accessToken: stored.accessToken || null,
  };
}

// Refresh the access token using the stored refresh token
async function refreshAccessToken() {
  const stored = await chrome.storage.local.get(["refreshToken", "apiBase"]);
  if (!stored.refreshToken) return null;

  const apiBase = stored.apiBase || "http://localhost:3000";

  try {
    // Get the anon key for the Supabase API call
    let anonKey = (await chrome.storage.local.get("anonKey")).anonKey;
    if (!anonKey) {
      const res = await fetch(`${apiBase}/api/config`);
      const data = await res.json();
      anonKey = data.anonKey;
    }
    if (!anonKey) return null;

    // Get the Supabase URL
    let supabaseUrl = (await chrome.storage.local.get("supabaseUrl")).supabaseUrl;
    if (!supabaseUrl) {
      const res = await fetch(`${apiBase}/api/config`);
      const data = await res.json();
      supabaseUrl = data.supabaseUrl;
    }
    if (!supabaseUrl) return null;

    const res = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
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
    // Refresh failed
  }

  return null;
}

async function savePage({ url, title }) {
  const config = await getConfig();

  if (!config.accessToken) {
    return { success: false, error: "Not signed in. Open the extension popup to sign in." };
  }

  try {
    const lowerUrl = url.toLowerCase();
    const isPdf =
      lowerUrl.endsWith(".pdf") ||
      lowerUrl.includes("arxiv.org/pdf/");
    const endpoint = isPdf ? "/api/save-pdf" : "/api/save";

    let token = config.accessToken;
    let response = await fetch(`${config.apiBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, title }),
    });

    // Token expired — try refreshing before giving up
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
        response = await fetch(`${config.apiBase}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, title }),
        });
      }
    }

    const data = await response.json();

    if (response.status === 409) {
      return { success: false, duplicate: true, id: data.id };
    }

    if (response.status === 401) {
      // Refresh also failed — clear tokens and require re-login
      await chrome.storage.local.remove(["accessToken", "refreshToken", "email"]);
      return { success: false, error: "Session expired. Please sign in again." };
    }

    if (!response.ok) {
      return { success: false, error: data.error || `Server error: ${response.status}` };
    }

    return { success: true, save: data.save };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveHighlight({ url, title, highlight }) {
  const config = await getConfig();

  if (!config.accessToken) {
    return { success: false, error: "Not signed in" };
  }

  try {
    let token = config.accessToken;
    let response = await fetch(`${config.apiBase}/api/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, title, highlight }),
    });

    // Token expired — try refreshing before giving up
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
        response = await fetch(`${config.apiBase}/api/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, title, highlight }),
        });
      }
    }

    const data = await response.json();

    if (response.status === 401) {
      await chrome.storage.local.remove(["accessToken", "refreshToken", "email"]);
      return { success: false, error: "Session expired. Please sign in again." };
    }

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, save: data.save };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
