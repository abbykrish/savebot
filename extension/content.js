// ── Auto-Save on Linger ──────────────────────────────────────────────

function showAutoSaveNotification(message) {
  const el = document.createElement("div");
  el.textContent = message;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "system-ui, sans-serif",
    color: "#f9fafb",
    backgroundColor: "#4b5563",
    zIndex: "999999",
    transition: "opacity 0.3s",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  });
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

function isBlockedUrl(url) {
  const blocked = [
    /^chrome/,
    /^chrome-extension/,
    /^about:/,
    /^edge:/,
    /^moz-extension:/,
    // Search engines (home/results pages)
    /^https?:\/\/(www\.)?google\.\w+\/(search|$|\?)/,
    /^https?:\/\/(www\.)?bing\.com\/(search|$|\?)/,
    /^https?:\/\/(www\.)?duckduckgo\.com\/(\?|$)/,
    // Social media feeds (not individual posts)
    /^https?:\/\/(www\.)?twitter\.com\/(home|explore|notifications|messages)/,
    /^https?:\/\/(www\.)?x\.com\/(home|explore|notifications|messages)/,
    /^https?:\/\/(www\.)?facebook\.com\/($|\?)/,
    /^https?:\/\/(www\.)?instagram\.com\/($|\?)/,
    /^https?:\/\/(www\.)?reddit\.com\/($|\?)/,
    /^https?:\/\/(www\.)?youtube\.com\/(feed|$|\?)/,
    /^https?:\/\/(www\.)?tiktok\.com\/(foryou|explore|$|\?)/,
    /^https?:\/\/(www\.)?linkedin\.com\/(feed|$|\?)/,
    // Email
    /^https?:\/\/mail\.google\.com/,
    /^https?:\/\/outlook\.(live|office)\.com/,
    // Video calls & meetings
    /^https?:\/\/meet\.google\.com/,
    /^https?:\/\/([\w-]+\.)?zoom\.us/,
    /^https?:\/\/teams\.microsoft\.com/,
    // Productivity & workspace tools
    /^https?:\/\/docs\.google\.com/,
    /^https?:\/\/sheets\.google\.com/,
    /^https?:\/\/slides\.google\.com/,
    /^https?:\/\/drive\.google\.com/,
    /^https?:\/\/calendar\.google\.com/,
    /^https?:\/\/keep\.google\.com/,
    /^https?:\/\/([\w-]+\.)?notion\.so/,
    /^https?:\/\/([\w-]+\.)?slack\.com/,
    /^https?:\/\/([\w-]+\.)?discord\.com/,
    /^https?:\/\/([\w-]+\.)?figma\.com/,
    /^https?:\/\/([\w-]+\.)?canva\.com/,
    /^https?:\/\/([\w-]+\.)?trello\.com/,
    /^https?:\/\/([\w-]+\.)?asana\.com/,
    /^https?:\/\/([\w-]+\.)?linear\.app/,
    /^https?:\/\/([\w-]+\.)?jira\.atlassian\.com/,
    /^https?:\/\/([\w-]+\.)?miro\.com/,
    /^https?:\/\/([\w-]+\.)?airtable\.com/,
    /^https?:\/\/([\w-]+\.)?dropbox\.com/,
    /^https?:\/\/([\w-]+\.)?1password\.com/,
    // AI chatbots
    /^https?:\/\/claude\.ai/,
    /^https?:\/\/gemini\.google\.com/,
    /^https?:\/\/chatgpt\.com/,
    /^https?:\/\/chat\.openai\.com/,
    /^https?:\/\/(www\.)?perplexity\.ai/,
    /^https?:\/\/copilot\.microsoft\.com/,
    /^https?:\/\/poe\.com/,
    /^https?:\/\/(www\.)?character\.ai/,
    // Localhost
    /^https?:\/\/(localhost|127\.0\.0\.1)/,
  ];
  return blocked.some((re) => re.test(url));
}

let _lingerCleanup = null;

function startLingerTracker(thresholdMs) {
  // Clean up any previous tracker
  if (_lingerCleanup) _lingerCleanup();

  let accumulatedMs = 0;
  let lastInteraction = Date.now();
  let autoSaved = false;

  function onActivity() {
    lastInteraction = Date.now();
  }

  // Throttle activity listeners to once per second
  let throttled = false;
  function onActivityThrottled() {
    if (throttled) return;
    throttled = true;
    onActivity();
    setTimeout(() => { throttled = false; }, 1000);
  }

  const events = ["scroll", "mousemove", "keydown", "click"];
  events.forEach((ev) => window.addEventListener(ev, onActivityThrottled, { passive: true }));

  const intervalId = setInterval(() => {
    if (autoSaved) return;
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastInteraction > 30000) return;
    accumulatedMs += 1000;

    if (accumulatedMs >= thresholdMs && !autoSaved) {
      autoSaved = true;
      cleanup();
      chrome.runtime.sendMessage(
        { action: "autoSave", data: { url: window.location.href, title: document.title } },
        (response) => {
          if (chrome.runtime.lastError) return;
          if (response?.success) {
            showAutoSaveNotification("Saved for later");
          }
          // duplicate or auth error → show nothing
        }
      );
    }
  }, 1000);

  function cleanup() {
    clearInterval(intervalId);
    events.forEach((ev) => window.removeEventListener(ev, onActivityThrottled));
    _lingerCleanup = null;
  }

  _lingerCleanup = cleanup;

  // Reset on SPA navigation
  function resetOnNavigation() {
    accumulatedMs = 0;
    autoSaved = false;
    lastInteraction = Date.now();
    if (isBlockedUrl(window.location.href)) {
      cleanup();
    }
  }

  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    resetOnNavigation();
  };
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    resetOnNavigation();
  };
  window.addEventListener("popstate", resetOnNavigation);
}

function teardownLingerTracker() {
  if (_lingerCleanup) _lingerCleanup();
}

// Initialize linger tracker
(async () => {
  const { autoSaveEnabled, autoSaveMinutes, accessToken } =
    await chrome.storage.local.get(["autoSaveEnabled", "autoSaveMinutes", "accessToken"]);

  if (!autoSaveEnabled || !accessToken || isBlockedUrl(window.location.href)) return;

  const minutes = autoSaveMinutes || 3;
  startLingerTracker(minutes * 60 * 1000);
})();

// Live settings: respond to changes while page is open
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.autoSaveEnabled || changes.autoSaveMinutes || changes.accessToken) {
    const { autoSaveEnabled, autoSaveMinutes, accessToken } =
      await chrome.storage.local.get(["autoSaveEnabled", "autoSaveMinutes", "accessToken"]);

    teardownLingerTracker();

    if (autoSaveEnabled && accessToken && !isBlockedUrl(window.location.href)) {
      const minutes = autoSaveMinutes || 3;
      startLingerTracker(minutes * 60 * 1000);
    }
  }
});

// ── Keyboard shortcut to save highlighted text ───────────────────────

// Listen for context menu / keyboard shortcut to save highlighted text
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Shift + S to save highlight
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
    e.preventDefault();
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      chrome.runtime.sendMessage(
        {
          action: "saveHighlight",
          data: {
            url: window.location.href,
            title: document.title,
            highlight: selection,
          },
        },
        (response) => {
          if (response?.success) {
            showNotification("Highlight saved!");
          } else {
            showNotification("Failed to save highlight", true);
          }
        }
      );
    }
  }
});

function showNotification(message, isError = false) {
  const el = document.createElement("div");
  el.textContent = message;
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
}
