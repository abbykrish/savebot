if (typeof importScripts === "function") importScripts("config.js");

// Listen for messages from popup
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

// Handle Ctrl+Shift+S keyboard shortcut via Commands API
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-highlight") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // Get the selected text from the active tab
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString().trim() || "",
  });

  const selection = result?.result;
  if (!selection) return;

  const response = await saveHighlight({
    url: tab.url,
    title: tab.title,
    highlight: selection,
  });

  // Show notification on the page
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (msg, isError) => {
      const el = document.createElement("div");
      el.textContent = msg;
      Object.assign(el.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "system-ui, sans-serif",
        color: "white",
        backgroundColor: isError ? "#ef4444" : "#22c55e",
        zIndex: "999999",
        transition: "opacity 0.3s",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      });
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 300);
      }, 2000);
    },
    args: [
      response.success ? "Highlight saved!" : "Failed to save highlight",
      !response.success,
    ],
  });
});

// Helper: make an authenticated API request with automatic token refresh on 401
async function authFetch(endpoint, body) {
  const config = await getConfig();
  if (!config.accessToken) {
    return { response: null, error: "Not signed in. Open the extension popup to sign in." };
  }

  let token = config.accessToken;
  let response = await fetch(`${config.apiBase}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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
        body: JSON.stringify(body),
      });
    }
  }

  if (response.status === 401) {
    await chrome.storage.local.remove(["accessToken", "refreshToken", "email"]);
    return { response: null, error: "Session expired. Please sign in again." };
  }

  return { response, error: null };
}

async function savePage({ url, title }) {
  const lowerUrl = url.toLowerCase();
  const isPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes("arxiv.org/pdf/");
  const endpoint = isPdf ? "/api/save-pdf" : "/api/save";

  try {
    const { response, error } = await authFetch(endpoint, { url, title });
    if (error) return { success: false, error };

    const data = await response.json();

    if (response.status === 409) {
      return { success: false, duplicate: true, id: data.id };
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
  try {
    const { response, error } = await authFetch("/api/save", { url, title, highlight });
    if (error) return { success: false, error };

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return { success: true, save: data.save };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
