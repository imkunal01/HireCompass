// HireCompass Browser Extension Background Service Worker (Manifest V3)

const DEFAULT_HOST = "http://localhost:3000";

// Fast, non-blocking host and token lookup
async function getHostAndToken() {
  let host = DEFAULT_HOST;
  let token = null;

  try {
    const data = await chrome.storage.local.get(["customHost", "manualToken"]);
    if (data.customHost) {
      host = data.customHost.replace(/\/+$/, "");
    }
    if (data.manualToken) {
      token = data.manualToken;
      return { host, token };
    }
  } catch (err) {
    console.warn("[HireCompass] Storage read error:", err);
  }

  // Look for auth-token cookie across localhost and 127.0.0.1
  try {
    const urls = [
      `${host}/`,
      "http://localhost:3000/",
      "http://localhost:3001/",
      "http://localhost/",
      "http://127.0.0.1:3000/",
      "http://127.0.0.1:3001/",
      "http://127.0.0.1/",
    ];

    for (const u of urls) {
      try {
        const cookie = await chrome.cookies.get({ url: u, name: "auth-token" });
        if (cookie && cookie.value) {
          token = cookie.value;
          chrome.storage.local.set({ manualToken: token });
          break;
        }
      } catch (e) {}
    }

    if (!token) {
      const allCookies = await chrome.cookies.getAll({ name: "auth-token" });
      if (allCookies && allCookies.length > 0) {
        const match =
          allCookies.find((c) => c.domain.includes("localhost") || host.includes(c.domain)) ||
          allCookies[0];
        if (match && match.value) {
          token = match.value;
          chrome.storage.local.set({ manualToken: token });
        }
      }
    }
  } catch (err) {
    console.warn("[HireCompass] Cookie lookup warning:", err);
  }

  return { host, token };
}

// Safely query open tabs for an active HireCompass session
async function syncFromOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      const u = tab.url.toLowerCase();
      if (u.includes("localhost") || u.includes("127.0.0.1") || tab.title?.toLowerCase().includes("hirecompass")) {
        try {
          let tabOrigin = DEFAULT_HOST;
          try {
            tabOrigin = new URL(tab.url).origin;
          } catch (e) {}

          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
              try {
                const res = await fetch("/api/extension/token", { credentials: "include" });
                if (res.ok) {
                  const data = await res.json();
                  return data.token || null;
                }
              } catch (e) {}
              return null;
            },
          });

          const tabToken = results?.[0]?.result;
          if (tabToken) {
            await chrome.storage.local.set({ manualToken: tabToken, customHost: tabOrigin });
            return tabToken;
          }
        } catch (scriptErr) {
          // Tab may not allow scripting
        }
      }
    }
  } catch (err) {
    console.warn("[HireCompass] Tab sync warning:", err);
  }
  return null;
}

// Update extension icon badge with pending reminders/alerts
async function updateBadgeCount() {
  try {
    const { host, token } = await getHostAndToken();
    if (!token) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const res = await fetch(`${host}/api/extension/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const count = (data.reminders && data.reminders.length) || 0;
      if (count > 0) {
        chrome.action.setBadgeText({ text: String(count) });
        chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    }
  } catch (e) {
    // Ignore network errors in background polling
  }
}

// Listen for cookie changes on auth-token to automatically connect upon browser login
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name === "auth-token") {
    if (!changeInfo.removed && changeInfo.cookie.value) {
      chrome.storage.local.set({ manualToken: changeInfo.cookie.value });
    }
    updateBadgeCount();
    chrome.runtime.sendMessage({ action: "COOKIE_CHANGED", cookie: changeInfo.cookie }).catch(() => {});
  }
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_AUTH") {
    getHostAndToken()
      .then(sendResponse)
      .catch((err) => sendResponse({ host: DEFAULT_HOST, token: null, error: err.message }));
    return true;
  }

  // Content script reports newly synced token
  if (request.action === "SYNC_TOKEN" && request.token) {
    const updates = { manualToken: request.token };
    if (request.host) {
      updates.customHost = request.host.replace(/\/+$/, "");
    }
    chrome.storage.local.set(updates).then(() => {
      updateBadgeCount();
      chrome.runtime.sendMessage({ action: "TOKEN_SYNCED" }).catch(() => {});
    });
    sendResponse({ ok: true });
    return true;
  }

  // Active sync trigger from popup
  if (request.action === "DETECT_AND_SYNC") {
    (async () => {
      try {
        if (request.force) {
          await chrome.storage.local.remove("manualToken");
        }
        let auth = await getHostAndToken();
        if (!auth.token) {
          const tabToken = await syncFromOpenTabs();
          if (tabToken) {
            auth.token = tabToken;
          }
        }
        updateBadgeCount();
        sendResponse(auth);
      } catch (err) {
        sendResponse({ host: DEFAULT_HOST, token: null, error: err.message });
      }
    })();
    return true;
  }

  // Direct login from extension popup
  if (request.action === "LOGIN_DIRECT") {
    (async () => {
      try {
        const { host } = await getHostAndToken();
        const candidateHosts = [host, "http://localhost:3000", "http://127.0.0.1:3000"];
        let lastError = null;
        let successData = null;
        let successfulHost = host;

        for (const h of candidateHosts) {
          try {
            const res = await fetch(`${h}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: request.email, password: request.password }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
              successData = data;
              successfulHost = h;
              break;
            } else if (data.error) {
              lastError = data.error;
            }
          } catch (fetchErr) {
            lastError = fetchErr.message;
          }
        }

        if (successData && successData.token) {
          await chrome.storage.local.set({
            manualToken: successData.token,
            customHost: successfulHost,
          });
          updateBadgeCount();
          sendResponse({ ok: true, user: successData.user });
        } else {
          sendResponse({ ok: false, error: lastError || "Invalid email or password" });
        }
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.action === "API_CALL") {
    (async () => {
      try {
        const { host, token } = await getHostAndToken();
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}`, "x-hirecompass-token": token } : {}),
        };

        const fetchOptions = {
          method: request.method || "GET",
          headers,
          credentials: "include",
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        };

        let res = null;
        try {
          res = await fetch(`${host}${request.endpoint}`, fetchOptions);
        } catch (initialErr) {
          // If localhost failed, try 127.0.0.1 (or vice versa)
          const altHost = host.includes("localhost")
            ? host.replace("localhost", "127.0.0.1")
            : host.replace("127.0.0.1", "localhost");
          try {
            res = await fetch(`${altHost}${request.endpoint}`, fetchOptions);
            if (res) {
              await chrome.storage.local.set({ customHost: altHost });
            }
          } catch (altErr) {
            sendResponse({ ok: false, status: 0, error: `Could not reach ${host}. Is the server running?` });
            return;
          }
        }

        if (res) {
          const data = await res.json().catch(() => ({}));
          sendResponse({ ok: res.ok, status: res.status, data });

          if (request.endpoint.includes("/import") || request.endpoint.includes("/status")) {
            updateBadgeCount();
          }
        } else {
          sendResponse({ ok: false, status: 0, error: "No response from server" });
        }
      } catch (err) {
        sendResponse({ ok: false, status: 0, error: err.message });
      }
    })();
    return true;
  }

  if (request.action === "REFRESH_BADGE") {
    updateBadgeCount().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
});

// Periodic badge refresh every 15 minutes
chrome.alarms.create("badgeRefresh", { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "badgeRefresh") {
    updateBadgeCount();
  }
});

// Handle Quick-Import Keyboard Shortcut (Alt+Shift+H)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "quick-import") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_QUICK_IMPORT" });
    }
  }
});

// Initial badge check on startup
updateBadgeCount();
