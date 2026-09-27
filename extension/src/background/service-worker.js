// Inlined constants for simplicity
const API_BASE_URL = 'http://localhost:8000/api/v1';
const CACHE_PREFIX = 'senseweb_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MESSAGE_TYPES = {
  CAPTION_IMAGE: 'CAPTION_IMAGE',
  SIMPLIFY_TEXT: 'SIMPLIFY_TEXT',
  GET_PROFILE: 'GET_PROFILE',
  TOGGLE_PROFILE: 'TOGGLE_PROFILE',
  SCAN_PAGE: 'SCAN_PAGE',
  GET_STATUS: 'GET_STATUS'
};

// Cache utilities using chrome.storage.local
async function getCachedResult(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      const data = result[key];
      if (data && data.timestamp && (Date.now() - data.timestamp < CACHE_TTL_MS)) {
        resolve(data.value);
      } else {
        if (data) chrome.storage.local.remove(key); // clear expired
        resolve(null);
      }
    });
  });
}

async function setCachedResult(key, value) {
  return new Promise((resolve) => {
    const data = { value, timestamp: Date.now() };
    chrome.storage.local.set({ [key]: data }, resolve);
  });
}

async function clearExpiredCache() {
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const keysToRemove = [];
    for (const [key, data] of Object.entries(items)) {
      if (key.startsWith(CACHE_PREFIX) && data.timestamp && (now - data.timestamp >= CACHE_TTL_MS)) {
        keysToRemove.push(key);
      }
    }
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
    }
  });
}

// Installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SenseWeb AI installed.');
  clearExpiredCache();
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Helper to notify all tabs
async function notifyAllTabs(type, payload) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type, payload });
    } catch (e) {
      // Ignore errors for inactive tabs
    }
  }
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const { type, payload } = request;

      if (type === MESSAGE_TYPES.CAPTION_IMAGE) {
        const { image_url, context } = payload;
        const cacheKey = `${CACHE_PREFIX}caption_${btoa(image_url).substring(0, 50)}`;
        const cached = await getCachedResult(cacheKey);
        if (cached) {
          sendResponse({ caption: cached });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/caption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url, context })
        });
        const data = await response.json();
        
        if (data.caption) {
          await setCachedResult(cacheKey, data.caption);
        }
        sendResponse({ caption: data.caption });

      } else if (type === MESSAGE_TYPES.SIMPLIFY_TEXT) {
        const { text_block, mode } = payload;
        // simplistic hash for key
        const hash = text_block.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const cacheKey = `${CACHE_PREFIX}simplify_${mode}_${hash}`;
        
        const cached = await getCachedResult(cacheKey);
        if (cached) {
          sendResponse({ result_text: cached });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/simplify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text_block, mode })
        });
        const data = await response.json();
        
        if (data.result_text) {
          await setCachedResult(cacheKey, data.result_text);
        }
        sendResponse({ result_text: data.result_text });

      } else if (type === MESSAGE_TYPES.GET_PROFILE) {
        chrome.storage.sync.get(['profiles'], (result) => {
          sendResponse({ profiles: result.profiles || {} });
        });

      } else if (type === MESSAGE_TYPES.TOGGLE_PROFILE) {
        chrome.storage.sync.get(['profiles'], (result) => {
          const profiles = result.profiles || {};
          profiles[payload.profile] = payload.enabled;
          chrome.storage.sync.set({ profiles }, async () => {
            await notifyAllTabs(MESSAGE_TYPES.TOGGLE_PROFILE, { profiles });
            sendResponse({ success: true });
          });
        });

      } else if (type === MESSAGE_TYPES.GET_STATUS) {
        try {
          const response = await fetch('http://localhost:8000/health');
          if (response.ok) {
            sendResponse({ status: 'connected' });
          } else {
            sendResponse({ status: 'offline' });
          }
        } catch (e) {
          sendResponse({ status: 'offline' });
        }
      } else {
        sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error("Service worker error:", error);
      sendResponse({ error: error.message });
    }
  })();
  return true; // Keep message channel open for async response
});
