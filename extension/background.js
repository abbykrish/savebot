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

    const response = await fetch(`${config.apiBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ url, title }),
    });

    const data = await response.json();

    if (response.status === 409) {
      return { success: false, duplicate: true, id: data.id };
    }

    if (response.status === 401) {
      // Token expired — clear it so popup shows login
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
    const response = await fetch(`${config.apiBase}/api/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ url, title, highlight }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, save: data.save };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
