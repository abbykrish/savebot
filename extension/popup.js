const saveBtn = document.getElementById("saveBtn");
const result = document.getElementById("result");
const pageTitle = document.getElementById("pageTitle");
const pageUrl = document.getElementById("pageUrl");
const dashboardLink = document.getElementById("dashboardLink");
const authSection = document.getElementById("authSection");
const loggedInSection = document.getElementById("loggedInSection");
const loggedInAs = document.getElementById("loggedInAs");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

async function getConfig() {
  const stored = await chrome.storage.local.get(["apiBase", "accessToken", "email"]);
  return {
    apiBase: stored.apiBase || "https://savebot-nine.vercel.app",
    accessToken: stored.accessToken || null,
    email: stored.email || null,
  };
}

// Validate stored token by attempting a refresh; returns true if session is valid
async function validateSession() {
  const stored = await chrome.storage.local.get(["refreshToken", "anonKey", "supabaseUrl", "apiBase"]);
  if (!stored.refreshToken) return false;

  const apiBase = stored.apiBase || "https://savebot-nine.vercel.app";
  const supabaseUrl = stored.supabaseUrl || "https://coirzeiwdjawjcyotdjj.supabase.co";

  let anonKey = stored.anonKey;
  if (!anonKey) {
    try {
      const res = await fetch(`${apiBase}/api/config`);
      const data = await res.json();
      anonKey = data.anonKey;
    } catch {
      return false;
    }
  }
  if (!anonKey) return false;

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
      return true;
    }
  } catch {
    // refresh failed
  }
  return false;
}

// Check auth state on load
(async () => {
  const config = await getConfig();

  dashboardLink.href = `${config.apiBase}/dashboard`;
  dashboardLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: dashboardLink.href });
  });

  if (config.accessToken) {
    // Token exists — refresh it to make sure it's still valid
    const valid = await validateSession();
    if (valid) {
      showLoggedIn(config.email);
    } else {
      // Stale session — clear and show login
      await chrome.storage.local.remove(["accessToken", "refreshToken", "email"]);
      showLoggedOut();
    }
  } else {
    showLoggedOut();
  }
})();

function showLoggedIn(email) {
  authSection.style.display = "none";
  loggedInSection.style.display = "block";
  loggedInAs.textContent = `Signed in as ${email}`;

  // Load current tab info
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      pageTitle.textContent = tab.title || "Untitled";
      pageUrl.textContent = tab.url;
      saveBtn.disabled = false;
    }
  });
}

function showLoggedOut() {
  authSection.style.display = "block";
  loggedInSection.style.display = "none";
}

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  loginBtn.textContent = "Signing in...";
  loginBtn.disabled = true;

  const config = await getConfig();

  try {
    // Sign in directly with Supabase REST API
    const res = await fetch(
      `${config.apiBase.includes("localhost") ? "https://coirzeiwdjawjcyotdjj.supabase.co" : "https://coirzeiwdjawjcyotdjj.supabase.co"}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: await getAnonKey(config.apiBase),
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (data.access_token) {
      await chrome.storage.local.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        email: email,
        supabaseUrl: "https://coirzeiwdjawjcyotdjj.supabase.co",
      });
      showLoggedIn(email);
    } else {
      showResult(data.error_description || "Sign in failed", "error");
    }
  } catch (err) {
    showResult(err.message, "error");
  }

  loginBtn.textContent = "Sign in";
  loginBtn.disabled = false;
});

// Get the anon key from the app's config endpoint
async function getAnonKey(apiBase) {
  // We know the Supabase anon key — it's public (publishable)
  // Read it from storage or use the one embedded in the app
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
    // fallback — user can set it manually
  }
  return "";
}

// Logout
logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "refreshToken", "email"]);
  showLoggedOut();
});

// Save
saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  result.style.display = "none";

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  chrome.runtime.sendMessage(
    { action: "save", data: { url: tab.url, title: tab.title } },
    (response) => {
      if (response?.success) {
        showResult("Saved!", "success");
      } else if (response?.duplicate) {
        showResult("Already saved", "duplicate");
      } else {
        showResult(response?.error || "Failed to save", "error");
      }
      saveBtn.textContent = "Save this page";
      saveBtn.disabled = false;
    }
  );
});

function showResult(message, type) {
  result.textContent = message;
  result.className = `result ${type}`;
  result.style.display = "block";
}
